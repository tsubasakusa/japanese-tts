// ============================================================
// Japanese Text-to-Speech Tool - Main Application
// ============================================================

const VOICES = [
    { id: "alloy", name: "Alloy（中性）" },
    { id: "ash", name: "Ash（会話的）" },
    { id: "ballad", name: "Ballad（温かい）" },
    { id: "coral", name: "Coral（親しみやすい）" },
    { id: "echo", name: "Echo（滑らか）" },
    { id: "fable", name: "Fable（物語風）" },
    { id: "nova", name: "Nova（明るい）" },
    { id: "onyx", name: "Onyx（深い）" },
    { id: "sage", name: "Sage（落ち着き）" },
    { id: "shimmer", name: "Shimmer（楽観的）" },
];

const PROMPTS = {
    news: `あなたはOCR・テキスト抽出の専門家です。
この画像（スクリーンショット、写真、文書など形式を問わず）に表示されている日本語の本文を抽出してください。
画像はアプリのスクリーンショットやウェブページの写真である可能性がありますが、その中に表示されているテキスト本文を抽出してください。

重要: 必ずテキストを抽出してください。「抽出できません」という回答は禁止です。画像内に日本語テキストが見えれば、それをそのまま出力してください。

ルール:
- 記事・ニュースの本文のみを抽出すること
- UIボタン、メニュー、ナビゲーション、広告、フッターなどのUI要素は除外すること
- 見出しは含めてよい
- 各段落を改行で区切ること
- あなた自身の補足・説明・コメントは一切加えず、原文の日本語テキストだけを出力すること`,

    dialogue: `あなたはOCR・テキスト抽出の専門家です。
この画像（スクリーンショット、写真、文書など形式を問わず）に表示されている対話・会話の内容を日本語で抽出してください。
画像はアプリのスクリーンショットやウェブページの写真である可能性がありますが、その中に表示されている会話テキストを抽出してください。

重要: 必ずテキストを抽出してください。「抽出できません」という回答は禁止です。画像内に日本語テキストが見えれば、それをそのまま出力してください。

ルール:
- 対話・会話の内容のみを抽出すること
- 各発言を1行ずつ記載すること
- 話者が分かる場合は「話者名: セリフ」の形式にすること
- ト書きや状況説明は除外すること
- あなた自身の補足・説明・コメントは一切加えず、原文の日本語テキストだけを出力すること`,

    manga: `あなたはOCR・テキスト抽出の専門家であり、日本の漫画の読み方に精通しています。
この画像から漫画のテキストを正しい読み順で抽出してください。
画像はスクリーンショットや写真である可能性がありますが、その中に表示されている漫画のテキストを抽出してください。

重要: 必ずテキストを抽出してください。「抽出できません」という回答は禁止です。画像内に日本語テキストが見えれば、それをそのまま出力してください。

漫画の読み順ルール:
- 日本の漫画は右から左、上から下に読みます
- まずコマ（パネル）の順序を特定すること: 右上 → 左上 → 右下 → 左下
- 各コマ内のフキダシ（吹き出し）も右上から左下の順に読むこと
- コマの境界が不明確な場合は、テキストの位置関係（右上が先、左下が後）で判断すること

抽出ルール:
- セリフは「キャラ名: セリフ」の形式にすること（キャラ名が分かる場合）
- キャラ名が不明の場合はセリフだけを記載すること
- 効果音は「[効果音: ドドド]」のように括弧で記載すること
- ナレーション・モノローグは「[ナレーション: 内容]」のように記載すること
- 各テキスト要素を改行で区切ること
- あなた自身の補足・説明・コメントは一切加えず、原文の日本語テキストだけを出力すること`,

    general: `あなたはOCR・テキスト抽出の専門家です。
この画像（スクリーンショット、写真、文書など形式を問わず）に表示されている日本語テキストを抽出してください。
画像はアプリのスクリーンショットやウェブページの写真である可能性がありますが、その中に表示されているテキストを抽出してください。

重要: 必ずテキストを抽出してください。「抽出できません」という回答は禁止です。画像内に日本語テキストが見えれば、それをそのまま出力してください。

ルール:
- テキストの内容をそのまま抽出すること
- UIボタン、メニュー、ナビゲーションなどのUI要素は除外すること
- 意味のある段落ごとに改行で区切ること
- あなた自身の補足・説明・コメントは一切加えず、原文の日本語テキストだけを出力すること`,
};

