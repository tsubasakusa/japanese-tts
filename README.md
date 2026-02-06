# 日本語テキスト読み上げツール / Japanese Text-to-Speech Tool

PDF、テキスト、画像ファイルから日本語テキストを抽出し、音声を生成する静的Webアプリケーション。

## 機能 / Features

- **ファイルアップロード**: PDF, TXT, JPG, PNG 対応
- **AI テキスト抽出**: OpenAI GPT-4o を使用して画像・PDFからテキストを抽出
- **コンテンツ種類対応**:
  - ニュース: 本文のみ抽出
  - 対話: 会話形式で整理
  - 漫画: セリフ・効果音・ナレーションを順序通り抽出
  - 一般テキスト: そのまま抽出
- **テキスト編集**: 抽出後にセグメントごとに編集可能
- **音声選択**: OpenAI TTS の10種類の声から選択
- **音声生成**: OpenAI TTS API による音声生成（tts-1 / tts-1-hd）
- **ダウンロード**: セグメントごと、または一括ダウンロード

## セットアップ / Setup

静的サイトなのでサーバー不要です。以下のいずれかの方法で起動できます:

```bash
# 方法1: Python の簡易サーバー
python -m http.server 8000

# 方法2: Node.js
npx serve .

# 方法3: そのまま index.html をブラウザで開く
```

ブラウザで `http://localhost:8000` にアクセスしてください。

## 必要なもの / Requirements

- **OpenAI API Key**: テキスト抽出（GPT-4o）と音声生成（TTS）に使用
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

※ APIキーはブラウザ内でのみ使用され、外部サーバーには送信されません。

## 使用方法 / Usage

1. OpenAI API Key を入力
2. コンテンツの種類を選択（ニュース、対話、漫画、一般）
3. ファイルをアップロード
4. 「テキストを抽出する」ボタンをクリック
5. 抽出されたテキストを確認・編集
6. 各セグメントの声を選択
7. 「すべての音声を生成」ボタンをクリック
8. プレビューして、ダウンロード

## 音声一覧 / Available Voices

| 名前 | 特徴 |
|------|------|
| Alloy | 中性 |
| Ash | 会話的 |
| Ballad | 温かい |
| Coral | 親しみやすい |
| Echo | 滑らか |
| Fable | 物語風 |
| Nova | 明るい |
| Onyx | 深い |
| Sage | 落ち着き |
| Shimmer | 楽観的 |

## 技術スタック / Tech Stack

- **Frontend**: HTML / CSS / JavaScript（サーバー不要）
- **TTS Engine**: OpenAI TTS API (tts-1 / tts-1-hd)
- **AI/OCR**: OpenAI GPT-4o (Vision)
- **PDF解析**: pdf.js (Mozilla)

## デプロイ / Deploy

静的サイトなので、GitHub Pages, Netlify, Vercel などに直接デプロイできます。
