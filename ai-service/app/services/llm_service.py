import httpx
from typing import Optional, List, Dict, Any
from ..config import settings
from ..models.schemas import (
    StudentAcademicProfile, PerformanceSummaryResponse,
    StudyPlanResponse, RiskAnalysisResponse, ChatResponse
)
from .academic_rules import (
    evaluate_performance_rules,
    generate_study_plan_rules,
    evaluate_risk_rules,
    academic_chat_rules
)

class LLMService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.fallback = settings.FALLBACK_TO_RULES

    async def get_performance_summary(self, profile: StudentAcademicProfile) -> PerformanceSummaryResponse:
        # Check if LLM is enabled and key provided
        if self.gemini_key:
            try:
                # Attempt call to Gemini
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                prompt = (
                    f"Analyze this student's academic performance: Name={profile.name}, "
                    f"CGPA={profile.cgpa}, Arrears={profile.active_arrears}, Semester={profile.current_semester}. "
                    "Provide a brief evaluation summary, 2 strengths, 2 areas for improvement, and 2 actionable recommendations."
                )
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json={
                        "contents": [{"parts": [{"text": prompt}]}]
                    })
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        # Extract or wrap
                        res = evaluate_performance_rules(profile)
                        res.mode = "gemini_llm"
                        res.summary_text = text[:400]
                        return res
            except Exception as e:
                pass  # Gracefully fall back to deterministic rules
        
        # Deterministic Rules Fallback
        return evaluate_performance_rules(profile)

    async def generate_study_plan(
        self,
        profile: StudentAcademicProfile,
        hours_per_week: int,
        target_sgpa: float,
        priority_codes: List[str]
    ) -> StudyPlanResponse:
        return generate_study_plan_rules(profile, hours_per_week, target_sgpa, priority_codes)

    async def evaluate_risk(self, profile: StudentAcademicProfile) -> RiskAnalysisResponse:
        return evaluate_risk_rules(profile)

    async def chat(
        self,
        message: str,
        profile: Optional[StudentAcademicProfile],
        conversation_history: List[Any]
    ) -> ChatResponse:
        if self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                context = f"Student Profile: CGPA={profile.cgpa if profile else 8.45}, Arrears={profile.active_arrears if profile else 0}."
                prompt = f"{context}\nStudent asks: {message}\nProvide a concise, encouraging academic response."
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json={
                        "contents": [{"parts": [{"text": prompt}]}]
                    })
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return ChatResponse(
                            mode="gemini_llm",
                            answer=text,
                            suggested_followups=["How to improve my SGPA?", "Check my arrear status", "Generate study plan"]
                        )
            except Exception:
                pass
                
        return academic_chat_rules(message, profile)

llm_service = LLMService()
