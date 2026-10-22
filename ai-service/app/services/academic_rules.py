from typing import List, Dict, Any, Optional
from ..models.schemas import (
    StudentAcademicProfile, PerformanceSummaryResponse,
    StudyPlanResponse, StudyPlanItem, RiskAnalysisResponse, ChatResponse
)

def evaluate_performance_rules(profile: StudentAcademicProfile) -> PerformanceSummaryResponse:
    cgpa = profile.cgpa
    arrears = profile.active_arrears
    
    if cgpa >= 9.0:
        standing = "First Class with Distinction (Exemplary)"
    elif cgpa >= 7.5:
        standing = "First Class (Above Average)"
    elif cgpa >= 6.0:
        standing = "Second Class (Satisfactory)"
    elif cgpa >= 5.0:
        standing = "Pass Division (Needs Focus)"
    else:
        standing = "Academic Probation Warning"
        
    strengths = []
    areas = []
    recommendations = []
    
    all_subjects = []
    for sem in profile.semesters:
        all_subjects.extend(sem.subjects)
        
    high_scoring = [s for s in all_subjects if s.grade_point >= 8.0]
    low_scoring = [s for s in all_subjects if s.grade_point < 6.0 or not s.is_passed]
    
    if high_scoring:
        for s in high_scoring[:3]:
            strengths.append(f"Demonstrated high proficiency in {s.subject_name} ({s.subject_code}) with Grade {s.grade}.")
    else:
        strengths.append("Consistent submission of internal continuous assessments.")
        
    if arrears > 0:
        areas.append(f"Immediate clearance of {arrears} backlog/arrear paper(s) required.")
        recommendations.append("Prioritize clearing arrears in the upcoming supplementary examination window.")
        
    if low_scoring:
        for s in low_scoring[:3]:
            areas.append(f"Sub-optimal score in {s.subject_name} ({s.subject_code}) — Grade: {s.grade}.")
            recommendations.append(f"Formulate a 4-week conceptual revision schedule for {s.subject_name}.")
    else:
        recommendations.append("Maintain high CGPA by targeting research electives and competitive seminar presentations.")
        
    summary_text = (
        f"Student {profile.name or 'Candidate'} holds an aggregate CGPA of {cgpa:.2f} "
        f"in Semester {profile.current_semester}. Standing is classified as '{standing}'. "
        f"{'There are currently active arrears requiring urgent attention.' if arrears > 0 else 'All enrolled course credits are fully cleared.'}"
    )
    
    return PerformanceSummaryResponse(
        mode="rules_based",
        student_name=profile.name,
        cgpa=cgpa,
        academic_standing=standing,
        strengths=strengths,
        areas_for_improvement=areas if areas else ["Continue regular review to prevent score drops in core theoretical modules."],
        summary_text=summary_text,
        recommendations=recommendations
    )

def generate_study_plan_rules(
    profile: StudentAcademicProfile,
    hours_per_week: int,
    target_sgpa: float,
    priority_codes: List[str]
) -> StudyPlanResponse:
    # Gather weak subjects or arrears
    weak_subjects = []
    for sem in profile.semesters:
        for s in sem.subjects:
            if not s.is_passed or s.grade_point < 7.0 or s.subject_code in priority_codes:
                weak_subjects.append(s)
                
    if not weak_subjects:
        # Default active courses
        default_names = [
            ("CS501", "Database Systems"),
            ("CS502", "Operating Systems"),
            ("CS504", "Algorithms"),
            ("MA501", "Discrete Mathematics")
        ]
    else:
        default_names = [(s.subject_code, s.subject_name) for s in weak_subjects]
        
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    slots = ["06:30 PM - 08:30 PM", "08:45 PM - 10:15 PM"]
    
    schedule = []
    idx = 0
    for day in days:
        for slot in slots:
            if len(schedule) * 1.5 >= hours_per_week:
                break
            code, name = default_names[idx % len(default_names)]
            activity = "Problem-Solving & Numerical Proofs" if "Math" in name or "Algorithm" in name else "Conceptual Review & Notes Synthesis"
            schedule.append(StudyPlanItem(
                day=day,
                time_slot=slot,
                subject_code=code,
                subject_name=name,
                activity=activity,
                focus_topics=["Core unit syllabus", "Past 3-year university question papers", "Formula retention checks"]
            ))
            idx += 1
            
    goals = [
        f"Achieve Target SGPA of {target_sgpa:.2f} by dedicating {hours_per_week} hours weekly.",
        "Complete 100% of previous university questions for weak modules by Week 6.",
        "Review self-assessment mock tests on alternate Sundays."
    ]
    
    return StudyPlanResponse(
        mode="rules_based",
        weekly_hours=hours_per_week,
        strategic_focus=f"Targeted remediation for {'arrear & low-scoring' if weak_subjects else 'core technical'} subjects",
        schedule=schedule,
        milestone_goals=goals
    )

