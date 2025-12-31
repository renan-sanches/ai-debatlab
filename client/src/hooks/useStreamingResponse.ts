import { useState, useCallback, useRef } from "react";
import { getAccessToken } from "../lib/supabase";

interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface StreamingResponse {
  responseId?: number;
  modelId: string;
  modelName: string;
  content: string;
  isDevilsAdvocate: boolean;
  responseOrder: number;
  usage?: UsageInfo;
  isComplete: boolean;
  error?: string;
}

interface UseStreamingResponseOptions {
  onToken?: (token: string, modelId: string) => void;
  onComplete?: (response: StreamingResponse) => void;
  onError?: (error: string, modelId: string) => void;
}

export function useStreamingResponse(options: UseStreamingResponseOptions = {}) {
  const [streamingResponses, setStreamingResponses] = useState<Record<string, StreamingResponse>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async (
    debateId: number,
    roundId: number,
    modelId: string,
    responseOrder: number,
    useUserApiKey: boolean = false
  ): Promise<StreamingResponse | null> => {
    // Initialize streaming state for this model
    setStreamingResponses(prev => ({
      ...prev,
      [modelId]: {
        modelId,
        modelName: "",
        content: "",
        isDevilsAdvocate: false,
        responseOrder,
        isComplete: false,
      },
    }));

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Get access token for authentication (EventSource can't send headers, so we use query param)
    const token = await getAccessToken();

    return new Promise((resolve) => {
      let url = `/api/stream/debate/${debateId}/response?roundId=${roundId}&modelId=${encodeURIComponent(modelId)}&responseOrder=${responseOrder}&useUserApiKey=${useUserApiKey}`;

      // Add token as query parameter since EventSource doesn't support custom headers
      if (token) {
        url += `&token=${encodeURIComponent(token)}`;
      }

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "token") {
            setStreamingResponses(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                content: (prev[modelId]?.content || "") + data.content,
              },
            }));
            options.onToken?.(data.content, modelId);
          } else if (data.type === "complete") {
            const response: StreamingResponse = {
              responseId: data.responseId,
              modelId: data.modelId,
              modelName: data.modelName,
              content: data.content,
              isDevilsAdvocate: data.isDevilsAdvocate,
              responseOrder: data.responseOrder,
              usage: data.usage,
              isComplete: true,
            };

            setStreamingResponses(prev => ({
              ...prev,
              [modelId]: response,
            }));

            options.onComplete?.(response);
            eventSource.close();
            setIsStreaming(false);
            resolve(response);
          } else if (data.type === "error") {
            setStreamingResponses(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                error: data.message,
                isComplete: true,
              },
            }));

            options.onError?.(data.message, modelId);
            eventSource.close();
            setIsStreaming(false);
            resolve(null);
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        setStreamingResponses(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            error: "Connection error",
            isComplete: true,
          },
        }));
        options.onError?.("Connection error", modelId);
        eventSource.close();
        setIsStreaming(false);
        resolve(null);
      };

      // Handle abort
      abortControllerRef.current?.signal.addEventListener("abort", () => {
        eventSource.close();
        setIsStreaming(false);
        resolve(null);
      });
    });
  }, [options]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearResponses = useCallback(() => {
    setStreamingResponses({});
  }, []);

  return {
    streamingResponses,
    isStreaming,
    startStreaming,
    stopStreaming,
    clearResponses,
  };
}
