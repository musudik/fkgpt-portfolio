# n8n Workflows for AI Research Lab

This folder contains pre-built n8n workflow templates that integrate all the containers in the AI Research Lab stack.

## 📥 How to Import Workflows

1. Open n8n at `http://YOUR-IP:5678`
2. Go to **Workflows** → **Import from File**
3. Select any `.json` file from this folder
4. Click **Import**
5. Activate the workflow

---

## 📋 Available Workflows

### 1. 📄 Document Processing Pipeline
**File:** `document-processing-pipeline.json`

**What it does:**
- Receives an image via webhook
- Runs parallel OCR (Tesseract + EasyOCR) 
- Generates AI image caption
- Uses LLM to summarize all extracted content
- Returns structured JSON response

**Webhook URL:** `POST http://YOUR-IP:5678/webhook/process-document`

**Test with curl:**
```bash
curl -X POST http://YOUR-IP:5678/webhook/process-document \
  -F "data=@document.jpg"
```

**Uses:** Vision API, LLM API

---

### 2. 🎤 Audio Transcription & Analysis
**File:** `audio-transcription-analysis.json`

**What it does:**
- Receives audio file via webhook
- Transcribes using Whisper
- Analyzes transcript with LLM (summary, topics, action items, sentiment)
- Returns structured analysis

**Webhook URL:** `POST http://YOUR-IP:5678/webhook/transcribe-audio`

**Test with curl:**
```bash
curl -X POST http://YOUR-IP:5678/webhook/transcribe-audio \
  -F "data=@recording.mp3"
```

**Uses:** Whisper, LLM API

---

### 3. 💬 AI Chatbot API
**File:** `ai-chatbot.json`

**What it does:**
- Receives chat messages via webhook
- Supports custom system prompts
- Supports conversation history
- Returns AI response

**Webhook URL:** `POST http://YOUR-IP:5678/webhook/chat`

**Test with curl:**
```bash
curl -X POST http://YOUR-IP:5678/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "system_prompt": "You are a helpful AI tutor",
    "model": "llama3.2:3b"
  }'
```

**With conversation history:**
```bash
curl -X POST http://YOUR-IP:5678/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you give me an example?",
    "history": [
      {"role": "user", "content": "What is machine learning?"},
      {"role": "assistant", "content": "Machine learning is..."}
    ]
  }'
```

**Uses:** LLM API

---

### 4. 📦 MinIO File Processor
**File:** `minio-file-processor.json`

**What it does:**
- Runs every 5 minutes (scheduled)
- Checks MinIO bucket for new image files
- Processes each image with OCR
- Uses LLM to extract structured data (title, date, summary, entities)
- Ideal for automated document processing

**Setup Required:**
1. Create a MinIO bucket called `documents`
2. Configure S3 credentials in n8n:
   - Endpoint: `http://minio:9000`
   - Access Key: `admin`
   - Secret Key: `password`

**Uses:** MinIO, Vision API, LLM API

---

## 🔧 Service URLs (Inside n8n)

When calling services from n8n, use these internal Docker URLs:

| Service | Internal URL |
|---------|-------------|
| LLM API | `http://llm_api:8000` |
| Vision API | `http://vision_api:8501` |
| Whisper | `http://whisper:9002` |
| MinIO | `http://minio:9000` |
| Ollama | `http://ollama:11434` |
| Qdrant | `http://qdrant:6333` |

---

## 💡 Creating Custom Workflows

### HTTP Request to LLM API
```json
{
  "method": "POST",
  "url": "http://llm_api:8000/v1/chat/completions",
  "body": {
    "model": "llama3.2:3b",
    "messages": [
      {"role": "system", "content": "You are helpful"},
      {"role": "user", "content": "Hello!"}
    ]
  }
}
```

### HTTP Request to Vision API (OCR)
```json
{
  "method": "POST",
  "url": "http://vision_api:8501/ocr/tesseract",
  "contentType": "multipart-form-data",
  "body": {
    "file": "<binary data>"
  }
}
```

### HTTP Request to Whisper
```json
{
  "method": "POST",
  "url": "http://whisper:9002/inference",
  "contentType": "multipart-form-data",
  "body": {
    "file": "<audio binary>",
    "response_format": "json"
  }
}
```

---

## 🚀 Workflow Ideas

1. **Email → Document Processing → Reply**
   - Trigger: Email received with attachment
   - Process: OCR → Summarize → Generate reply
   - Action: Send email response

2. **Slack Bot**
   - Trigger: Slack message
   - Process: Forward to LLM API
   - Action: Reply in Slack

3. **Invoice Processing**
   - Trigger: File uploaded to MinIO
   - Process: OCR → Extract fields (date, amount, vendor)
   - Action: Store in database or spreadsheet

4. **Meeting Notes**
   - Trigger: Audio file webhook
   - Process: Whisper → LLM extract action items
   - Action: Create tasks in project management tool

----------------------------------------------------------------

📡 Quick Test Commands
1. Document Processing (OCR + Analysis)
```
curl -X POST https://n8n.fkgpt.dev/webhook/process-document \
  -F "data=@image.jpg"
```  
2. Audio Transcription
```
curl -X POST https://n8n.fkgpt.dev/webhook/transcribe-audio \
  -F "data=@audio.mp3"
```  
3. AI Chatbot
```
curl -X POST https://n8n.fkgpt.dev/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```  
4. Code Assistant
```
curl -X POST https://n8n.fkgpt.dev/webhook/code-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "language": "python",
    "description": "Create a function to sort a list"
  }'
```  
5. MinIO File Processor

No API trigger - runs automatically every 5 minutes
Checks MinIO for new files and processes them


# Workflow	Form URL

**AI Chatbot**	https://n8n.fkgpt.dev/form/chatbot-form
**Audio Transcription**	https://n8n.fkgpt.dev/form/audio-transcription-form
**Document Processor**	https://n8n.fkgpt.dev/form/document-processor-form
**Code Assistant**	https://n8n.fkgpt.dev/form/code-assistant-form

# Updated Files

**File**	**Changes**

**ai-chatbot.json**
Form with 16 models, optional system prompt, HTML response

**audio-transcription-analysis.json**
File upload, 5 analysis types, 600s timeout

**document-processing-pipeline.json**
File upload, 3 OCR engines, 6 analysis tasks