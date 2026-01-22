import { Request, Response } from "express";
import { storage } from "../../storage";
import { transcriptionPipeline } from "./pipeline";

export async function handleTwilioRecording(req: Request, res: Response) {
  const { CallSid, RecordingUrl, RecordingDuration } = req.body;

  if (!CallSid || !RecordingUrl) {
    return res.status(400).send("Missing required Twilio parameters");
  }

  try {
    const recording = await storage.createVoiceCallRecording({
      twilioCallSid: CallSid,
      recordingUrl: RecordingUrl,
      duration: parseInt(RecordingDuration) || 0,
      status: 'pending',
      grade: 'gray',
      confidence: 0,
      metadata: {}
    });

    // Fire and forget transcription
    transcriptionPipeline.processCall(recording.id).catch(err => {
      console.error(`Pipeline failed for call ${CallSid}:`, err);
    });

    res.status(200).send("Recording received and pipeline triggered");
  } catch (error) {
    console.error("Error handling Twilio recording:", error);
    res.status(500).send("Internal Server Error");
  }
}
