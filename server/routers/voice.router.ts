/**
 * Voice Router
 * Handles voice transcription and audio upload
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { transcribeAudio } from "../_core/voiceTranscription";

export const voiceRouter = router({
  // Upload audio file and get URL
  upload: protectedProcedure
    .input(z.object({
      audioData: z.string(), // Base64 encoded audio
      mimeType: z.string(),
      extension: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { storagePut } = await import("../storage");
      
      // Decode base64 to buffer
      const audioBuffer = Buffer.from(input.audioData, "base64");
      
      // Generate unique filename
      const filename = `voice/${ctx.user.id}/${Date.now()}.${input.extension}`;
      
      // Upload to S3
      const { url } = await storagePut(filename, audioBuffer, input.mimeType);
      
      return { url };
    }),
  
  transcribe: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language,
      });
      if ('error' in result) {
        throw new Error(result.error);
      }
      return { text: result.text };
    }),
});