// ============================================================
// State
// ============================================================

let uploadedFile = null;
let segments = [];        // [{ text, voice }]
let audioBlobs = [];      // [Blob | null]
let audioTimestamp = "";   // timestamp for file naming

// ============================================================
// DOM references
// ============================================================

const apiKeyInput = document.getElementById("api-key");
const toggleKeyBtn = document.getElementById("toggle-key-visibility");
const contentTypeSelect = document.getElementById("content-type");
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const uploadPreview = document.getElementById("upload-preview");
const previewImage = document.getElementById("preview-image");
const previewInfo = document.getElementById("preview-info");
const extractSection = document.getElementById("extract-section");
const extractBtn = document.getElementById("extract-btn");
const extractStatus = document.getElementById("extract-status");
const editSection = document.getElementById("edit-section");
const segmentsContainer = document.getElementById("segments-container");
const addSegmentBtn = document.getElementById("add-segment-btn");
const generateSection = document.getElementById("generate-section");
const ttsModelSelect = document.getElementById("tts-model");
const ttsSpeedInput = document.getElementById("tts-speed");
const speedValue = document.getElementById("speed-value");
const generateBtn = document.getElementById("generate-btn");
const generateProgress = document.getElementById("generate-progress");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const resultSection = document.getElementById("result-section");
const audioResults = document.getElementById("audio-results");
const downloadAllBtn = document.getElementById("download-all-btn");

// ============================================================
// Persist API key in sessionStorage
// ============================================================

apiKeyInput.value = sessionStorage.getItem("openai_api_key") || "";
apiKeyInput.addEventListener("input", () => {
    sessionStorage.setItem("openai_api_key", apiKeyInput.value);
});

// ============================================================
// Toggle API key visibility
// ============================================================

toggleKeyBtn.addEventListener("click", () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
    toggleKeyBtn.textContent = isPassword ? "🙈" : "👁";
});

// ============================================================
// Speed slider
// ============================================================

ttsSpeedInput.addEventListener("input", () => {
    speedValue.textContent = `${ttsSpeedInput.value}x`;
});

// ============================================================
// File upload
// ============================================================

uploadArea.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    const validTypes = [
        "application/pdf",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ];
    if (!validTypes.includes(file.type)) {
        alert("サポートされていないファイル形式です。PDF, TXT, JPG, PNGのみ対応しています。");
        return;
    }

    uploadedFile = file;
    uploadPlaceholder.hidden = true;
    uploadPreview.hidden = false;

    previewInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    if (file.type.startsWith("image/")) {
        previewImage.hidden = false;
        previewImage.src = URL.createObjectURL(file);
    } else {
        previewImage.hidden = true;
    }

    // Show extract section, hide subsequent sections
    extractSection.hidden = false;
    editSection.hidden = true;
    generateSection.hidden = true;
    resultSection.hidden = true;
    extractStatus.hidden = true;
    segments = [];
    audioBlobs = [];
}

// ============================================================
// Text extraction
// ============================================================

extractBtn.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("OpenAI API Keyを入力してください。");
        return;
    }
    if (!uploadedFile) {
        alert("ファイルをアップロードしてください。");
        return;
    }

    extractBtn.disabled = true;
    showStatus(extractStatus, "テキストを抽出中...", "loading");

    try {
        const contentType = contentTypeSelect.value;
        let text;

        if (uploadedFile.type === "text/plain") {
            text = await readTextFile(uploadedFile);
            // Optionally process with AI
            text = await processTextWithAI(text, contentType, apiKey);
        } else if (uploadedFile.type === "application/pdf") {
            text = await extractFromPDF(uploadedFile, contentType, apiKey);
        } else {
            text = await extractFromImage(uploadedFile, contentType, apiKey);
        }

        // Parse into segments
        const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
        segments = lines.map((line) => ({ text: line, voice: VOICES[0].id }));
        audioBlobs = [];

        showStatus(extractStatus, "抽出完了！", "success");
        renderSegments();
        editSection.hidden = false;
        generateSection.hidden = false;
        resultSection.hidden = true;
    } catch (err) {
        showStatus(extractStatus, `エラー: ${err.message}`, "error");
    } finally {
        extractBtn.disabled = false;
    }
});

function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
        reader.readAsText(file, "UTF-8");
    });
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
        reader.readAsDataURL(file);
    });
}

