# Centralized Examination History, Result Analysis and AI-Powered Academic Assistant Portal (CEHP)

![Full-Stack](https://img.shields.io/badge/Stack-React_18_%7C_Node.js_%7C_FastAPI_%7C_MongoDB-indigo)
![TypeScript](https://img.shields.io/badge/Language-TypeScript_&_Python-blue)
![License](https://img.shields.io/badge/License-MIT-emerald)

**CEHP** is an enterprise-grade academic examination management and analytics platform. It unifies the entire examination lifecycle — curriculum structure, marks entry, verification and HOD moderation, official results publication, automated SGPA/CGPA calculations, and intelligent AI-powered student assistance.

---

## 🌟 Key Capabilities

### 1. Multi-Role Academic Portals
- **Students**: Real-time examination history, semester-wise SGPA trends, cumulative CGPA tracking, backlog/arrear alerts, printable official transcript views, and personalized AI academic assistant.
- **Faculty**: Assigned course rosters, continuous internal assessment (CIA max 40) and semester-end examination (SEE max 60) entry with live validation, CSV roster import/export, and submission workflows.
- **Department HODs**: Department marks moderation, faculty submission tracking, and approval signoffs.
- **Examination Officers (COE)**: Institution-wide moderation queues, batch approvals, exam cycle scheduling, and authorized official result publication.
- **System Administrators**: Institutional control plane for departments, degree programs, subjects, semesters, grading rules, and user identities.

### 2. Academic Calculation Engine
- Choice Based Credit System (CBCS) and Anna University-compliant 10-point grading scales (`O`, `A+`, `A`, `B+`, `B`, `C`, `P`, `F`, `AB`).
- Weighted SGPA computation: $\text{SGPA} = \frac{\sum (\text{Credits} \times \text{GradePoints})}{\sum \text{Credits}}$.
- Multi-semester cumulative CGPA recalculation engine with automatic arrear tracking.

### 3. AI-Powered Academic Assistant & Microservice
- **Performance Evaluation**: Summarizes student strengths and pinpointed areas of remediation.
- **Personalized Weekly Study Planner**: Generates actionable study timetables targeting weak courses.
- **Conversational Academic Assistant**: Answers inquiries regarding GPA, backlogs, and grading rules.
- **At-Risk Student Early Warning**: Evaluates performance deceleration and flags students needing intervention.
- **Deterministic Rules Fallback**: Zero downtime guaranteed via rules-based evaluation engine if external LLM APIs are unreachable.

---

## 🏗️ Monorepo Structure

```
d:/CEHP/
├── backend/            # Express, TypeScript, Mongoose, JWT Auth, Calculations
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── scripts/        # Realistic development seed script
├── frontend/           # React 18, Vite, Tailwind CSS, TanStack Query, Lucide
│   └── src/
│       ├── features/
│       ├── layouts/
│       ├── pages/
│       └── services/
├── ai-service/         # Python 3.13, FastAPI, Pydantic, Rules-based Engine
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   └── services/
│   └── tests/
├── docs/               # Comprehensive architecture, API, and DB documentation
└── package.json        # Root orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm run install:all
```

### 2. Database Seeding
Ensure MongoDB is running, then populate realistic demo records:
```bash
npm run seed
```

### 3. Launch Development Environment
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **FastAPI AI Microservice**: [http://localhost:8001](http://localhost:8001)

### 4. Demo Login Accounts
All accounts use the password: `Demo@1234`
- **Administrator**: `admin@cehp.edu`
- **Controller of Examinations**: `controller@cehp.edu`
- **Department HOD**: `hod.cse@cehp.edu`
- **Faculty**: `faculty1@cehp.edu`
- **Student (Honor Roll)**: `student1@cehp.edu`
- **Student (With Arrears)**: `student2@cehp.edu`

---

### 4. Official PDF Transcripts & Export
- Generates cryptographically verifiable, vectorized PDF transcripts using PDFKit.
- Includes candidate metadata, semester course breakdowns, credit allocations, SGPA/CGPA, QR verification tokens, and Controller of Examinations signature blocks.
- Accessible via student self-service (`GET /api/v1/students/me/transcript/pdf`) and examination administration portals.

---

## 🧪 Testing & Validation

```bash
# Run all automated test suites
npm run test

# Run backend calculation engine, AI evaluation, and PDF transcript tests
npm run test:backend

# Run frontend UI helper and role authorization guard tests
npm run test:frontend

# Validate production builds
npm run build
```

---

## 🔒 Security Hardening & Authorization Controls
- **Rate Limiting**: `express-rate-limit` active on authentication (`/api/v1/auth/login`) and AI inquiries (`/api/v1/ai/chat`) to thwart brute-force attacks and abuse.
- **Route Authorization (`RoleGuard`)**: Strict frontend and backend permission verification ensuring students, faculty, and administrators remain strictly within their authorized records.
- **Input Sanitization**: Zod validation schemas enforcing boundaries on examination marks, grades, and profile mutations.
- **Prompt Injection Defense**: Deterministic grounded evaluation preventing LLM jailbreaks or sensitive credential leakage.

