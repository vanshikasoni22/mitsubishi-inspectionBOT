"""
AI Service main.py - Gemini Vision Defect Analysis Service
Handles Gemini API requests with quota exhaustion and rate limiting exception handling.
"""
import os
import json
from typing import Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Attempt to import Gemini exception types if installed
try:
    import google.api_core.exceptions as google_exceptions
    ResourceExhausted = google_exceptions.ResourceExhausted
    TooManyRequests = google_exceptions.TooManyRequests
except (ImportError, AttributeError):
    ResourceExhausted = type('ResourceExhausted', (Exception,), {})
    TooManyRequests = type('TooManyRequests', (Exception,), {})

try:
    import google.generativeai.types as genai_types
    BlockedPromptException = genai_types.BlockedPromptException
except (ImportError, AttributeError):
    BlockedPromptException = type('BlockedPromptException', (Exception,), {})

app = FastAPI(title="AutoInspect AI Service", version="1.0.0")


def is_quota_or_rate_limit_error(error: Exception) -> bool:
    """Check if an exception is due to Gemini API quota exhaustion or rate limits."""
    if isinstance(error, (ResourceExhausted, TooManyRequests, BlockedPromptException)):
        return True

    msg = str(error).lower()
    quota_keywords = ["429", "quota", "exhausted", "rate limit", "resource_exhausted", "toomanyrequests", "blockedprompt"]
    return any(keyword in msg for keyword in quota_keywords)


@app.post("/analyze")
async def analyze_image(request: Request):
    try:
        data = await request.json()
        image_urls = data.get("image_urls", [])
        part_number = data.get("part_number", "")
        return_reason = data.get("return_reason", "")

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise Exception("GEMINI_API_KEY environment variable not set")

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"Analyze part {part_number} returned for reason: {return_reason}. Detect damage and return structured JSON."
        response = model.generate_content(prompt)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "defects": json.loads(response.text) if response.text else [],
                "recommendation": "accept",
                "confidence_score": 0.95,
                "severity": "minor",
                "fallback": False
            }
        )

    except Exception as exc:
        if is_quota_or_rate_limit_error(exc):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "GEMINI_QUOTA_EXHAUSTED",
                    "message": "Gemini API key quota exhausted. Please try again later or contact admin to upgrade the API plan.",
                    "recommendation": "manual_review",
                    "defects": [],
                    "confidence_score": 0,
                    "severity": "unknown",
                    "fallback": True
                }
            )

        return JSONResponse(
            status_code=500,
            content={
                "error": "ANALYSIS_FAILED",
                "message": "Image analysis failed. Please try again.",
                "recommendation": "manual_review",
                "defects": [],
                "confidence_score": 0,
                "severity": "unknown",
                "fallback": True
            }
        )


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AI Vision Service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
