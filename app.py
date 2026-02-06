import streamlit as st
import asyncio
import edge_tts
import tempfile
import os
import io
import base64
import json
import re
from pathlib import Path

from extract import extract_text_from_file
from voices import VOICE_OPTIONS, get_voice_id

st.set_page_config(
    page_title="日本語 TTS - Japanese Text-to-Speech",
    page_icon="🎙️",
    layout="wide",
)

st.title("日本語テキスト読み上げツール")
st.caption("Japanese Text-to-Speech Tool — PDF・TXT・画像からテキストを抽出し、音声を生成")

# --- Session state initialization ---
if "segments" not in st.session_state:
    st.session_state.segments = []
if "audio_files" not in st.session_state:
    st.session_state.audio_files = []
if "extracted_raw" not in st.session_state:
    st.session_state.extracted_raw = ""
if "extraction_done" not in st.session_state:
    st.session_state.extraction_done = False


# --- Sidebar: API key and voice settings ---
with st.sidebar:
    st.header("設定 / Settings")

    api_provider = st.selectbox(
        "AI プロバイダー / AI Provider",
        ["OpenAI (GPT-4o)", "Anthropic (Claude)"],
        help="画像・PDFからテキスト抽出に使用するAIモデル",
    )

    if api_provider == "OpenAI (GPT-4o)":
        api_key = st.text_input(
            "OpenAI API Key",
            type="password",
            value=os.environ.get("OPENAI_API_KEY", ""),
        )
    else:
        api_key = st.text_input(
            "Anthropic API Key",
            type="password",
            value=os.environ.get("ANTHROPIC_API_KEY", ""),
        )

    st.divider()
    st.header("デフォルト音声 / Default Voice")
    default_voice = st.selectbox(
        "声を選択",
        list(VOICE_OPTIONS.keys()),
        index=0,
    )

    st.divider()
    st.header("音声設定 / Audio Settings")
    speech_rate = st.slider("速度 / Speed", min_value=-50, max_value=50, value=0, step=5)
    speech_pitch = st.slider("ピッチ / Pitch", min_value=-50, max_value=50, value=0, step=5)

    rate_str = f"+{speech_rate}%" if speech_rate >= 0 else f"{speech_rate}%"
    pitch_str = f"+{speech_pitch}Hz" if speech_pitch >= 0 else f"{speech_pitch}Hz"


# --- Step 1: File Upload ---
st.header("① ファイルアップロード / Upload File")

content_type = st.selectbox(
    "コンテンツの種類 / Content Type",
    ["ニュース / News", "対話 / Dialogue", "漫画 / Manga", "一般テキスト / General"],
    help="内容の種類によって抽出方法が変わります",
)

uploaded_file = st.file_uploader(
    "ファイルを選択してください",
    type=["pdf", "txt", "jpg", "jpeg", "png"],
    help="PDF、テキスト、画像ファイルをアップロード",
)

if uploaded_file is not None:
    file_info_col, preview_col = st.columns([1, 2])
    with file_info_col:
        st.write(f"**ファイル名:** {uploaded_file.name}")
        st.write(f"**サイズ:** {uploaded_file.size / 1024:.1f} KB")
        st.write(f"**種類:** {uploaded_file.type}")

    with preview_col:
        if uploaded_file.type in ["image/jpeg", "image/png", "image/jpg"]:
            st.image(uploaded_file, caption="アップロードされた画像", width=300)


# --- Step 2: Extract text ---
st.header("② テキスト抽出 / Extract Text")

if uploaded_file is not None:
    if st.button("テキストを抽出する / Extract Text", type="primary"):
        if not api_key and uploaded_file.type != "text/plain":
            st.error("画像やPDFからテキストを抽出するにはAPIキーが必要です。サイドバーで設定してください。")
        else:
            with st.spinner("テキストを抽出中... / Extracting text..."):
                try:
                    provider = "openai" if "OpenAI" in api_provider else "anthropic"
                    extracted = extract_text_from_file(
                        uploaded_file, content_type, api_key, provider
                    )
                    st.session_state.extracted_raw = extracted
                    # Parse into segments
                    lines = [l.strip() for l in extracted.strip().split("\n") if l.strip()]
                    st.session_state.segments = [
                        {"text": line, "voice": default_voice} for line in lines
                    ]
                    st.session_state.extraction_done = True
                    st.session_state.audio_files = []
                    st.rerun()
                except Exception as e:
                    st.error(f"抽出エラー: {e}")
