# Zenith AI Coach Setup Guide

Zenith uses **Groq** for free, fast AI responses. Here's how to set it up:

## Quick Setup (2 minutes)

### 1. Get Your Free Groq API Key

1. Visit https://console.groq.com
2. Sign up for a free account (no credit card required)
3. Navigate to "API Keys" in the dashboard
4. Click "Create API Key"
5. Copy your API key

### 2. Configure Environment Variable

**Option A: Add to `.env` file (recommended for local development)**

Create or edit `.env` in the `backend/` directory:

```bash
GROQ_API_KEY=your-api-key-here
```

**Option B: Set as environment variable**

```bash
export GROQ_API_KEY="your-api-key-here"
```

**Option C: For production (Vercel/Railway/Render)**

Add `GROQ_API_KEY` to your platform's environment variables settings.

### 3. Install Dependencies

```bash
cd backend
pip install groq
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### 4. Restart Your Backend

```bash
uvicorn app.main:app --reload --port 8000
```

## That's It! 🎉

Zenith will now use Groq's free API. The system automatically:
- Uses Groq if `GROQ_API_KEY` is set
- Falls back to Hugging Face if only `HUGGINGFACE_API_KEY` is set
- Shows helpful error messages if neither is configured

## Groq Free Tier Limits

- **30 requests per minute** (more than enough for personal use)
- **14,400 requests per day** (very generous)
- **Fast responses** (typically < 1 second)
- **No credit card required**

## Available Models

You can customize the model by setting `GROQ_MODEL` in your environment:

```bash
GROQ_MODEL=llama-3.1-8b-instant  # Default - fastest, free
GROQ_MODEL=llama-3.1-70b-versatile  # More capable, still free
GROQ_MODEL=mixtral-8x7b-32768  # Alternative free model
```

## Troubleshooting

**"Groq library not installed"**
```bash
pip install groq
```

**"No AI API key configured"**
- Make sure `GROQ_API_KEY` is set in your environment
- Check that the `.env` file is in the `backend/` directory
- Restart your backend server after adding the key

**"Error calling Groq API"**
- Verify your API key is correct
- Check your internet connection
- Ensure you haven't exceeded rate limits (30 req/min)

## Testing

Once set up, visit `/zenith` in your app and ask a question like:
- "How can I improve my recovery?"
- "What does my HRV trend tell me?"
- "Should I work out today based on my recovery score?"


















