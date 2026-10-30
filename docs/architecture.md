# CEHP System Architecture Documentation

**Centralized Examination History, Result Analysis and AI-Powered Academic Assistant Portal**

---

## 1. High-Level Architecture Overview

CEHP is built as a robust, decoupled full-stack platform comprising three core runtime layers:
1. **Frontend Client**: Modern single-page application built with React 18, Vite, TypeScript, and Tailwind CSS. Provides specialized interfaces for Students, Faculty Members, Department HODs, Examination Officers, and System Administrators.
2. **Backend API Gateway & Core Engine**: Express + TypeScript server backed by MongoDB and Mongoose. Orchestrates authentication, RBAC authorization, academic curriculum management, marks lifecycle moderation, CGPA/SGPA calculations, and auditing.
3. **AI Microservice**: High-performance FastAPI (Python 3.13) service delivering contextual performance summaries, personalized weekly study timetables, conversational Q&A, and early-warning at-risk student classification. Features a deterministic rules-based evaluation engine to guarantee 100% uptime even if upstream LLM APIs are unreachable.

```
                      +------------------------------------+
                      |     Client Browser (React 18)      |
                      |  Students / Faculty / Exam / Admin |
                      +-----------------+------------------+
                                        |  HTTPS / JSON / JWT
                                        v
                      +-----------------+------------------+
                      |   Core Backend (Express + TS)      |
                      |  - JWT Auth (httpOnly Cookies)     |
                      |  - Role Middleware & Validation    |
                      |  - Calculation Engine (SGPA/CGPA)  |
                      |  - Results Moderation Lifecycle    |
                      +--------+-----------------+---------+
                               |                 |
                Mongoose / BSON |                 | HTTP Internal (/api/v1/ai)
                               v                 v
            +------------------+---+      +------+---------------------+
            |   MongoDB Cluster    |      |  AI Service (FastAPI / Py) |
            |  - Users & Profiles  |      |  - Performance Summary     |
            |  - Academic Entities |      |  - Weekly Study Planner    |
            |  - Marks & Results   |      |  - Risk Factor Evaluator   |
            |  - Audit Log Trail   |      |  - LLM + Rules Fallback    |
            +----------------------+      +----------------------------+
```

---

## 2. Authentication & Authorization Matrix

The portal implements security-in-depth:
- **Authentication**: Stateless JSON Web Tokens (JWT) issued on login, stored in secured `httpOnly`, `SameSite` cookies with refresh token rotation.
- **Account Lockout**: Automatic 15-minute brute-force lockout after 5 consecutive failed authentication attempts.
- **Role-Based Access Control (RBAC)**:

| Role | Dashboard | Marks Entry | Moderation / Approval | Results Publication | AI Assistant | System Setup |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **STUDENT** | Live CGPA & History | ❌ | ❌ | ❌ | Full Access | ❌ |
| **FACULTY** | Courses & Grading | Yes (CIA & SEE) | ❌ (Submit to HOD) | ❌ | ❌ | ❌ |
| **HOD** | Dept Overview | Review & Edit | Moderate Dept Marks | ❌ | ❌ | View Dept |
| **EXAM_OFFICER** | Moderation Queue | View All | Batch Approve | Publish Examination | ❌ | Exam Cycles |
| **ADMIN** | Institutional Control | Full | Full Override | Full Override | Full Access | Full Setup |

---

## 3. Examination & Marks Moderation Lifecycle

To prevent grade tampering, examination marks follow a strict state-machine lifecycle:

```
[DRAFT] (Faculty inputs CIA + SEE marks)
   |
   | Faculty submits
   v
[SUBMITTED] (Locked against faculty edits; under HOD review)
   |
   | HOD recommends & Controller signs off
   v
[APPROVED] (Verified marks locked; queued for publication)
   |
   | Examination Officer publishes cycle
   v
[PUBLISHED] (Public to student transcript; CGPA/SGPA calculated; Immutable)
```

---

## 4. Academic Calculation Engine

Calculations adhere to Choice Based Credit System (CBCS) / Anna University regulations:
- **Continuous Internal Assessment (CIA)**: Maximum 40 marks.
- **Semester End Examination (SEE)**: Maximum 60 marks.
- **Total Course Marks**: $\text{Total} = \text{Internal} + \text{External}$ (Maximum 100 marks).
- **Passing Threshold**: Minimum 45% aggregate and minimum 45% in external examination.
- **Semester Grade Point Average (SGPA)**:
  $$\text{SGPA} = \frac{\sum_{i=1}^{n} (\text{Credits}_i \times \text{GradePoint}_i)}{\sum_{i=1}^{n} \text{Credits}_i}$$
- **Cumulative Grade Point Average (CGPA)**:
  $$\text{CGPA} = \frac{\sum_{j=1}^{m} (\text{SGPA}_j \times \text{Credits}_j)}{\sum_{j=1}^{m} \text{Credits}_j}$$

---

## 5. AI Service Architecture & Graceful Fallback

```
+--------------------------------------------------------+
|                   Incoming Request                     |
+---------------------------+----------------------------+
                            |
           Is Groq API Key Configured & Valid?
             /                                \
           YES                                NO
           /                                    \
+---------v----------+              +------------v-------------+
| Query Groq Cloud   |              | Rule-Based Fallback      |
| LPU Inference API  |              | - Deterministic Scoring  |
+---------+----------+              | - At-risk Factor Matrix  |
          |                         | - Dynamic Study Schedule |
      Success?                      +------------+-------------+
       /     \                                   |
     YES      NO (Network/Quota/Timeout)         |
     /         \                                 |
+---v----+   +--v------------------------------+ |
| Return |   | Fallback to Academic Rules      | |
| LLM    |   | Mode: 'rules_based'             | |
| Output |   +-----------------+---------------+ |
+--------+                     |                 |
                               +-------->--------+
```

Even during complete external network isolation, zero downtime or exceptions occur. The system outputs informative, actionable recommendations.
