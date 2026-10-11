from fastapi import APIRouter, HTTPException, Depends
from ..models.schemas import (
    StudentAcademicProfile, StudyPlanRequest, ChatRequest,
    RiskAnalysisRequest, PerformanceSummaryResponse,
    StudyPlanResponse, ChatResponse, RiskAnalysisResponse
)
from ..services.llm_service import llm_service

router = APIRouter(prefix="/ai", tags=["Academic AI"])

@router.post("/performance-summary", response_model=PerformanceSummaryResponse)
async def get_performance_summary(profile: StudentAcademicProfile):
    """
    Generate an AI/rules-based comprehensive performance summary for a student.
    """
    try:
        return await llm_service.get_performance_summary(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(request: StudyPlanRequest):
    """
    Generate a personalized weekly timetable and milestone study plan.
    """
    try:
        return await llm_service.generate_study_plan(
            request.student_profile,
            request.available_hours_per_week,
            request.target_sgpa or 8.5,
            request.priority_subject_codes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/risk-analysis", response_model=RiskAnalysisResponse)
async def analyze_student_risk(request: RiskAnalysisRequest):
    """
    Early warning risk evaluation analyzing CGPA, arrear backlogs, and trajectory.
    """
    try:
        return await llm_service.evaluate_risk(request.student_profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def academic_chat(request: ChatRequest):
    """
    Conversational Academic Assistant providing context-aware guidance.
    """
    try:
        return await llm_service.chat(
            request.message,
            request.student_profile,
            request.conversation_history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
