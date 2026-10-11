import { IAcademicRule, IGradeThreshold } from '../models/AcademicRule';
import { IResultRecord } from '../models/ResultRecord';

export interface SubjectResult {
  subjectCode: string;
  subjectName: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  maximumMarks: number;
  grade: string;
  gradePoint: number;
  resultStatus: string;
  attemptNumber: number;
  isArrear: boolean;
}

export interface SGPAResult {
  sgpa: number;
  totalCredits: number;
  earnedCredits: number;
  totalGradePoints: number;
  subjectResults: SubjectResult[];
  failedSubjects: SubjectResult[];
}

export interface CGPAResult {
  cgpa: number;
  semesterSGPAs: { semesterNumber: number; sgpa: number; credits: number }[];
  totalCredits: number;
  totalEarnedCredits: number;
}

/**
 * Determine grade and grade point from percentage using configured thresholds.
 * Thresholds must be sorted by minPercentage descending.
 */
export function calculateGrade(
  percentage: number,
  thresholds: IGradeThreshold[]
): { grade: string; gradePoint: number } {
  const sorted = [...thresholds].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const threshold of sorted) {
    if (percentage >= threshold.minPercentage && percentage <= threshold.maxPercentage) {
      return { grade: threshold.grade, gradePoint: threshold.gradePoint };
    }
  }
  // Default fail grade
  return { grade: 'F', gradePoint: 0.0 };
}

/**
 * Determine result status considering internal and external minimum marks.
 */
export function determineResultStatus(
  totalMarks: number,
  maximumMarks: number,
  internalMarks: number,
  externalMarks: number,
  rule: IAcademicRule,
  absent = false
): 'PASS' | 'FAIL' | 'ABSENT' {
  if (absent) return 'ABSENT';

  const percentage = (totalMarks / maximumMarks) * 100;

  // Check external minimum if configured
  if (rule.minExternalPassMarks !== undefined && rule.minExternalPassMarks !== null) {
    if (externalMarks < rule.minExternalPassMarks) return 'FAIL';
  }

  // Check internal minimum if configured
  if (rule.minInternalPassMarks !== undefined && rule.minInternalPassMarks !== null) {
    if (internalMarks < rule.minInternalPassMarks) return 'FAIL';
  }

  return percentage >= rule.minPassPercentage ? 'PASS' : 'FAIL';
}

/**
 * Calculate SGPA for a set of result records using configured academic rules.
 * Formula: SGPA = Σ(credits × gradePoints) / Σ(credits)
 * Note: AUDIT subjects and FAIL subjects (if configured) may be excluded.
 */
export function calculateSGPA(
  results: IResultRecord[],
  rule: IAcademicRule
): SGPAResult {
  const publishedResults = results.filter(
    (r) => r.publicationStatus === 'PUBLISHED'
  );

  if (publishedResults.length === 0) {
    return {
      sgpa: 0,
      totalCredits: 0,
      earnedCredits: 0,
      totalGradePoints: 0,
      subjectResults: [],
      failedSubjects: [],
    };
  }

  let totalWeightedPoints = 0;
  let totalCreditsForSGPA = 0;
  let earnedCredits = 0;
  const failedSubjects: SubjectResult[] = [];
  const subjectResults: SubjectResult[] = [];

  for (const result of publishedResults) {
    const sr: SubjectResult = {
      subjectCode: '',
      subjectName: '',
      credits: result.credits,
      internalMarks: result.internalMarks,
      externalMarks: result.externalMarks,
      totalMarks: result.totalMarks,
      maximumMarks: result.maximumMarks,
      grade: result.grade,
      gradePoint: result.gradePoint,
      resultStatus: result.resultStatus,
      attemptNumber: result.attemptNumber,
      isArrear: result.isArrear,
    };
    subjectResults.push(sr);

    if (result.resultStatus === 'PASS') {
      earnedCredits += result.credits;
    } else if (result.resultStatus === 'FAIL') {
      failedSubjects.push(sr);
    }

    // Include in SGPA calculation unless configured to exclude failed subjects
    const includeInSGPA = !(rule.sgpaExcludeFailedSubjects && result.resultStatus === 'FAIL');

    if (includeInSGPA && result.credits > 0) {
      totalWeightedPoints += result.credits * result.gradePoint;
      totalCreditsForSGPA += result.credits;
    }
  }

  if (totalCreditsForSGPA === 0) {
    return {
      sgpa: 0,
      totalCredits: 0,
      earnedCredits,
      totalGradePoints: totalWeightedPoints,
      subjectResults,
      failedSubjects,
    };
  }

  const sgpa = parseFloat((totalWeightedPoints / totalCreditsForSGPA).toFixed(2));

  return {
    sgpa,
    totalCredits: totalCreditsForSGPA,
    earnedCredits,
    totalGradePoints: parseFloat(totalWeightedPoints.toFixed(2)),
    subjectResults,
    failedSubjects,
  };
}

