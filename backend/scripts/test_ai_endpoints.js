const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_jwt_key_change_in_production_minimum_32_chars';

// Generate valid test student token
const studentToken = jwt.sign(
  {
    userId: '665123456789abcdef123456',
    role: 'STUDENT',
    email: 'student1@cehp.edu',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testEndpoints() {
  console.log('--- TESTING AI ENDPOINTS ---');

  // 1. Test invalid token request (Should be 401)
  try {
    await axios.post(
      'http://localhost:5000/api/v1/ai/chat',
      { message: 'hello' },
      { headers: { Authorization: 'Bearer invalid_signature_token_12345' } }
    );
    console.error('❌ Failed: Invalid token request was allowed!');
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('✅ PASS: Invalid token successfully rejected with 401');
    } else {
      console.error('❌ Unexpected response for invalid token:', err.response?.status, err.message);
    }
  }

  // 2. Test status endpoint
  try {
    const res = await axios.get('http://localhost:5000/api/v1/ai/status', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('✅ PASS: /api/v1/ai/status:', res.data);
  } catch (err) {
    console.error('❌ /api/v1/ai/status failed:', err.response?.data || err.message);
  }

  // 3. Test chat endpoint
  try {
    const res = await axios.post(
      'http://localhost:5000/api/v1/ai/chat',
      { message: 'What is my current CGPA and how was it calculated?' },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('✅ PASS: /api/v1/ai/chat mode:', res.data.data.mode);
    console.log('Response excerpt:', res.data.data.answer.substring(0, 150) + '...');
  } catch (err) {
    console.error('❌ /api/v1/ai/chat failed:', err.response?.data || err.message);
  }

  // 4. Test study-plan endpoint
  try {
    const res = await axios.post(
      'http://localhost:5000/api/v1/ai/study-plan',
      {
        studyHoursPerDay: 4,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        weakSubjects: [{ name: 'CS401 - Database Systems', percentage: 48, credits: 4 }],
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('✅ PASS: /api/v1/ai/study-plan mode:', res.data.data.mode);
    console.log('Total scheduled days:', res.data.data.weeklySchedule?.length);
  } catch (err) {
    console.error('❌ /api/v1/ai/study-plan failed:', err.response?.data || err.message);
  }

  // 5. Test arrear-guidance endpoint
  try {
    const res = await axios.post(
      'http://localhost:5000/api/v1/ai/arrear-guidance',
      {},
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('✅ PASS: /api/v1/ai/arrear-guidance active count:', res.data.data.activeArrearsCount);
    console.log('Guidance:', res.data.data.guidance?.substring(0, 120) + '...');
  } catch (err) {
    console.error('❌ /api/v1/ai/arrear-guidance failed:', err.response?.data || err.message);
  }
}

testEndpoints();
