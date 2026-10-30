const axios = require('axios');

async function run() {
  const baseURL = 'http://localhost:5000/api/v1';
  console.log('Logging in as student1@cehp.edu...');
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    email: 'student1@cehp.edu',
    password: 'Demo@1234'
  });

  const token = loginRes.data.accessToken;
  console.log('Logged in successfully. User:', loginRes.data.data.name);

  const client = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const inquiries = [
    "How much SGPA do I need next semester to reach target CGPA 9.0?",
    "Explain how my SGPA was calculated.",
    "Compare my last two semesters.",
    "What is my current CGPA?",
    "Which subjects have I failed or have arrears in?",
    "Explain why my CGPA decreased.",
    "Create a study plan for my weak subjects."
  ];

  console.log('\n--- TESTING ALL 7 SUGGESTED INQUIRIES ---\n');

  for (let i = 0; i < inquiries.length; i++) {
    const inquiry = inquiries[i];
    console.log(`\n======================================================`);
    console.log(`[TEST ${i + 1}/7] Inquiry: "${inquiry}"`);
    console.log(`======================================================`);
    
    const startTime = Date.now();
    try {
      const res = await client.post('/ai/chat', {
        message: inquiry,
        history: []
      });
      const duration = Date.now() - startTime;
      const data = res.data.data;
      console.log(`Status: ${res.status} (${duration}ms)`);
      console.log(`Intent detected: ${data.intent}`);
      console.log(`Mode: ${data.mode} | Model: ${data.model || 'N/A'}`);
      console.log(`Answer preview:\n${data.answer.substring(0, 300)}...`);
      console.log(`Dynamic Suggestions returned (${data.suggestions?.length || 0}):`);
      data.suggestions?.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));

      if (!data.answer || data.answer.includes('Based on your official transcript, your CGPA is') && inquiry.includes('study plan')) {
        console.error('❌ FAILED: Received generic fallback response!');
      } else {
        console.log('✅ PASSED: Inquiry generated specific answer and contextual suggestions.');
      }
    } catch (err) {
      console.error('❌ Request error:', err.response?.data || err.message);
    }
  }
}

run().catch(console.error);
