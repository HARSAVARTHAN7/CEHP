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

export interface TargetPlanningResult {
  isAchievable: boolean;
  requiredSGPA: number;
  currentCGPA: number;
  currentCredits: number;
  targetCGPA: number;
  nextSemesterCredits: number;
  maxPossibleCGPA: number;
  semestersNeededAtMax: number;
  explanation: string;
}

/**
 * Calculates the exact SGPA required next semester to achieve a target CGPA.
 * Handles mathematical impossibility if required SGPA > 10.0 and calculates the maximum possible outcome.
 */
export function calculateTargetSGPA(
  currentCGPA: number,
  currentCredits: number,
  targetCGPA: number,
  nextSemesterCredits: number = 24,
  maxGradePoint: number = 10.0
): TargetPlanningResult {
  if (currentCredits <= 0) {
    const isAchievable = targetCGPA <= maxGradePoint && targetCGPA >= 0;
    return {
      isAchievable,
      requiredSGPA: targetCGPA,
      currentCGPA,
      currentCredits: 0,
      targetCGPA,
      nextSemesterCredits,
      maxPossibleCGPA: maxGradePoint,
      semestersNeededAtMax: isAchievable ? 1 : 0,
      explanation: isAchievable
        ? `Since this is your first semester, simply achieve an SGPA of ${targetCGPA.toFixed(2)} to reach your target CGPA.`
        : `Target CGPA of ${targetCGPA.toFixed(2)} exceeds the maximum possible grade point (${maxGradePoint.toFixed(2)}).`,
    };
  }

  const currentPoints = currentCGPA * currentCredits;
  const newTotalCredits = currentCredits + nextSemesterCredits;
  const targetTotalPoints = targetCGPA * newTotalCredits;
  const requiredPoints = targetTotalPoints - currentPoints;
  const rawRequiredSGPA = requiredPoints / nextSemesterCredits;
  const requiredSGPA = parseFloat(rawRequiredSGPA.toFixed(2));

  const maxPointsPossible = currentPoints + maxGradePoint * nextSemesterCredits;
  const maxPossibleCGPA = parseFloat((maxPointsPossible / newTotalCredits).toFixed(2));

  if (requiredSGPA <= maxGradePoint && requiredSGPA >= 0) {
    return {
      isAchievable: true,
      requiredSGPA,
      currentCGPA,
      currentCredits,
      targetCGPA,
      nextSemesterCredits,
      maxPossibleCGPA,
      semestersNeededAtMax: 1,
      explanation: `To raise your CGPA from ${currentCGPA.toFixed(2)} to ${targetCGPA.toFixed(2)} with ${nextSemesterCredits} credits next semester, you must achieve a minimum SGPA of **${requiredSGPA.toFixed(2)}**.`,
    };
  }

  // If impossible in 1 semester, calculate how many subsequent semesters at 10.0 would be needed
  let remainingPointsNeeded = targetCGPA * currentCredits - currentPoints;
  let semsNeeded = 0;
  let simCredits = currentCredits;
  let simPoints = currentPoints;

  while (semsNeeded < 10) {
    semsNeeded++;
    simCredits += nextSemesterCredits;
    simPoints += maxGradePoint * nextSemesterCredits;
    if (simPoints / simCredits >= targetCGPA) {
      break;
    }
  }

  return {
    isAchievable: false,
    requiredSGPA,
    currentCGPA,
    currentCredits,
    targetCGPA,
    nextSemesterCredits,
    maxPossibleCGPA,
    semestersNeededAtMax: semsNeeded <= 8 ? semsNeeded : -1,
    explanation:
      `Reaching a CGPA of ${targetCGPA.toFixed(2)} in a single semester is mathematically impossible because it requires an SGPA of **${requiredSGPA.toFixed(2)}**, which exceeds the maximum scale (${maxGradePoint.toFixed(2)}).\n\n` +
      `Even with a perfect ${maxGradePoint.toFixed(2)} SGPA next semester, your maximum achievable CGPA will be **${maxPossibleCGPA.toFixed(2)}**.\n` +
      (semsNeeded <= 8
        ? `To reach ${targetCGPA.toFixed(2)}, you will need approximately **${semsNeeded} consecutive semester(s)** with a perfect ${maxGradePoint.toFixed(2)} SGPA.`
        : `Reaching ${targetCGPA.toFixed(2)} cannot be attained within the remaining undergraduate credit duration.`),
  };
}

