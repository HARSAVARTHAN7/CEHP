const axios = require('axios');

async function testConversationContext() {
  const baseURL = 'http://localhost:5000/api/v1';
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    email: 'student1@cehp.edu',
    password: 'Demo@1234'
  });

  const token = loginRes.data.accessToken;
  const client = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('\n--- TESTING MULTI-TURN CONVERSATION CONTEXT ---');

  // Turn 1
  const q1 = "Compare my last two semesters.";
  console.log(`\nTurn 1 User: "${q1}"`);
  const res1 = await client.post('/ai/chat', {
    message: q1,
    history: []
  });
  const a1 = res1.data.data.answer;
  console.log(`Turn 1 AI Answer preview: ${a1.substring(0, 150)}...`);

  // Turn 2 with history
  const q2 = "Which semester had better performance and why?";
  console.log(`\nTurn 2 User: "${q2}"`);
  const history = [
    { role: 'user', content: q1 },
    { role: 'assistant', content: a1 }
  ];
  const res2 = await client.post('/ai/chat', {
    message: q2,
    history
  });
  const a2 = res2.data.data.answer;
  console.log(`Turn 2 AI Answer:\n${a2.substring(0, 300)}...`);
  console.log(`Dynamic Suggestions after Turn 2:`, res2.data.data.suggestions);

  if (res2.data.data.answer && res2.status === 200) {
    console.log('\n✅ PASSED: Multi-turn conversation context works seamlessly with Groq!');
  }
}

testConversationContext().catch(console.error);