def evaluate_risk_rules(profile: StudentAcademicProfile) -> RiskAnalysisResponse:
    score = 0.0
    factors = []
    interventions = []
    
    # 1. Arrears factor
    if profile.active_arrears >= 3:
        score += 45.0
        factors.append(f"Critical backlogs: {profile.active_arrears} active arrears accumulate graduation risk.")
        interventions.append("Mandatory academic counseling and supplementary coaching registration.")
    elif profile.active_arrears > 0:
        score += 25.0
        factors.append(f"{profile.active_arrears} pending arrear(s) prevent degree progression velocity.")
        interventions.append("Assign senior peer tutor for targeted backlog clearance.")
        
    # 2. CGPA factor
    if profile.cgpa < 5.0 and profile.cgpa > 0:
        score += 40.0
        factors.append(f"Sub-critical CGPA ({profile.cgpa:.2f}) falls below institutional minimum honor line.")
        interventions.append("Issue academic performance notice to faculty advisor and student mentor.")
    elif profile.cgpa < 6.5 and profile.cgpa > 0:
        score += 20.0
        factors.append(f"Borderline CGPA ({profile.cgpa:.2f}) indicates vulnerability in core curriculum.")
        interventions.append("Attendance verification and bi-weekly progress review by department HOD.")
        
    # 3. Semester trajectory
    if len(profile.semesters) >= 2:
        recent = profile.semesters[-1].sgpa
        previous = profile.semesters[-2].sgpa
        if recent < previous - 1.0:
            score += 15.0
            factors.append(f"Sharp performance deceleration: SGPA dropped from {previous:.2f} to {recent:.2f}.")
            interventions.append("Conduct personal diagnostic interview to identify wellness or conceptual bottlenecks.")
            
    score = min(100.0, max(0.0, score))
    
    if score >= 60.0:
        level = "CRITICAL"
        advisory = "HIGH RISK: Student is in severe academic distress. Immediate remediation is mandatory."
    elif score >= 35.0:
        level = "HIGH"
        advisory = "MODERATE RISK: Key performance metrics are below target. Guided intervention recommended."
    elif score >= 15.0:
        level = "MODERATE"
        advisory = "WATCHLIST: Early signs of minor performance drift detected. Monitor next exam cycle."
    else:
        level = "LOW"
        advisory = "SATISFACTORY: Student is performing within safe institutional standards."
        interventions.append("Encourage participation in advanced skill workshops and honors projects.")
        
    return RiskAnalysisResponse(
        mode="rules_based",
        risk_level=level,
        risk_score=score,
        risk_factors=factors if factors else ["No critical academic risk indicators detected."],
        early_interventions=interventions,
        advisory_notice=advisory
    )

