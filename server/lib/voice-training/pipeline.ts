import { storage } from "../../storage";
import { type VoiceTranscript } from "@shared/schema";
import { Deepgram } from "@deepgram/sdk";
import { openai } from "../openai";

export class TranscriptionPipeline {
  private deepgram: Deepgram | null = null;

  constructor() {
    if (process.env.DEEPGRAM_API_KEY) {
      this.deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
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
        const response = await this.deepgram.transcription.preRecorded(
          { url: recording.recordingUrl },
          { punctuate: true, utterances: true, diarize: true }
        );
        rawTranscript = response.results?.channels[0]?.alternatives[0]?.transcript || "";
        pass1Data = response;
      }

      // Pass 3: GPT-4 Coherence and Formatting
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at cleaning up plumbing service call transcripts. Convert the raw transcript into a structured JSONL format for OpenAI fine-tuning. Separate Nate (the plumber/assistant) and the Customer (user). Fix technical plumbing terms and addresses."
          },
          {
            role: "user",
            content: `Raw transcript: ${rawTranscript}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const cleanedContent = JSON.parse(response.choices[0].message.content || "{}");

      const transcript = await storage.createVoiceTranscript({
        recordingId,
        rawTranscript,
        cleanedTranscript: cleanedContent,
        pass1Data,
        pass2Data: {}, // Whisper can be added as a secondary pass if needed
        pass3Data: response
      });

      // Auto-grading logic
      const grade = this.calculateGrade(transcript);
      await storage.updateVoiceCallRecording(recordingId, { 
        status: 'completed',
        grade,
        confidence: recording.confidence || 0.9
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