else:
    st.info("ファイルをアップロードしてください / Please upload a file first.")


# --- Step 3: Edit segments ---
if st.session_state.extraction_done and st.session_state.segments:
    st.header("③ テキスト編集 / Edit Text")
    st.caption("各セグメントの内容と声を編集できます。不要な行は削除できます。")

    segments_to_remove = []

    for i, seg in enumerate(st.session_state.segments):
        col_text, col_voice, col_del = st.columns([5, 2, 1])

        with col_text:
            new_text = st.text_input(
                f"セグメント {i + 1}",
                value=seg["text"],
                key=f"seg_text_{i}",
                label_visibility="collapsed",
            )
            st.session_state.segments[i]["text"] = new_text

        with col_voice:
            voice_keys = list(VOICE_OPTIONS.keys())
            current_idx = voice_keys.index(seg["voice"]) if seg["voice"] in voice_keys else 0
            new_voice = st.selectbox(
                f"声 {i + 1}",
                voice_keys,
                index=current_idx,
                key=f"seg_voice_{i}",
                label_visibility="collapsed",
            )
            st.session_state.segments[i]["voice"] = new_voice

        with col_del:
            if st.button("✕", key=f"seg_del_{i}", help="このセグメントを削除"):
                segments_to_remove.append(i)

    # Remove marked segments
    if segments_to_remove:
        st.session_state.segments = [
            s for idx, s in enumerate(st.session_state.segments)
            if idx not in segments_to_remove
        ]
        st.session_state.audio_files = []
        st.rerun()

    # Add new segment
    col_add1, col_add2 = st.columns([4, 1])
    with col_add2:
        if st.button("＋ 行を追加 / Add Row"):
            st.session_state.segments.append({"text": "", "voice": default_voice})
            st.rerun()


# --- Step 4: Generate audio ---
if st.session_state.extraction_done and st.session_state.segments:
    st.header("④ 音声生成 / Generate Audio")

    if st.button("すべての音声を生成 / Generate All Audio", type="primary"):
        st.session_state.audio_files = []
        progress_bar = st.progress(0)
        total = len(st.session_state.segments)

        for i, seg in enumerate(st.session_state.segments):
            text = seg["text"].strip()
            if not text:
                st.session_state.audio_files.append(None)
                continue

            voice_id = get_voice_id(seg["voice"])
            with st.spinner(f"セグメント {i + 1}/{total} を生成中..."):
                try:
                    audio_data = asyncio.run(
                        generate_audio(text, voice_id, rate_str, pitch_str)
                    )
                    st.session_state.audio_files.append(audio_data)
                except Exception as e:
                    st.error(f"セグメント {i + 1} のエラー: {e}")
                    st.session_state.audio_files.append(None)

            progress_bar.progress((i + 1) / total)

        st.success("音声生成完了！ / Audio generation complete!")
        st.rerun()


# --- Step 5: Preview and download ---
if st.session_state.audio_files:
    st.header("⑤ プレビュー・ダウンロード / Preview & Download")

    for i, (seg, audio) in enumerate(
        zip(st.session_state.segments, st.session_state.audio_files)
    ):
        if audio is None:
            continue

        col_info, col_audio, col_dl = st.columns([3, 4, 1])

        with col_info:
            display_text = seg["text"][:50] + "..." if len(seg["text"]) > 50 else seg["text"]
            st.write(f"**{i + 1}.** {display_text}")
            st.caption(f"声: {seg['voice']}")

        with col_audio:
            st.audio(audio, format="audio/mp3")

        with col_dl:
            st.download_button(
                label="💾",
                data=audio,
                file_name=f"segment_{i + 1:03d}.mp3",
                mime="audio/mp3",
                key=f"dl_{i}",
                help="この音声をダウンロード",
            )

    st.divider()

    # Download all as combined or zip
    if len([a for a in st.session_state.audio_files if a is not None]) > 1:
        all_audio = b"".join(a for a in st.session_state.audio_files if a is not None)
        st.download_button(
            label="📦 すべてダウンロード (結合MP3) / Download All (Combined MP3)",
            data=all_audio,
            file_name="all_segments_combined.mp3",
            mime="audio/mp3",
            type="primary",
        )


async def generate_audio(text: str, voice: str, rate: str, pitch: str) -> bytes:
    """Generate audio using edge-tts."""
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])

    buffer.seek(0)
    return buffer.read()
