from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SubjectMark(BaseModel):
    subject_code: str
    subject_name: str
    credits: int = 3
    internal_marks: float = 0
    external_marks: float = 0
    total_marks: float = 0
    grade: str = "P"
    grade_point: float = 0
    is_passed: bool = True

class SemesterPerformance(BaseModel):
    semester_number: int
    sgpa: float
    total_credits: int
    subjects: List[SubjectMark] = []

class StudentAcademicProfile(BaseModel):
    student_id: Optional[str] = None
    register_number: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    current_semester: int = 1
    cgpa: float = 0.0
    active_arrears: int = 0
    semesters: List[SemesterPerformance] = []

class StudyPlanRequest(BaseModel):
    student_profile: StudentAcademicProfile
    available_hours_per_week: int = Field(default=15, ge=1, le=80)
    target_sgpa: Optional[float] = Field(default=8.5, ge=4.0, le=10.0)
    priority_subject_codes: List[str] = []

class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str

class ChatRequest(BaseModel):
    message: str
    student_profile: Optional[StudentAcademicProfile] = None
    conversation_history: List[ChatMessage] = []

class RiskAnalysisRequest(BaseModel):
    student_profile: StudentAcademicProfile

# Responses
class PerformanceSummaryResponse(BaseModel):
    mode: str = "rules_based"  # llm or rules_based
    student_name: Optional[str] = None
    cgpa: float
    academic_standing: str
    strengths: List[str]
    areas_for_improvement: List[str]
    summary_text: str
    recommendations: List[str]

class StudyPlanItem(BaseModel):
    day: str
    time_slot: str
    subject_code: str
    subject_name: str
    activity: str
    focus_topics: List[str]

class StudyPlanResponse(BaseModel):
    mode: str = "rules_based"
    weekly_hours: int
    strategic_focus: str
    schedule: List[StudyPlanItem]
    milestone_goals: List[str]

class ChatResponse(BaseModel):
    mode: str = "rules_based"
    answer: str
    suggested_followups: List[str]

class RiskAnalysisResponse(BaseModel):
    mode: str = "rules_based"
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    risk_score: float  # 0.0 to 100.0
    risk_factors: List[str]
    early_interventions: List[str]
    advisory_notice: str
