import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

_model = None

def get_model():
    global _model
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    if _model is None:
        _model = genai.GenerativeModel('gemini-2.5-flash')
    return _model

SYSTEM_PROMPT = """You are CodeSentinel, an expert AI code review assistant for engineering teams.

Analyze the following pull request diff carefully.

Your task:
1. Detect logic bugs
2. Detect security vulnerabilities
3. Detect performance issues
4. Detect maintainability/code quality issues
5. Suggest fixes
6. Assign severity levels
7. Generate risk scores

IMPORTANT RULES:
- Return ONLY valid JSON
- Do NOT use markdown
- Do NOT wrap response inside ```json
- Always return all required fields
- If no issues exist, return an empty issues array
- Never leave scores undefined
- Scores must be between 0 and 100

Severity Levels:
- HIGH
- MEDIUM
- LOW

Risk Score Rules:
- More HIGH issues → lower security/performance/maintainability score
- Security vulnerabilities reduce security score significantly (each HIGH security bug drops score by 20+)
- Performance issues reduce performance score
- Bad code quality reduces maintainability score
- A file with HIGH issues must NEVER have a security_score above 55

Required JSON Format:
{
  "overall_risk": "HIGH",
  "security_score": 45,
  "performance_score": 80,
  "maintainability_score": 70,
  "issues_found": 2,
  "issues": [
    {
      "type": "Logic Bug",
      "severity": "HIGH",
      "file": "src/example.js",
      "line": 42,
      "title": "Short descriptive title",
      "description": "Clear explanation of the problem for a junior developer.",
      "impact": "Comma-separated list of potential impacts",
      "suggested_fix": "Concrete actionable fix description",
      "improved_code": "corrected code snippet or empty string",
      "confidence": 94
    }
  ]
}

Analyze this pull request diff:
"""

async def analyze_code_diff(diff: str, static_analysis_results: dict = None):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "overall_risk": "UNKNOWN",
            "security_score": 0,
            "performance_score": 0,
            "maintainability_score": 0,
            "issues_found": 1,
            "issues": [{
                "type": "Configuration Error",
                "severity": "HIGH",
                "file": ".env",
                "line": 1,
                "title": "Missing Gemini API Key",
                "description": "No GEMINI_API_KEY found in backend/.env file. AI analysis is disabled.",
                "impact": "AI analysis is completely disabled without an API key",
                "suggested_fix": "Add GEMINI_API_KEY=your_key to backend/.env",
                "improved_code": "",
                "confidence": 100
            }]
        }

    # Truncate very large diffs to avoid Gemini timeout (504)
    MAX_DIFF_CHARS = 10000
    was_truncated = len(diff) > MAX_DIFF_CHARS
    diff_to_send = diff[:MAX_DIFF_CHARS]
    if was_truncated:
        diff_to_send += f"\n\n... [DIFF TRUNCATED: showing first {MAX_DIFF_CHARS} chars of {len(diff)} total] ..."
        print(f"[CodeSentinel] Diff truncated from {len(diff)} to {MAX_DIFF_CHARS} chars")

    full_prompt = SYSTEM_PROMPT + "\n" + diff_to_send
    if static_analysis_results:
        full_prompt += f"\n\nStatic Analysis Results:\n{json.dumps(static_analysis_results)}"

    try:
        model = get_model()
        response = await model.generate_content_async(
            full_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        text = response.text.strip()

        # Strip any accidental markdown fences
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        result = json.loads(text)

        # Safety guard: enforce realistic scores when HIGH issues exist
        issues = result.get("issues", [])
        has_high = any(i.get("severity", "").upper() == "HIGH" for i in issues)
        has_medium = any(i.get("severity", "").upper() == "MEDIUM" for i in issues)

        if has_high:
            if result.get("security_score", 100) > 55:
                result["security_score"] = min(result["security_score"], 55)
            result["overall_risk"] = "HIGH"
        elif has_medium:
            if result.get("security_score", 100) > 75:
                result["security_score"] = min(result["security_score"], 75)
            if result.get("overall_risk", "LOW") == "LOW":
                result["overall_risk"] = "MEDIUM"

        # Ensure issues_found is always accurate
        result["issues_found"] = len(issues)

        return result

    except Exception as e:
        print(f"Gemini analysis failed: {e}")
        raise e
