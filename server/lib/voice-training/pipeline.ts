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

    // Reject if business greeting not found in first 10 seconds
    try {
      if (this.deepgram) {
        const { result } = await this.deepgram.listen.prerecorded.transcription(
          { url: recording.recordingUrl },
          { model: 'nova-2', smart_format: true, end_ms: 10000 }
        );
        const snippet = result?.results?.channels[0]?.alternatives[0]?.transcript || "";
        if (!snippet.toLowerCase().includes("johnson bros. plumbing")) {
          await storage.updateVoiceCallRecording(recordingId, { 
            status: 'rejected',
            metadata: { ...recording.metadata, rejectionReason: 'Greeting missing in first 10s' }
          });
          return;
        }
      }
    } catch (e) {
      console.error("Greeting check failed:", e);
    }

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

    // Pass 3: GPT-4 Coherence, Formatting, Intent & Mood Extraction
    let model = "gpt-4o";
    try {
      const modelSetting = await storage.getSystemSetting<{ primaryModel: string }>('ai_models');
      if (modelSetting?.primaryModel) {
        model = modelSetting.primaryModel;
      }
    } catch (e) {
      console.error("Failed to fetch model setting, falling back to gpt-4o", e);
    }

    const gptResponse = await openai.chat.completions.create({
      model: model,
      messages: [
          {
            role: "system",
            content: `You are an expert at cleaning up plumbing service call transcripts. 
            Convert the raw transcript into a structured JSONL format for OpenAI fine-tuning. 
            Separate Nate (the plumber/assistant) and the Customer (user). 
            Fix technical plumbing terms and addresses.
            
            EXTRACT KEY CONVERSATION COMPONENTS:
            - "intent": Primary reason for call
            - "mood": Customer's emotional state
            - "resolution": Was the issue resolved?
            - "outcome": Booking confirmed?
            - "upset_level": 1-10
            
            Also, suggest which dataset category this call belongs to:
            - "Core Booking": Standard appointments
            - "Emergency": Urgent/after-hours
            - "Pricing/Quotes": Nate giving estimates
            - "Objections": Handling pushback
            
            Assign a traffic light grade: "green" (perfect), "yellow" (needs fix), "red" (trash).
            Base grade on professional resolution and clarity.
            
            Return JSON format: { "messages": [...], "category": "...", "grade": "...", "confidence": 0.95, "analysis": { "intent": "...", "mood": "...", "resolution": "...", "outcome": "...", "upset_level": 0 } }`
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
        metadata: { 
          ...recording.metadata, 
          suggestedCategory: aiResult.category,
          analysis: aiResult.analysis 
        }
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
