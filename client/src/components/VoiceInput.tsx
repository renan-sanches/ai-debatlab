import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({ onTranscription, disabled, className }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Upload audio mutation
  const uploadAudio = trpc.voice.upload.useMutation();
  
  // Transcribe mutation
  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      onTranscription(data.text);
      toast.success("Transcription complete!");
    },
    onError: (error) => {
      toast.error("Transcription failed: " + error.message);
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      
      streamRef.current = stream;
      
      // Determine best supported format
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "";
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        const audioBlob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || "audio/webm" 
        });
        
        // Check file size (16MB limit)
        const sizeMB = audioBlob.size / (1024 * 1024);
        if (sizeMB > 16) {
          toast.error("Recording too long. Please keep it under 2 minutes.");
          setIsProcessing(false);
          return;
        }

        try {
          // Convert blob to base64 for upload
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(",")[1];
            const extension = mediaRecorder.mimeType?.includes("mp4") ? "mp4" : "webm";
            
            try {
              // Upload audio file
              const uploadResult = await uploadAudio.mutateAsync({
                audioData: base64Data,
                mimeType: mediaRecorder.mimeType || "audio/webm",
                extension,
              });
              
              // Transcribe the uploaded audio
              await transcribeMutation.mutateAsync({
                audioUrl: uploadResult.url,
                language: "en",
              });
            } catch (error) {
              toast.error("Failed to process audio: " + (error as Error).message);
            } finally {
              setIsProcessing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          toast.error("Failed to process audio");
          setIsProcessing(false);
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      // Request data every second for smoother recording
      mediaRecorder.start(1000);
      setIsRecording(true);
      toast.info("Recording... Click again to stop and transcribe");
    } catch (error) {
      console.error("Microphone error:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, [uploadAudio, transcribeMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={className}
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : isRecording ? (
        <MicOff className="h-5 w-5 text-destructive animate-pulse" />
      ) : (
        <Mic className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      )}
    </Button>
  );
}
