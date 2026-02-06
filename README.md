# 日本語テキスト読み上げツール / Japanese Text-to-Speech Tool

PDF、テキスト、画像ファイルから日本語テキストを抽出し、音声を生成するWebアプリケーション。

## 機能 / Features

- **ファイルアップロード**: PDF, TXT, JPG, PNG対応
- **AI テキスト抽出**: GPT-4o または Claude を使用して画像・PDFからテキストを抽出
- **コンテンツ種類対応**:
  - ニュース: 本文のみ抽出
  - 対話: 会話形式で整理
  - 漫画: セリフ・効果音・ナレーションを順序通り抽出
  - 一般テキスト: そのまま抽出
- **テキスト編集**: 抽出後にセグメントごとに編集可能
- **音声選択**: 7種類の日本語音声（男性3種・女性4種）
- **音声生成**: edge-tts による高品質な音声生成
- **ダウンロード**: セグメントごと、または一括ダウンロード

## セットアップ / Setup

```bash
# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定（任意: 画像/PDF抽出用）
cp .env.example .env
# .env ファイルにAPIキーを設定

# アプリケーション起動
streamlit run app.py
```

## 必要なAPIキー / API Keys

画像やPDFからテキストを抽出する場合、以下のいずれかのAPIキーが必要です:

- **OpenAI API Key**: GPT-4o を使用（推奨）
- **Anthropic API Key**: Claude を使用

※ テキストファイル（.txt）の場合はAPIキー不要です。
※ APIキーはサイドバーで入力するか、`.env` ファイルに設定できます。

## 使用方法 / Usage

1. アプリを起動し、サイドバーでAPIキーを設定
2. コンテンツの種類を選択（ニュース、対話、漫画、一般）
3. ファイルをアップロード
4. 「テキストを抽出する」ボタンをクリック
5. 抽出されたテキストを確認・編集
6. 各セグメントの声を選択
7. 「すべての音声を生成」ボタンをクリック
8. プレビューして、ダウンロード

## 音声一覧 / Available Voices

| 名前 | 性別 |
|------|------|
| 七海 (Nanami) | 女性 |
| 碧衣 (Aoi) | 女性 |
| 真夕 (Mayu) | 女性 |
| 志織 (Shiori) | 女性 |
| 圭太 (Keita) | 男性 |
| 大智 (Daichi) | 男性 |
| 直紀 (Naoki) | 男性 |

## 技術スタック / Tech Stack

- **Frontend**: Streamlit
- **TTS Engine**: edge-tts (Microsoft Edge Neural TTS)
- **AI/OCR**: OpenAI GPT-4o / Anthropic Claude
- **PDF**: PyPDF2
