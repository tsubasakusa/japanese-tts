"""Japanese voice options for edge-tts."""

# Edge TTS Japanese voices
# Format: Display Name -> edge-tts voice ID
VOICE_OPTIONS = {
    "七海 (Nanami) - 女性": "ja-JP-NanamiNeural",
    "圭太 (Keita) - 男性": "ja-JP-KeitaNeural",
    "碧衣 (Aoi) - 女性": "ja-JP-AoiNeural",
    "大智 (Daichi) - 男性": "ja-JP-DaichiNeural",
    "真夕 (Mayu) - 女性": "ja-JP-MayuNeural",
    "直紀 (Naoki) - 男性": "ja-JP-NaokiNeural",
    "志織 (Shiori) - 女性": "ja-JP-ShioriNeural",
}


def get_voice_id(display_name: str) -> str:
    """Get the edge-tts voice ID from a display name."""
    return VOICE_OPTIONS.get(display_name, "ja-JP-NanamiNeural")
