# CEHP Deployment & Operations Guide

---

## 1. Prerequisites

- **Node.js**: v18.x or v20+ LTS
- **Python**: v3.11+ or v3.13
- **MongoDB**: Community or Enterprise v6.0+ or MongoDB Atlas
- **Package Manager**: npm v9+

---

## 2. Environment Variables Setup

### Backend (`backend/.env`):
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cehp
JWT_SECRET=super_secure_jwt_secret_cehp_portal_production_2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secure_refresh_secret_cehp_production_2026
JWT_REFRESH_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8001
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`):
```ini
VITE_API_BASE_URL=http://localhost:5000
```

### AI Service (`ai-service/.env`):
```ini
PORT=8001
HOST=0.0.0.0
GEMINI_API_KEY=your_optional_gemini_api_key
FALLBACK_TO_RULES=true
```

---

## 3. Running Locally in Development

From the monorepo root:

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start MongoDB**:
   Ensure MongoDB is running locally on port `27017` or configured via `MONGODB_URI`.

3. **Seed Database with Sample Academic Data**:
   ```bash
   npm run seed
   ```

4. **Launch all services concurrently**:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - AI Service: `http://localhost:8001`

---

## 4. Default Demo Credentials

All seeded accounts use password: **`Demo@1234`**

| Role | Email |
| :--- | :--- |
| **System Administrator** | `admin@cehp.edu` |
| **Controller of Examinations** | `controller@cehp.edu` |
| **HOD (Computer Science)** | `hod.cse@cehp.edu` |
| **Faculty Member** | `faculty1@cehp.edu` |
| **Student (Clean Record - CGPA 8.45)** | `student1@cehp.edu` |
| **Student (With Arrears / Backlogs)** | `student2@cehp.edu` |

---

## 5. Production Build Verification

To verify production readiness of all bundles:

```bash
# Build frontend and backend
npm run build

# Run all test suites
npm run test
```
