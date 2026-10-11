import { describe, it, expect } from 'vitest';
import {
  calculateGrade,
  calculateSGPA,
  calculateCGPA,
  getDefaultGradeThresholds
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

  it('correctly computes SGPA for a semester with multiple courses', () => {
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

  it('correctly computes CGPA weighted across multiple completed semesters', () => {
    const mockRule = {
      cgpaIncludedSemesters: 'ALL',
    } as unknown as IAcademicRule;

    const semesterData = [
      { semesterNumber: 1, sgpa: 8.0, credits: 20, earnedCredits: 20 },
      { semesterNumber: 2, sgpa: 8.5, credits: 20, earnedCredits: 20 },
      { semesterNumber: 3, sgpa: 9.0, credits: 20, earnedCredits: 20 },
    ];

    // (8.0*20 + 8.5*20 + 9.0*20) / 60 = 510 / 60 = 8.5
    const result = calculateCGPA(semesterData, mockRule);
    expect(result.cgpa).toBe(8.5);
    expect(result.totalCredits).toBe(60);
    expect(result.totalEarnedCredits).toBe(60);
  });
});
