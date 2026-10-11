import pytest
from app.models.schemas import StudentAcademicProfile, SemesterPerformance, SubjectMark
from app.services.academic_rules import (
    evaluate_performance_rules,
    generate_study_plan_rules,
    evaluate_risk_rules,
    academic_chat_rules
)

@pytest.fixture
def sample_student():
    return StudentAcademicProfile(
        student_id="stu_123",
        register_number="CSE2023001",
        name="Aarav Sharma",
        department="Computer Science",
        current_semester=5,
        cgpa=8.45,
        active_arrears=0,
        semesters=[
            SemesterPerformance(
                semester_number=4,
                sgpa=8.6,
                total_credits=22,
                subjects=[
                    SubjectMark(
                        subject_code="CS401",
                        subject_name="Operating Systems",
                        credits=4,
                        internal_marks=38,
                        external_marks=52,
                        total_marks=90,
                        grade="O",
                        grade_point=10.0,
                        is_passed=True
                    )
                ]
            )
        ]
    )

@pytest.fixture
def at_risk_student():
    return StudentAcademicProfile(
        student_id="stu_456",
        register_number="CSE2023004",
        name="Sneha Reddy",
        department="Computer Science",
        current_semester=5,
        cgpa=4.8,
        active_arrears=2,
        semesters=[
            SemesterPerformance(
                semester_number=4,
                sgpa=4.5,
                total_credits=22,
                subjects=[
                    SubjectMark(
                        subject_code="CS402",
                        subject_name="Microprocessors",
                        credits=4,
                        internal_marks=18,
                        external_marks=22,
                        total_marks=40,
                        grade="F",
                        grade_point=0.0,
                        is_passed=False
                    )
                ]
            )
        ]
    )

def test_performance_summary_normal(sample_student):
    summary = evaluate_performance_rules(sample_student)
    assert summary.cgpa == 8.45
    assert "First Class" in summary.academic_standing
    assert len(summary.strengths) > 0
    assert summary.mode == "rules_based"

def test_risk_evaluation_at_risk(at_risk_student):
    risk = evaluate_risk_rules(at_risk_student)
    assert risk.risk_score >= 35.0
    assert risk.risk_level in ["HIGH", "CRITICAL"]
    assert len(risk.risk_factors) >= 1
    assert len(risk.early_interventions) >= 1

def test_study_plan_generation(sample_student):
    plan = generate_study_plan_rules(sample_student, hours_per_week=15, target_sgpa=9.0, priority_codes=[])
    assert plan.weekly_hours == 15
    assert len(plan.schedule) > 0
    assert len(plan.milestone_goals) > 0

def test_academic_chat(sample_student):
    res_cgpa = academic_chat_rules("What is my current CGPA?", sample_student)
    assert "8.45" in res_cgpa.answer
    assert len(res_cgpa.suggested_followups) > 0

    res_arrears = academic_chat_rules("Do I have any backlogs?", sample_student)
    assert "0 active arrears" in res_arrears.answer
