import { describe, it, expect } from 'vitest';
import { generateTranscriptPDF } from '../services/pdfService';

describe('Official PDF Transcript Service', () => {
  it('generates a valid, non-empty PDF document buffer with standard PDF header', async () => {
    const student = {
      name: 'Aarav Sharma',
      registrationNumber: 'CSE2023001',
      department: 'Computer Science and Engineering',
      program: 'B.E. Computer Science and Engineering',
      batch: '2023 - 2027',
      currentSemester: 5,
      cgpa: 8.45,
      totalCreditsEarned: 96,
    };

    const records = [
      {
        semesterNumber: 4,
        academicYear: '2024-2025',
        subjectCode: 'CS401',
        subjectName: 'Database Management Systems',
        credits: 4,
        internalMarks: 36,
        externalMarks: 52,
        totalMarks: 88,
        grade: 'A+',
        gradePoint: 9,
        resultStatus: 'PASS',
      },
      {
        semesterNumber: 4,
        academicYear: '2024-2025',
        subjectCode: 'CS402',
        subjectName: 'Operating Systems',
        credits: 4,
        internalMarks: 38,
        externalMarks: 54,
        totalMarks: 92,
        grade: 'O',
        gradePoint: 10,
        resultStatus: 'PASS',
      },
    ];

    const pdfBuffer = await generateTranscriptPDF(student, records);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // Standard PDF file starts with %PDF-
    const header = pdfBuffer.slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });
});
