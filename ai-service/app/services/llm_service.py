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
        self.groq_key = settings.GROQ_API_KEY
        self.groq_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        self.fallback = settings.FALLBACK_TO_RULES

    async def get_performance_summary(self, profile: StudentAcademicProfile) -> PerformanceSummaryResponse:
        if self.groq_key:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                prompt = (
                    f"Analyze this student's academic performance: Name={profile.name}, "
                    f"CGPA={profile.cgpa}, Arrears={profile.active_arrears}, Semester={profile.current_semester}. "
                    "Provide a brief evaluation summary, 2 strengths, 2 areas for improvement, and 2 actionable recommendations."
                )
                headers = {
                    "Authorization": f"Bearer {self.groq_key.strip()}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": "You are a university academic counselor."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"]
                        res = evaluate_performance_rules(profile)
                        res.mode = "groq_llm"
                        res.summary_text = text[:400]
                        return res
            except Exception:
                pass  # Gracefully fall back to deterministic rules
        
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
        if self.groq_key:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                context = f"Student Profile: CGPA={profile.cgpa if profile else 8.45}, Arrears={profile.active_arrears if profile else 0}."
                prompt = f"{context}\nStudent asks: {message}\nProvide a concise, encouraging academic response."
                headers = {
                    "Authorization": f"Bearer {self.groq_key.strip()}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.groq_model,
                    "messages": [
                        {"role": "system", "content": "You are the university CEHP Academic AI Advisor. Ground responses strictly in academic facts."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 800
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"]
                        return ChatResponse(
                            mode="groq_llm",
                            answer=text,
                            suggested_followups=["How to improve my SGPA?", "Check my arrear status", "Generate study plan"]
                        )
            except Exception:
                pass
                
        return academic_chat_rules(message, profile)

llm_service = LLMService()
