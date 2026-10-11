# CEHP REST API Reference Specification

Base URL: `/api/v1`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /auth/login`
- **Description**: Authenticates user and sets `accessToken` and `refreshToken` in httpOnly cookies.
- **Request Body**:
  ```json
  {
    "email": "student1@cehp.edu",
    "password": "Demo@1234"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "660000000000000000000001",
        "name": "Aarav Sharma",
        "email": "student1@cehp.edu",
        "role": "STUDENT"
      }
    }
  }
  ```

### `POST /auth/logout`
- **Description**: Clears authentication cookies and invalidates refresh session.
- **Response** (`200 OK`):
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

### `GET /auth/me`
- **Description**: Returns profile information of the currently authenticated user.
- **Headers**: Cookie containing `accessToken`.

---

## 2. Academic Curriculum Management (`/api/v1/academic`)

- `GET /departments`: List institutional academic departments.
- `POST /departments`: Create a new department (Admin only).
- `GET /programs?departmentId=...`: List degree programs.
- `POST /programs`: Register a degree program (Admin only).
- `GET /subjects?programId=...&semester=...`: Retrieve course subjects.
- `POST /subjects`: Add a subject with credit weighting and marks scheme.
- `GET /semesters`: List term semesters.
- `GET /examinations`: List active examination cycles.
- `POST /examinations`: Schedule an examination cycle.

---

## 3. Examination Results & Marks Lifecycle (`/api/v1/results`)

### `GET /results`
- **Description**: List results filtered by examination, subject, or student. Role-scoped.
- **Query Params**: `examinationId`, `subjectId`, `semesterId`, `studentId`, `status`.

### `GET /results/my-history`
- **Description**: Retrieves full chronological semester results for the logged-in student.
- **Access**: `STUDENT` only.

### `GET /results/my-analytics`
- **Description**: Returns CGPA, SGPA per semester, pass count, and active arrears.
- **Access**: `STUDENT` only.

### `POST /results`
- **Description**: Faculty enters or uploads draft student marks.
- **Request Body**:
  ```json
  {
    "studentId": "660000000000000000000001",
    "subjectId": "660000000000000000000010",
    "semesterId": "660000000000000000000020",
    "examinationId": "660000000000000000000030",
    "internalMarks": 36,
    "externalMarks": 52
  }
  ```

### `POST /results/:id/submit`
- **Description**: Advances result status from `DRAFT` to `SUBMITTED`.

### `POST /results/:id/approve`
- **Description**: Examination Officer signs off result, moving status to `APPROVED`.

### `POST /examinations/:id/publish-results`
- **Description**: Publishes all approved marks for the examination cycle, computes student SGPAs/CGPAs, and issues alerts.

---

## 4. AI Academic Assistant (`/api/v1/ai`)

### `POST /ai/performance-summary`
- **Description**: Generates an AI performance summary with strengths and areas of improvement.

### `POST /ai/study-plan`
- **Description**: Generates personalized weekly study timetable prioritizing weak modules.
- **Request Body**:
  ```json
  {
    "available_hours_per_week": 15,
    "target_sgpa": 8.5,
    "priority_subject_codes": ["CS501"]
  }
  ```

### `POST /ai/chat`
- **Description**: Interactive academic assistant Q&A.
- **Request Body**:
  ```json
  {
    "message": "What is my current CGPA and how can I improve it?"
  }
  ```

### `POST /ai/risk-analysis`
- **Description**: Evaluates early-warning risk level (LOW, MODERATE, HIGH, CRITICAL).
