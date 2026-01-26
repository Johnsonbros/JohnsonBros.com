# Speak - Text-to-Speech Skill

Read text aloud using Microsoft Edge neural voices. Use when the user wants to listen instead of reading.

## Usage

- `/s` or `/speak` - Read a summary of the last response
- `/s <text>` - Read specific text
- `/s file <path>` - Read a file
- `/s stop` - Stop playback

## Instructions

When the user invokes `/s` or `/speak`:

1. **Check for edge-tts**:
   ```bash
   which edge-tts 2>/dev/null
   ```

2. **If not installed**, tell the user:
   ```
   Run: pip3 install edge-tts --break-system-packages && sudo apt install mpv -y
   ```

3. **Determine what to speak**:
   - No arguments: Create a 2-3 sentence summary of your last response
   - With text: Use that text directly
   - With `file <path>`: Read first 2000 chars of the file
   - With `stop`: Run `pkill mpv`

4. **Generate and play audio**:
   ```bash
   edge-tts --text "Your text here" --write-media /tmp/tts.mp3 && mpv --no-video /tmp/tts.mp3 &
   ```

5. **Confirm**: Say "Speaking now..." (don't wait for playback to finish)

## Voice Options

Default voice is `en-US-AriaNeural` (female). Other options:
- `--voice en-US-GuyNeural` - Male voice
- `--voice en-GB-SoniaNeural` - British female
- `--rate +10%` - Faster
- `--rate -10%` - Slower

Example with options:
```bash
edge-tts --voice en-US-GuyNeural --rate +10% --text "Hello" --write-media /tmp/tts.mp3
```

## For Long Content

When content is long:
1. Summarize to key points (2-3 sentences max)
2. Offer to speak in chunks: "Want me to read the full version?"
3. For files, read the most relevant section

## Error Handling

If playback fails:
- Check WSL audio: May need PulseAudio (`pulseaudio --start`)
- Verify mpv installed: `sudo apt install mpv -y`
- Test manually: `edge-tts --text "test" --write-media /tmp/t.mp3 && mpv /tmp/t.mp3`

## Examples

User: `/s`
→ Summarize last response in 2-3 sentences, generate audio, play it

User: `/s The deployment was successful`
→ Speak that exact text

User: `/s file .context/BOARD.md`
→ Read a summary of that file's content

User: `/s stop`
→ Run `pkill mpv` to stop playback
