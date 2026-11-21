"""
Generate word audio MP3s for the phonics game CVC words.
Phoneme sounds come from the ShowAndTellLetter pack (already in audio/phonics/).
This script only generates the 15 CVC word files.

Install: pip install edge-tts
Run:     python generate-word-audio.py
"""

import asyncio
import os
import edge_tts

VOICE = "en-US-JennyNeural"
OUT_DIR = "audio/phonics"

WORDS = ['cat', 'dog', 'sun', 'hat', 'pig', 'bus',
         'cup', 'hen', 'ant', 'owl', 'bee', 'map',
         'jam', 'net', 'pot']


async def save(word: str) -> None:
    path = f"{OUT_DIR}/{word}.mp3"
    comm = edge_tts.Communicate(word, VOICE, rate="-10%")
    await comm.save(path)
    print(f"  {word}.mp3")


async def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Voice: {VOICE}\nOutput: {OUT_DIR}\n")
    await asyncio.gather(*[save(w) for w in WORDS])
    print(f"\nDone! {len(WORDS)} word files generated.")


if __name__ == "__main__":
    asyncio.run(main())