/**
 * Calculate CGPA across multiple semesters.
 * Formula: CGPA = Σ(credits × gradePoints across all semesters) / Σ(credits)
 */
export function calculateCGPA(
  semesterData: { semesterNumber: number; sgpa: number; credits: number; earnedCredits: number }[],
  rule: IAcademicRule
): CGPAResult {
  if (semesterData.length === 0) {
    return {
      cgpa: 0,
      semesterSGPAs: [],
      totalCredits: 0,
      totalEarnedCredits: 0,
    };
  }

  let dataToUse = [...semesterData];

  if (rule.cgpaIncludedSemesters === 'BEST_N' && rule.bestN) {
    dataToUse = [...semesterData]
      .sort((a, b) => b.sgpa - a.sgpa)
      .slice(0, rule.bestN);
  }

  const totalWeightedPoints = dataToUse.reduce(
    (sum, s) => sum + s.sgpa * s.credits,
    0
  );
  const totalCredits = dataToUse.reduce((sum, s) => sum + s.credits, 0);
  const totalEarnedCredits = semesterData.reduce((sum, s) => sum + s.earnedCredits, 0);

  if (totalCredits === 0) {
    return {
      cgpa: 0,
      semesterSGPAs: dataToUse.map((s) => ({
        semesterNumber: s.semesterNumber,
        sgpa: s.sgpa,
        credits: s.credits,
      })),
      totalCredits: 0,
      totalEarnedCredits,
    };
  }

  const cgpa = parseFloat((totalWeightedPoints / totalCredits).toFixed(2));

  return {
    cgpa,
    semesterSGPAs: dataToUse.map((s) => ({
      semesterNumber: s.semesterNumber,
      sgpa: s.sgpa,
      credits: s.credits,
    })),
    totalCredits,
    totalEarnedCredits,
  };
}

/**
 * Get default grading thresholds (10-point scale, Anna University style).
 * Used as fallback when no AcademicRule is configured.
 */
export function getDefaultGradeThresholds(): IGradeThreshold[] {
  return [
    { minPercentage: 91, maxPercentage: 100, grade: 'O', gradePoint: 10, description: 'Outstanding' },
    { minPercentage: 81, maxPercentage: 90, grade: 'A+', gradePoint: 9, description: 'Excellent' },
    { minPercentage: 71, maxPercentage: 80, grade: 'A', gradePoint: 8, description: 'Very Good' },
    { minPercentage: 61, maxPercentage: 70, grade: 'B+', gradePoint: 7, description: 'Good' },
    { minPercentage: 51, maxPercentage: 60, grade: 'B', gradePoint: 6, description: 'Average' },
    { minPercentage: 50, maxPercentage: 50, grade: 'C', gradePoint: 5, description: 'Pass' },
    { minPercentage: 0, maxPercentage: 49, grade: 'F', gradePoint: 0, description: 'Fail' },
  ];
}
