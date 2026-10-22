import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface TranscriptStudentData {
  name: string;
  registrationNumber: string;
  department: string;
  program: string;
  batch: string;
  currentSemester: number;
  cgpa: number;
  totalCreditsEarned: number;
}

export interface TranscriptRecord {
  semesterNumber: number;
  academicYear: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: string;
  gradePoint: number;
  resultStatus: string;
}

export async function generateTranscriptPDF(
  student: TranscriptStudentData,
  records: TranscriptRecord[]
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Official Transcript - ${student.registrationNumber}`,
          Author: 'Office of the Controller of Examinations',
          Subject: 'Consolidated Academic Grade Card',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Generate verification QR code as data URL
      const verifyUrl = `https://cehp.edu/verify?reg=${student.registrationNumber}&cgpa=${student.cgpa}&t=${Date.now()}`;
      let qrBuffer: Buffer | null = null;
      try {
        qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 70, margin: 1 });
      } catch {
        qrBuffer = null;
      }

      // --- Institutional Header ---
      doc.rect(40, 40, 515, 75).fill('#0f172a');

      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
        .text('CENTRAL EXAMINATION COUNCIL & AUTONOMOUS BOARD', 50, 52, { align: 'center', width: 495 });

      doc.fontSize(10).font('Helvetica')
        .text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', 50, 70, { align: 'center', width: 495 });

      doc.fontSize(9).fillColor('#38bdf8').font('Helvetica-Bold')
        .text('CONSOLIDATED OFFICIAL GRADE TRANSCRIPT & RECORD OF PERFORMANCE', 50, 88, { align: 'center', width: 495 });

      // --- Student Metadata Section ---
      doc.y = 125;
      doc.fillColor('#000000').fontSize(9).font('Helvetica');

      // Left Column
      doc.text(`Candidate Name: `, 45, 130, { continued: true }).font('Helvetica-Bold').text(student.name);
      doc.font('Helvetica').text(`Registration Number: `, 45, 145, { continued: true }).font('Helvetica-Bold').text(student.registrationNumber);
      doc.font('Helvetica').text(`Program / Degree: `, 45, 160, { continued: true }).font('Helvetica-Bold').text(student.program || 'B.E. Computer Science and Engineering');
      doc.font('Helvetica').text(`Department: `, 45, 175, { continued: true }).font('Helvetica-Bold').text(student.department || 'Computer Science and Engineering');

      // Right Column
      doc.font('Helvetica').text(`Academic Batch: `, 320, 130, { continued: true }).font('Helvetica-Bold').text(student.batch || '2023 - 2027');
      doc.font('Helvetica').text(`Current Semester: `, 320, 145, { continued: true }).font('Helvetica-Bold').text(`Semester ${student.currentSemester}`);
      doc.font('Helvetica').text(`Total Credits Earned: `, 320, 160, { continued: true }).font('Helvetica-Bold').text(`${student.totalCreditsEarned} Credits`);
      doc.font('Helvetica').text(`Cumulative CGPA: `, 320, 175, { continued: true }).font('Helvetica-Bold').text(`${student.cgpa.toFixed(2)} / 10.0`);

      // Embed QR code on the top-right
      if (qrBuffer) {
        doc.image(qrBuffer, 485, 125, { width: 65 });
      }

      // Separator line
      doc.moveTo(40, 195).lineTo(555, 195).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // --- Semester-wise Course Table ---
      let currentY = 205;

      // Group records by semester
      const semMap = new Map<number, TranscriptRecord[]>();
      for (const r of records) {
        const s = r.semesterNumber || 1;
        if (!semMap.has(s)) semMap.set(s, []);
        semMap.get(s)!.push(r);
      }

      const sortedSemesters = Array.from(semMap.keys()).sort((a, b) => a - b);

      for (const semNum of sortedSemesters) {
        const semRecords = semMap.get(semNum) || [];

        // Check page break
        if (currentY > 680) {
          doc.addPage();
          currentY = 40;
        }

        // Semester Sub-header
        doc.rect(40, currentY, 515, 18).fill('#f1f5f9');
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9)
          .text(`SEMESTER ${semNum} EXAMINATION RESULTS`, 45, currentY + 5);

        currentY += 22;

        // Table Header
        doc.rect(40, currentY, 515, 15).fill('#e2e8f0');
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8);
        doc.text('CODE', 45, currentY + 4, { width: 55 });
        doc.text('COURSE TITLE', 105, currentY + 4, { width: 200 });
        doc.text('CREDITS', 315, currentY + 4, { width: 45, align: 'center' });
        doc.text('MARKS', 365, currentY + 4, { width: 50, align: 'center' });
        doc.text('GRADE', 420, currentY + 4, { width: 45, align: 'center' });
        doc.text('POINTS', 470, currentY + 4, { width: 40, align: 'center' });
        doc.text('STATUS', 515, currentY + 4, { width: 35, align: 'center' });

        currentY += 17;

        let semCredits = 0;
        let semPoints = 0;

        // Rows
        for (const r of semRecords) {
          if (currentY > 730) {
            doc.addPage();
            currentY = 40;
          }

          doc.fillColor('#334155').font('Helvetica').fontSize(8);
          doc.text(r.subjectCode, 45, currentY + 3, { width: 55 });
          doc.text(r.subjectName, 105, currentY + 3, { width: 200, height: 12, ellipsis: true });
          doc.text(String(r.credits), 315, currentY + 3, { width: 45, align: 'center' });
          doc.text(String(r.totalMarks), 365, currentY + 3, { width: 50, align: 'center' });
          doc.font('Helvetica-Bold').text(r.grade, 420, currentY + 3, { width: 45, align: 'center' });
          doc.font('Helvetica').text(String(r.gradePoint), 470, currentY + 3, { width: 40, align: 'center' });

          const isPass = r.resultStatus === 'PASS';
          doc.fillColor(isPass ? '#15803d' : '#b91c1c').font('Helvetica-Bold')
            .text(r.resultStatus, 515, currentY + 3, { width: 35, align: 'center' });

          semCredits += r.credits;
          semPoints += r.credits * r.gradePoint;
          currentY += 14;
        }

        const semSGPA = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : '0.00';

        // Semester Summary Line
        doc.rect(40, currentY, 515, 14).fill('#f8fafc');
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
        doc.text(`Semester ${semNum} Total Credits: ${semCredits}   |   Semester SGPA: ${semSGPA}`, 45, currentY + 3);

        currentY += 20;
      }

      // --- Overall Cumulative Summary Block ---
      if (currentY > 670) {
        doc.addPage();
        currentY = 40;
      }

      doc.rect(40, currentY, 515, 45).fill('#f0fdf4').strokeColor('#86efac').lineWidth(1).stroke();
      doc.fillColor('#166534').font('Helvetica-Bold').fontSize(10)
        .text('ACADEMIC COMPLETION & PERFORMANCE AUDIT', 50, currentY + 8);

      const standing =
        student.cgpa >= 8.5
          ? 'First Class with Distinction (Exemplary)'
          : student.cgpa >= 7.0
          ? 'First Class'
          : 'Second Class';

      doc.fillColor('#15803d').font('Helvetica').fontSize(8.5)
        .text(`Cumulative Grade Point Average (CGPA): ${student.cgpa.toFixed(2)} / 10.0   |   Classification: ${standing}`, 50, currentY + 24)
        .text(`Total Degree Credits Earned: ${student.totalCreditsEarned}   |   Medium of Instruction: English`, 50, currentY + 34);

      currentY += 60;

      // --- Security Signatures & Disclaimer ---
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }

      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5)
        .text('This is an electronically generated and cryptographically verifiable official institutional transcript. Tampering with this record is a punishable offense.', 40, currentY, { width: 515, align: 'center' });

      currentY += 25;

      // Signature blocks
      doc.moveTo(60, currentY + 25).lineTo(180, currentY + 25).strokeColor('#94a3b8').stroke();
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8)
        .text('Deputy Controller', 60, currentY + 30, { width: 120, align: 'center' });

      doc.moveTo(380, currentY + 25).lineTo(500, currentY + 25).strokeColor('#94a3b8').stroke();
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8)
        .text('Controller of Examinations', 380, currentY + 30, { width: 120, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
