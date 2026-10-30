const axios = require('axios');

async function testAll() {
  const baseURL = 'http://localhost:5000/api/v1';
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    email: 'student1@cehp.edu',
    password: 'Demo@1234'
  });
  const token = loginRes.data.accessToken;

  const questions = [
    "How much SGPA do I need next semester to reach target CGPA 9.0?",
    "Explain how my SGPA was calculated.",
    "Compare my last two semesters.",
    "What is my current CGPA?",
    "Which subjects have I failed or have arrears in?",
    "Explain why my CGPA decreased.",
    "Create a study plan for my weak subjects."
  ];

  for (const q of questions) {
    try {
      const res = await axios.post(`${baseURL}/ai/chat`, { message: q }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Q: "${q}" -> STATUS: ${res.status}, MODE: ${res.data.data.mode}`);
    } catch (err) {
      console.error(`Q: "${q}" -> ERROR:`, err.response?.status, err.response?.data);
    }
  }
}

testAll().catch(console.error);
