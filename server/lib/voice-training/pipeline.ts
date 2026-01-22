import { storage } from "../../storage";
import { type VoiceTranscript } from "@shared/schema";
import { createClient } from "@deepgram/sdk";
import { openai } from "../aiChat";

export class TranscriptionPipeline {
  private deepgram: any = null;

  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (apiKey) {
      this.deepgram = createClient(apiKey);
    }
  }

  async processCall(recordingId: number) {
    const recording = await storage.getVoiceCallRecording(recordingId);
    if (!recording || !recording.recordingUrl) return;

    await storage.updateVoiceCallRecording(recordingId, { status: 'processing' });

    try {
      let rawTranscript = "";
      let pass1Data = {};

      if (this.deepgram) {
        // Pass 1: Deepgram for fast transcription and diarization
        const { result, error } = await this.deepgram.listen.prerecorded.transcription(
          { url: recording.recordingUrl },
          { punctuate: true, utterances: true, diarize: true, model: 'nova-2', smart_format: true }
        );
        
        if (error) throw error;
        
        rawTranscript = result.results?.channels[0]?.alternatives[0]?.transcript || "";
        pass1Data = result;
      }

      // Pass 3: GPT-4 Coherence, Formatting, and Auto-Categorization
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at cleaning up plumbing service call transcripts. 
            Convert the raw transcript into a structured JSONL format for OpenAI fine-tuning. 
            Separate Nate (the plumber/assistant) and the Customer (user). 
            Fix technical plumbing terms and addresses.
            
            Also, suggest which dataset category this call belongs to:
            - "Core Booking": Standard appointments
            - "Emergency": Urgent/after-hours
            - "Pricing/Quotes": Nate giving estimates
            - "Objections": Handling pushback
            
            Assign a traffic light grade: "green" (perfect), "yellow" (needs fix), "red" (trash).
            
            Return JSON format: { "messages": [...], "category": "...", "grade": "...", "confidence": 0.95 }`
          },
          {
            role: "user",
            content: `Raw transcript: ${rawTranscript}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiResult = JSON.parse(gptResponse.choices[0].message.content || "{}");

      const transcript = await storage.createVoiceTranscript({
        recordingId,
        rawTranscript,
        cleanedTranscript: aiResult,
        pass1Data,
        pass2Data: {},
        pass3Data: aiResult
      });

      // Update recording with AI suggestions
      await storage.updateVoiceCallRecording(recordingId, { 
        status: 'completed',
        grade: aiResult.grade || 'gray',
        confidence: aiResult.confidence || 0.9,
        metadata: { ...recording.metadata, suggestedCategory: aiResult.category }
      });

      return transcript;
    } catch (error) {
      console.error("Transcription pipeline error:", error);
      await storage.updateVoiceCallRecording(recordingId, { status: 'failed' });
      throw error;
    }
  }

  private calculateGrade(transcript: VoiceTranscript): string {
    const length = transcript.rawTranscript?.length || 0;
    if (length > 200) return 'green';
    if (length > 50) return 'yellow';
    return 'red';
  }
}

export const transcriptionPipeline = new TranscriptionPipeline();
