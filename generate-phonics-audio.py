"""
Generate phonics audio using Microsoft's neural TTS (edge-tts).
Quality: same engine as Edge browser read-aloud — far better than Windows SAPI.

Install: pip install edge-tts
Run:     python generate-phonics-audio.py
"""

import asyncio
import os
import edge_tts

VOICE = "en-US-JennyNeural"   # clear, friendly female voice
OUT_DIR = "audio/phonics"

# For stops/approximants: "buh", "kuh" etc. — TTS reads naturally
# For fricatives/nasals: longer strings so TTS renders a continuous sound
# (neural TTS reads "ffffff" as prolonged /f/, unlike Windows SAPI which said "eff eff eff")
PHONEMES = {
    'a': 'aah',      # /æ/
    'b': 'buh',
    'c': 'kuh',
    'd': 'duh',
    'e': 'eh',
    'f': 'ffffff',   # prolonged /f/
    'g': 'guh',
    'h': 'huh',
    'i': 'ih',
    'j': 'juh',
    'k': 'kuh',
    'l': 'llll',     # prolonged /l/
    'm': 'mmmm',     # prolonged /m/
    'n': 'nnnn',     # prolonged /n/
    'o': 'aw',
    'p': 'puh',
    'q': 'kwuh',
    'r': 'rrrr',     # prolonged /r/
    's': 'sssss',    # prolonged /s/ — neural TTS renders as hiss, not letter names
    't': 'tuh',
    'u': 'uh',
    'v': 'vvvv',     # prolonged /v/
    'w': 'wuh',
    'x': 'ksss',     # /k/ + /s/
    'y': 'yuh',
    'z': 'zzzz',     # prolonged /z/
}

WORDS = ['cat', 'dog', 'sun', 'hat', 'pig', 'bus',
         'cup', 'hen', 'ant', 'owl', 'bee', 'map',
         'jam', 'net', 'pot']


async def save_audio(text: str, path: str, rate: str = "-15%") -> None:
    comm = edge_tts.Communicate(text, VOICE, rate=rate)
    await comm.save(path)
    print(f"  {os.path.basename(path)}")


async def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Voice : {VOICE}")
    print(f"Output: {OUT_DIR}\n")

    print("Phoneme sounds:")
    phoneme_tasks = [
        save_audio(text, f"{OUT_DIR}/{letter}.mp3", rate="-20%")
        for letter, text in PHONEMES.items()
    ]
    await asyncio.gather(*phoneme_tasks)

    print("\nWord sounds:")
    word_tasks = [
        save_audio(word, f"{OUT_DIR}/{word}.mp3", rate="-10%")
        for word in WORDS
    ]
    await asyncio.gather(*word_tasks)

    total = len(PHONEMES) + len(WORDS)
    print(f"\nDone! {total} MP3 files in {OUT_DIR}/")
    print("Next: commit audio/ folder and push.")


if __name__ == "__main__":
    asyncio.run(main())