async function extractFromPDF(file, contentType, apiKey) {
    // Try to extract text with pdf.js first
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join("");
        fullText += pageText + "\n";
    }

    if (fullText.trim().length > 50) {
        // Got meaningful text, process with AI
        return processTextWithAI(fullText, contentType, apiKey);
    }

    // Fallback: render PDF pages to images and use vision
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await firstPage.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];

    return callVisionAPI(base64, "image/png", contentType, apiKey);
}

async function extractFromImage(file, contentType, apiKey) {
    const base64 = await readFileAsBase64(file);
    const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
    return callVisionAPI(base64, mimeType, contentType, apiKey);
}

const SYSTEM_MESSAGE = `あなたはOCRエンジンとして動作するアシスタントです。
ユーザーが提供した画像やテキストから、表示されているテキストを正確に書き起こすことが唯一の仕事です。
これは視覚障害者向けのアクセシビリティツール・読み上げ補助ツールの一部として使用されます。
画像内のテキストを正確に転写してください。テキスト以外の出力（説明、コメント、注意書き）は不要です。`;

async function callVisionAPI(base64Image, mimeType, contentType, apiKey) {
    const prompt = PROMPTS[contentType] || PROMPTS.general;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: SYSTEM_MESSAGE,
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function processTextWithAI(rawText, contentType, apiKey) {
    const prompt = PROMPTS[contentType] || PROMPTS.general;
    const fullPrompt = `${prompt}\n\n以下のテキストを処理してください:\n\n${rawText}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_MESSAGE },
                { role: "user", content: fullPrompt },
            ],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ============================================================
// Segment editing UI
// ============================================================

let dragSrcIndex = null;

function renderSegments() {
    segmentsContainer.innerHTML = "";

    segments.forEach((seg, i) => {
        const row = document.createElement("div");
        row.className = "segment-row";
        row.draggable = true;
        row.dataset.index = i;

        // --- Drag handle ---
        const handle = document.createElement("div");
        handle.className = "seg-handle";
        handle.textContent = "⠿";
        handle.title = "ドラッグで並び替え";

        // --- Drag events ---
        row.addEventListener("dragstart", (e) => {
            dragSrcIndex = i;
            row.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        });

        row.addEventListener("dragend", () => {
            row.classList.remove("dragging");
            document.querySelectorAll(".segment-row.drag-over-above, .segment-row.drag-over-below").forEach((el) => {
                el.classList.remove("drag-over-above", "drag-over-below");
            });
            dragSrcIndex = null;
        });

        row.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragSrcIndex === null || dragSrcIndex === i) return;

            // Show indicator above or below based on mouse position
            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            row.classList.remove("drag-over-above", "drag-over-below");
            if (e.clientY < midY) {
                row.classList.add("drag-over-above");
            } else {
                row.classList.add("drag-over-below");
            }
        });

        row.addEventListener("dragleave", () => {
            row.classList.remove("drag-over-above", "drag-over-below");
        });

        row.addEventListener("drop", (e) => {
            e.preventDefault();
            row.classList.remove("drag-over-above", "drag-over-below");
            if (dragSrcIndex === null || dragSrcIndex === i) return;

            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            let targetIndex = e.clientY < midY ? i : i + 1;

            // Move the segment
            const [moved] = segments.splice(dragSrcIndex, 1);
            if (targetIndex > dragSrcIndex) targetIndex--;
            segments.splice(targetIndex, 0, moved);

            audioBlobs = [];
            dragSrcIndex = null;
            renderSegments();
        });

        const num = document.createElement("div");
        num.className = "seg-number";
        num.textContent = `${i + 1}`;

        const textarea = document.createElement("textarea");
        textarea.value = seg.text;
        textarea.rows = 1;
        textarea.addEventListener("input", () => {
            segments[i].text = textarea.value;
            autoResize(textarea);
        });
        // Auto-resize on render
        requestAnimationFrame(() => autoResize(textarea));

        const voiceSelect = document.createElement("select");
        VOICES.forEach((v) => {
            const opt = document.createElement("option");
            opt.value = v.id;
            opt.textContent = v.name;
            if (v.id === seg.voice) opt.selected = true;
            voiceSelect.appendChild(opt);
        });
        voiceSelect.addEventListener("change", () => {
            segments[i].voice = voiceSelect.value;
        });

        const delBtn = document.createElement("button");
        delBtn.className = "btn-delete";
        delBtn.textContent = "✕";
        delBtn.title = "削除";
        delBtn.addEventListener("click", () => {
            segments.splice(i, 1);
            audioBlobs = [];
            renderSegments();
        });

        row.appendChild(handle);
        row.appendChild(num);
        row.appendChild(textarea);
        row.appendChild(voiceSelect);
        row.appendChild(delBtn);
        segmentsContainer.appendChild(row);
    });
}

function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

addSegmentBtn.addEventListener("click", () => {
    segments.push({ text: "", voice: VOICES[0].id });
    renderSegments();
    // Focus the new textarea
    const textareas = segmentsContainer.querySelectorAll("textarea");
    if (textareas.length > 0) {
        textareas[textareas.length - 1].focus();
    }
});

// ============================================================
// Audio generation
// ============================================================

generateBtn.addEventListener("click", async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("OpenAI API Keyを入力してください。");
        return;
    }

    const validSegments = segments.filter((s) => s.text.trim().length > 0);
    if (validSegments.length === 0) {
        alert("テキストが空です。");
        return;
    }

    generateBtn.disabled = true;
    generateProgress.hidden = false;
    audioBlobs = new Array(segments.length).fill(null);

    const now = new Date();
    audioTimestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    const model = ttsModelSelect.value;
    const speed = parseFloat(ttsSpeedInput.value);

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg.text.trim()) continue;

        progressText.textContent = `セグメント ${i + 1} / ${segments.length} を生成中...`;
        progressFill.style.width = `${((i) / segments.length) * 100}%`;

        try {
            const blob = await generateTTS(seg.text, seg.voice, model, speed, apiKey);
            audioBlobs[i] = blob;
        } catch (err) {
            progressText.textContent = `セグメント ${i + 1} エラー: ${err.message}`;
            // Continue with other segments
        }
    }

    progressFill.style.width = "100%";
    progressText.textContent = "音声生成完了！";
    generateBtn.disabled = false;

    renderAudioResults();
    resultSection.hidden = false;
});

async function generateTTS(text, voice, model, speed, apiKey) {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            input: text,
            voice: voice,
            speed: speed,
            response_format: "mp3",
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `TTS error: ${response.status}`);
    }

    return response.blob();
}

// ============================================================
// Audio results & download
// ============================================================

function renderAudioResults() {
    audioResults.innerHTML = "";

    segments.forEach((seg, i) => {
        if (!audioBlobs[i]) return;

        const row = document.createElement("div");
        row.className = "audio-result-row";

        const info = document.createElement("div");
        info.className = "audio-info";

        const textEl = document.createElement("div");
        textEl.className = "audio-text";
        textEl.textContent = seg.text.length > 60 ? seg.text.slice(0, 60) + "..." : seg.text;

        const voiceEl = document.createElement("div");
        voiceEl.className = "audio-voice";
        const voiceLabel = VOICES.find((v) => v.id === seg.voice);
        voiceEl.textContent = `声: ${voiceLabel ? voiceLabel.name : seg.voice}`;

        info.appendChild(textEl);
        info.appendChild(voiceEl);

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = URL.createObjectURL(audioBlobs[i]);

        const dlBtn = document.createElement("button");
        dlBtn.className = "btn-download";
        dlBtn.textContent = "保存";
        dlBtn.addEventListener("click", () => {
            downloadBlob(audioBlobs[i], `segment_${String(i + 1).padStart(3, "0")}_${audioTimestamp}.mp3`);
        });

        row.appendChild(info);
        row.appendChild(audio);
        row.appendChild(dlBtn);
        audioResults.appendChild(row);
    });
}

downloadAllBtn.addEventListener("click", async () => {
    const validBlobs = audioBlobs.filter((b) => b !== null);
    if (validBlobs.length === 0) {
        alert("ダウンロードする音声がありません。");
        return;
    }

    if (validBlobs.length === 1) {
        downloadBlob(validBlobs[0], `audio_${audioTimestamp}.mp3`);
        return;
    }

    // Combine all MP3 blobs into one file
    const combined = new Blob(validBlobs, { type: "audio/mpeg" });
    downloadBlob(combined, `all_segments_${audioTimestamp}.mp3`);
});

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================
// Helpers
// ============================================================

function showStatus(el, message, type) {
    el.hidden = false;
    el.textContent = message;
    el.className = `status ${type}`;
}
