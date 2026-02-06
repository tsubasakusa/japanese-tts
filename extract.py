"""Text extraction from various file types using AI models."""

import base64
import io
import PyPDF2


# --- Content type prompts ---

PROMPTS = {
    "ニュース / News": """あなたはテキスト抽出の専門家です。
このファイルからニュースの本文内容のみを日本語で抽出してください。

ルール:
- ニュースの本文のみを抽出すること
- 広告、メニュー、ナビゲーション、フッターなどは除外すること
- 見出しは含めてよいが、補足説明や編集者のコメントは除外すること
- 各段落を改行で区切ること
- 余計な補足や説明は一切加えないこと
- 原文の日本語をそのまま抽出すること""",

    "対話 / Dialogue": """あなたはテキスト抽出の専門家です。
このファイルから対話（会話）の内容のみを日本語で抽出してください。

ルール:
- 対話の内容のみを抽出すること
- 各発言を1行ずつ記載すること
- 話者が分かる場合は「話者名: セリフ」の形式にすること
- ト書きや状況説明は除外すること
- 余計な補足や説明は一切加えないこと
- 原文の日本語をそのまま抽出すること""",

    "漫画 / Manga": """あなたはテキスト抽出の専門家です。
この漫画の画像からテキストを順番に抽出してください。

ルール:
- 右上から左下へ、コマの順番に従って抽出すること
- セリフは「キャラ名: セリフ」の形式にすること（キャラ名が分かる場合）
- 効果音は「[効果音: ドドド]」のように括弧で記載すること
- ナレーションは「[ナレーション: 内容]」のように記載すること
- 各テキスト要素を改行で区切ること
- 余計な補足や説明は一切加えないこと
- 原文の日本語をそのまま抽出すること""",

    "一般テキスト / General": """あなたはテキスト抽出の専門家です。
このファイルから日本語のテキストを抽出してください。

ルール:
- テキストの内容をそのまま抽出すること
- 意味のある段落ごとに改行で区切ること
- 余計な補足や説明は一切加えないこと
- 原文の日本語をそのまま抽出すること""",
}


def extract_text_from_file(
    uploaded_file, content_type: str, api_key: str, provider: str
) -> str:
    """Extract Japanese text from an uploaded file.

    Args:
        uploaded_file: Streamlit UploadedFile object
        content_type: One of the content type keys
        api_key: API key for the AI provider
        provider: "openai" or "anthropic"

    Returns:
        Extracted text as a string
    """
    file_type = uploaded_file.type

    # Plain text files - read directly, no API needed
    if file_type == "text/plain":
        return _extract_from_txt(uploaded_file)

    # PDF files
    if file_type == "application/pdf":
        return _extract_from_pdf(uploaded_file, content_type, api_key, provider)

    # Image files
    if file_type in ["image/jpeg", "image/png", "image/jpg"]:
        return _extract_from_image(uploaded_file, content_type, api_key, provider)

    raise ValueError(f"サポートされていないファイル形式です: {file_type}")


def _extract_from_txt(uploaded_file) -> str:
    """Extract text from a plain text file."""
    content = uploaded_file.read().decode("utf-8")
    uploaded_file.seek(0)
    return content


def _extract_from_pdf(uploaded_file, content_type: str, api_key: str, provider: str) -> str:
    """Extract text from a PDF file."""
    # First try direct text extraction
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(uploaded_file.read()))
    uploaded_file.seek(0)

    direct_text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            direct_text += page_text + "\n"

    # If we got meaningful text, use AI to clean/organize it
    if len(direct_text.strip()) > 50:
        return _process_text_with_ai(direct_text, content_type, api_key, provider)

    # Otherwise, convert pages to images and use vision API
    # For simplicity, send the raw PDF text or ask user to use image
    if direct_text.strip():
        return _process_text_with_ai(direct_text, content_type, api_key, provider)

    raise ValueError(
        "PDFからテキストを直接抽出できませんでした。"
        "画像として書き出してからアップロードしてみてください。"
    )


def _extract_from_image(
    uploaded_file, content_type: str, api_key: str, provider: str
) -> str:
    """Extract text from an image using vision AI."""
    image_bytes = uploaded_file.read()
    uploaded_file.seek(0)

    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Determine mime type
    mime_type = uploaded_file.type
    if mime_type == "image/jpg":
        mime_type = "image/jpeg"

    prompt = PROMPTS.get(content_type, PROMPTS["一般テキスト / General"])

    if provider == "openai":
        return _extract_image_openai(base64_image, mime_type, prompt, api_key)
    else:
        return _extract_image_anthropic(base64_image, mime_type, prompt, api_key)


def _extract_image_openai(
    base64_image: str, mime_type: str, prompt: str, api_key: str
) -> str:
    """Use OpenAI GPT-4o to extract text from an image."""
    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        },
                    },
                ],
            }
        ],
        max_tokens=4096,
    )

    return response.choices[0].message.content


def _extract_image_anthropic(
    base64_image: str, mime_type: str, prompt: str, api_key: str
) -> str:
    """Use Anthropic Claude to extract text from an image."""
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": base64_image,
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
    )

    return response.content[0].text


def _process_text_with_ai(
    raw_text: str, content_type: str, api_key: str, provider: str
) -> str:
    """Process raw text with AI to organize it according to content type."""
    prompt = PROMPTS.get(content_type, PROMPTS["一般テキスト / General"])
    full_prompt = f"{prompt}\n\n以下のテキストを処理してください:\n\n{raw_text}"

    if provider == "openai":
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": full_prompt}],
            max_tokens=4096,
        )
        return response.choices[0].message.content
    else:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": full_prompt}],
        )
        return response.content[0].text