/**
 * Explains how SGPA was calculated for a given semester step by step.
 */
export function explainSGPACalculation(results: IResultRecord[]): {
  breakdown: { subjectCode: string; subjectName: string; credits: number; grade: string; gradePoint: number; weightedPoints: number }[];
  totalCredits: number;
  totalWeightedPoints: number;
  sgpa: number;
  formula: string;
} {
  const breakdown: { subjectCode: string; subjectName: string; credits: number; grade: string; gradePoint: number; weightedPoints: number }[] = [];
  let totalCredits = 0;
  let totalWeightedPoints = 0;

  for (const r of results) {
    const cred = r.credits || 0;
    const gp = r.gradePoint || 0;
    const wp = parseFloat((cred * gp).toFixed(2));
    totalCredits += cred;
    totalWeightedPoints += wp;

    const code = (r.subjectId as any)?.code || (r as any).subjectCode || 'SUB';
    const name = (r.subjectId as any)?.name || (r as any).subjectName || 'Course';

    breakdown.push({
      subjectCode: code,
      subjectName: name,
      credits: cred,
      grade: r.grade,
      gradePoint: gp,
      weightedPoints: wp,
    });
  }

  const sgpa = totalCredits > 0 ? parseFloat((totalWeightedPoints / totalCredits).toFixed(2)) : 0;

  return {
    breakdown,
    totalCredits,
    totalWeightedPoints: parseFloat(totalWeightedPoints.toFixed(2)),
    sgpa,
    formula: `SGPA = Σ(Credits × Grade Points) / Σ(Credits) = ${totalWeightedPoints.toFixed(2)} / ${totalCredits} = ${sgpa.toFixed(2)}`,
  };
}

/**
 * Compare performance between two semesters.
 */
export function compareSemesters(
  semA: { semesterNumber: number; sgpa: number; credits: number; subjects?: { name: string; grade: string; gradePoint: number }[] },
  semB: { semesterNumber: number; sgpa: number; credits: number; subjects?: { name: string; grade: string; gradePoint: number }[] }
): {
  earlierSem: number;
  laterSem: number;
  sgpaDifference: number;
  trajectory: 'IMPROVED' | 'DECLINED' | 'STABLE';
  summary: string;
} {
  const earlier = semA.semesterNumber < semB.semesterNumber ? semA : semB;
  const later = semA.semesterNumber < semB.semesterNumber ? semB : semA;

  const diff = parseFloat((later.sgpa - earlier.sgpa).toFixed(2));
  const trajectory = diff > 0.05 ? 'IMPROVED' : diff < -0.05 ? 'DECLINED' : 'STABLE';

  let summary = '';
  if (trajectory === 'IMPROVED') {
    summary = `Your performance increased by +${diff.toFixed(2)} SGPA from Semester ${earlier.semesterNumber} (${earlier.sgpa.toFixed(2)}) to Semester ${later.semesterNumber} (${later.sgpa.toFixed(2)}).`;
  } else if (trajectory === 'DECLINED') {
    summary = `Your performance dropped by ${diff.toFixed(2)} SGPA from Semester ${earlier.semesterNumber} (${earlier.sgpa.toFixed(2)}) to Semester ${later.semesterNumber} (${later.sgpa.toFixed(2)}).`;
  } else {
    summary = `Your performance remained steady across Semester ${earlier.semesterNumber} (${earlier.sgpa.toFixed(2)}) and Semester ${later.semesterNumber} (${later.sgpa.toFixed(2)}).`;
  }

  return {
    earlierSem: earlier.semesterNumber,
    laterSem: later.semesterNumber,
    sgpaDifference: diff,
    trajectory,
    summary,
  };
}