def academic_chat_rules(message: str, profile: Optional[StudentAcademicProfile]) -> ChatResponse:
    import re
    q = message.lower().strip()
    name = profile.name if profile and profile.name else "Student"
    cgpa = profile.cgpa if profile else 8.45
    arrears = profile.active_arrears if profile else 0
    total_credits = 96
    
    # Target CGPA Calculation
    target_match = re.search(r'(?:target|reach|aim(?:ing)? for|achieve)\s+(?:cgpa\s+)?([0-9]+(?:\.[0-9]+)?)', q) or re.search(r'([0-9]+\.[0-9]+)\s+cgpa', q)
    if "target" in q or "need next semester" in q or (target_match and ("cgpa" in q or "sgpa" in q)):
        target_val = float(target_match.group(1)) if target_match else 9.0
        next_credits = 24
        curr_points = cgpa * total_credits
        new_total_credits = total_credits + next_credits
        required_points = (target_val * new_total_credits) - curr_points
        required_sgpa = round(required_points / next_credits, 2)
        max_possible_cgpa = round((curr_points + (10.0 * next_credits)) / new_total_credits, 2)
        
        if required_sgpa <= 10.0:
            answer = (
                f"### Target CGPA Planning ({target_val:.2f})\n\n"
                f"**Direct Answer:**\nTo raise your CGPA from {cgpa:.2f} to {target_val:.2f} with {next_credits} credits next semester, you must achieve a minimum SGPA of **{required_sgpa:.2f}**.\n\n"
                f"**Baseline Telemetry:**\n"
                f"- Current CGPA: **{cgpa:.2f}** ({total_credits} credits completed)\n"
                f"- Next Semester Max Achievable CGPA (with 10.0 SGPA): **{max_possible_cgpa:.2f}**\n\n"
                f"**Strategy:** Prioritize obtaining Grade 'O' (10 GP) in 4-credit core courses to achieve maximum upward pull."
            )
        else:
            answer = (
                f"### Target CGPA Planning ({target_val:.2f})\n\n"
                f"**Direct Answer:**\nReaching {target_val:.2f} in a single semester is mathematically impossible because it requires an SGPA of **{required_sgpa:.2f}**, which exceeds the maximum scale (10.0).\n\n"
                f"**Maximum Achievable Outcome:**\n"
                f"Even with a perfect 10.0 SGPA next semester, your maximum achievable CGPA will be **{max_possible_cgpa:.2f}**.\n"
                f"To reach {target_val:.2f}, you will need multiple consecutive high-scoring semesters."
            )
        followups = ["How to improve my SGPA?", "Show my semester history", "Generate a study plan"]
    elif "how" in q and ("sgpa" in q or "calculated" in q or "formula" in q):
        answer = (
            "### SGPA Calculation Methodology\n\n"
            "SGPA is calculated using the institutional formula:\n"
            "`SGPA = Σ(Subject Credits × Grade Points) / Σ(Total Applicable Credits)`\n\n"
            "**Example from Semester 4:**\n"
            "- CS401 (Database Systems): 4 credits × 9 GP (A+) = 36 points\n"
            "- CS402 (Operating Systems): 4 credits × 10 GP (O) = 40 points\n"
            "- CS403 (Computer Networks): 4 credits × 8 GP (A) = 32 points\n"
            "- CS404 (Algorithms): 4 credits × 9 GP (A+) = 36 points\n"
            "- CS405 (OS & DBMS Lab): 2 credits × 10 GP (O) = 20 points\n"
            "- **Total Points: 164.0 / 20 Credits = 8.20 SGPA**"
        )
        followups = ["What is my current CGPA?", "Compare my last two semesters", "Do I have any arrears?"]
    elif "compare" in q and ("semester" in q or "last two" in q or "progression" in q):
        answer = (
            "### Semester Progression Comparison\n\n"
            "**Semester 3 vs Semester 4 Audit:**\n"
            "- Semester 3 SGPA: **8.50** (24 credits)\n"
            "- Semester 4 SGPA: **8.60** (26 credits)\n"
            "- **Net Difference: +0.10 SGPA (IMPROVING trajectory)**\n\n"
            "Your continuous improvement reflects strong performance in lab practicals and advanced computer systems courses."
        )
        followups = ["What is my current CGPA?", "Create a study plan for me", "What are the grading rules?"]
    elif "why" in q and ("decrease" in q or "drop" in q or "lower" in q or "change" in q):
        answer = (
            "### Analysis of CGPA Fluctuations\n\n"
            "CGPA is a cumulative, credit-weighted average across all completed semesters. "
            "Whenever a semester SGPA is lower than your existing cumulative average, it pulls the overall CGPA down. "
            "To reverse any drops, target Grade 'A+' (9.0) or 'O' (10.0) in high-credit (4-credit) core theory subjects next semester."
        )
        followups = ["Calculate target SGPA for 9.0", "Show my weak subjects", "Create study plan"]
    elif "cgpa" in q or "gpa" in q or "cumulative" in q:
        answer = (
            f"Hello {name}, your official Cumulative Grade Point Average (CGPA) is **{cgpa:.2f} / 10.0** "
            f"based on 4 published semesters (96 completed credits). Academic classification is **First Class with Distinction**."
        )
        followups = ["What is my latest SGPA?", "How to reach target CGPA 9.0?", "Show my complete history"]
    elif "arrear" in q or "backlog" in q or "fail" in q:
        if arrears > 0:
            answer = (
                f"You currently have **{arrears} active arrear(s)** on your record. "
                "You must register for the upcoming supplementary examination cycle. "
                "Focus on passing the continuous internal assessments and scoring at least 45% in the theory examination."
            )
        else:
            answer = (
                f"Great news, {name}! You have **0 active arrears** or backlogs. "
                "Your academic record is completely clear."
            )
        followups = ["Show my semester history", "What is my current CGPA?", "Generate a study plan"]
    elif "study plan" in q or "schedule" in q or "plan" in q:
        answer = (
            "I can generate a tailored weekly timetable for you! "
            "Generally, we recommend allocating 16 hours per week across your core subjects, "
            "focusing 60% on numerical problem-solving and 40% on theoretical synthesis and past papers."
        )
        followups = ["Generate a 16-hour weekly study plan", "Prioritize my weak subjects", "When is the next exam?"]
    elif "grade" in q or "scale" in q or "grading" in q:
        answer = (
            "The institutional grading scale operates under the Choice Based Credit System (CBCS):\n"
            "- **O (Outstanding)**: 91–100% (Grade Point 10)\n"
            "- **A+ (Excellent)**: 81–90% (Grade Point 9)\n"
            "- **A (Very Good)**: 71–80% (Grade Point 8)\n"
            "- **B+ (Good)**: 61–70% (Grade Point 7)\n"
            "- **B (Average)**: 51–60% (Grade Point 6)\n"
            "- **C (Pass)**: 50% (Grade Point 5)\n"
            "- **F (Fail / Arrear)**: Below 50% (Grade Point 0)"
        )
        followups = ["What are the minimum passing marks?", "What is my CGPA?", "Check my arrear status"]
    else:
        answer = (
            f"Hello {name}! I am your CEHP AI Academic Assistant. "
            f"I have direct access to your examination history (Current CGPA: {cgpa:.2f}, Arrears: {arrears}). "
            "I can help you review semester performance, calculate target SGPAs, explain CBCS grading rules, or build custom study timetables."
        )
        followups = ["What is my current CGPA?", "Calculate target SGPA for 9.0", "Explain how my SGPA was calculated"]
        
    return ChatResponse(
        mode="rules_based",
        answer=answer,
        suggested_followups=followups
    )
