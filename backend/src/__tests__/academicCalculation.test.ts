import { describe, it, expect } from 'vitest';
import {
  calculateGrade,
  calculateSGPA,
  calculateCGPA,
  determineResultStatus,
  calculateTargetSGPA,
  explainSGPACalculation,
  compareSemesters,
  getDefaultGradeThresholds,
} from '../services/academicCalculation';
import { IAcademicRule } from '../models/AcademicRule';
import { IResultRecord } from '../models/ResultRecord';

describe('Academic Calculation Engine', () => {
  const defaultThresholds = getDefaultGradeThresholds();

  it('correctly maps percentage to letter grades and grade points', () => {
    expect(calculateGrade(95, defaultThresholds)).toEqual({ grade: 'O', gradePoint: 10 });
    expect(calculateGrade(85, defaultThresholds)).toEqual({ grade: 'A+', gradePoint: 9 });
    expect(calculateGrade(75, defaultThresholds)).toEqual({ grade: 'A', gradePoint: 8 });
    expect(calculateGrade(65, defaultThresholds)).toEqual({ grade: 'B+', gradePoint: 7 });
    expect(calculateGrade(55, defaultThresholds)).toEqual({ grade: 'B', gradePoint: 6 });
    expect(calculateGrade(50, defaultThresholds)).toEqual({ grade: 'C', gradePoint: 5 });
    expect(calculateGrade(35, defaultThresholds)).toEqual({ grade: 'F', gradePoint: 0 });
  });

  it('determines pass/fail based on institutional rules and minimum mark thresholds', () => {
    const ruleWithMins = {
      minPassPercentage: 50,
      minInternalPassMarks: 18,
      minExternalPassMarks: 24,
    } as unknown as IAcademicRule;

    // Normal pass (total 70/100, int 28, ext 42)
    expect(determineResultStatus(70, 100, 28, 42, ruleWithMins)).toBe('PASS');

    // Fails due to external marks below minExternalPassMarks (24), even though total is 50
    expect(determineResultStatus(50, 100, 30, 20, ruleWithMins)).toBe('FAIL');

    // Fails due to internal marks below minInternalPassMarks (18)
    expect(determineResultStatus(52, 100, 15, 37, ruleWithMins)).toBe('FAIL');

    // Absent candidate
    expect(determineResultStatus(0, 100, 0, 0, ruleWithMins, true)).toBe('ABSENT');
  });

  it('correctly computes SGPA for a semester with multiple courses and unequal credits', () => {
    const mockRule = {
      sgpaExcludeFailedSubjects: false,
      minPassPercentage: 50,
    } as unknown as IAcademicRule;

    const mockResults = [
      {
        credits: 4,
        gradePoint: 9, // A+ -> 36 points
        publicationStatus: 'PUBLISHED',
        resultStatus: 'PASS',
        internalMarks: 35,
        externalMarks: 50,
        totalMarks: 85,
        maximumMarks: 100,
        grade: 'A+',
        attemptNumber: 1,
        isArrear: false,
      },
      {
        credits: 4,
        gradePoint: 8, // A -> 32 points
        publicationStatus: 'PUBLISHED',
        resultStatus: 'PASS',
        internalMarks: 30,
        externalMarks: 45,
        totalMarks: 75,
        maximumMarks: 100,
        grade: 'A',
        attemptNumber: 1,
        isArrear: false,
      },
      {
        credits: 2,
        gradePoint: 10, // O -> 20 points
        publicationStatus: 'PUBLISHED',
        resultStatus: 'PASS',
        internalMarks: 40,
        externalMarks: 55,
        totalMarks: 95,
        maximumMarks: 100,
        grade: 'O',
        attemptNumber: 1,
        isArrear: false,
      },
    ] as unknown as IResultRecord[];

    // Total points: 36 + 32 + 20 = 88. Total credits: 4 + 4 + 2 = 10. SGPA = 8.8
    const result = calculateSGPA(mockResults, mockRule);
    expect(result.sgpa).toBe(8.8);
    expect(result.earnedCredits).toBe(10);
    expect(result.failedSubjects.length).toBe(0);
  });

  it('correctly computes SGPA when a student fails a course', () => {
    const mockRule = {
      sgpaExcludeFailedSubjects: false,
      minPassPercentage: 50,
    } as unknown as IAcademicRule;

    const mockResultsWithFail = [
      {
        credits: 4,
        gradePoint: 8, // 32 points
        publicationStatus: 'PUBLISHED',
        resultStatus: 'PASS',
        internalMarks: 30,
        externalMarks: 45,
        totalMarks: 75,
        grade: 'A',
      },
      {
        credits: 4,
        gradePoint: 0, // F -> 0 points, but 4 credits included in denominator
        publicationStatus: 'PUBLISHED',
        resultStatus: 'FAIL',
        internalMarks: 15,
        externalMarks: 20,
        totalMarks: 35,
        grade: 'F',
      },
    ] as unknown as IResultRecord[];

    // 32 points / 8 credits = 4.0 SGPA, earnedCredits = 4
    const result = calculateSGPA(mockResultsWithFail, mockRule);
    expect(result.sgpa).toBe(4.0);
    expect(result.totalCredits).toBe(8);
    expect(result.earnedCredits).toBe(4);
    expect(result.failedSubjects.length).toBe(1);
  });

  it('correctly computes credit-weighted CGPA across unequal semesters', () => {
    const mockRule = {
      cgpaIncludedSemesters: 'ALL',
    } as unknown as IAcademicRule;

    const semesterData = [
      { semesterNumber: 1, sgpa: 8.0, credits: 20, earnedCredits: 20 },
      { semesterNumber: 2, sgpa: 8.5, credits: 24, earnedCredits: 24 },
      { semesterNumber: 3, sgpa: 9.0, credits: 26, earnedCredits: 26 },
    ];

    // (8.0*20 + 8.5*24 + 9.0*26) / 70 = (160 + 204 + 234) / 70 = 598 / 70 = 8.5428... -> 8.54
    const result = calculateCGPA(semesterData, mockRule);
    expect(result.cgpa).toBe(8.54);
    expect(result.totalCredits).toBe(70);
    expect(result.totalEarnedCredits).toBe(70);
  });

  it('determines target SGPA requirements and mathematical impossibility', () => {
    // Current CGPA 8.0 with 60 credits. Target 8.5 next semester (20 credits).
    // Target points = 8.5 * 80 = 680. Current points = 8.0 * 60 = 480.
    // Required next semester points = 200 / 20 = 10.0 SGPA.
    const achievablePlan = calculateTargetSGPA(8.0, 60, 8.5, 20);
    expect(achievablePlan.isAchievable).toBe(true);
    expect(achievablePlan.requiredSGPA).toBe(10.0);
    expect(achievablePlan.semestersNeededAtMax).toBe(1);

    // Current CGPA 7.0 with 60 credits. Target 9.0 next semester (20 credits).
    // Target points = 9.0 * 80 = 720. Current points = 7.0 * 60 = 420.
    // Required = 300 / 20 = 15.0 SGPA (impossible in single semester).
    const impossiblePlan = calculateTargetSGPA(7.0, 60, 9.0, 20);
    expect(impossiblePlan.isAchievable).toBe(false);
    expect(impossiblePlan.requiredSGPA).toBe(15.0);
    expect(impossiblePlan.maxPossibleCGPA).toBe(7.75); // (420 + 200) / 80 = 620 / 80 = 7.75
    expect(impossiblePlan.explanation).toContain('mathematically impossible');
  });

  it('generates step-by-step SGPA formula explanation', () => {
    const mockResults = [
      {
        subjectCode: 'CS501',
        subjectName: 'DBMS',
        credits: 4,
        grade: 'A+',
        gradePoint: 9,
      },
      {
        subjectCode: 'CS502',
        subjectName: 'OS',
        credits: 4,
        grade: 'O',
        gradePoint: 10,
      },
    ] as unknown as IResultRecord[];

    const explanation = explainSGPACalculation(mockResults);
    expect(explanation.totalCredits).toBe(8);
    expect(explanation.totalWeightedPoints).toBe(76);
    expect(explanation.sgpa).toBe(9.5);
    expect(explanation.formula).toContain('76.00 / 8 = 9.50');
  });

  it('compares two semesters and pinpoints trajectory', () => {
    const sem1 = { semesterNumber: 1, sgpa: 8.1, credits: 22 };
    const sem2 = { semesterNumber: 2, sgpa: 8.5, credits: 24 };

    const comp = compareSemesters(sem1, sem2);
    expect(comp.earlierSem).toBe(1);
    expect(comp.laterSem).toBe(2);
    expect(comp.sgpaDifference).toBe(0.4);
    expect(comp.trajectory).toBe('IMPROVED');
  });
});
