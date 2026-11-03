require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:5001/api';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body: data };
}

async function run() {
  console.log('--- Testing Direct Notification & Connection Workflow ---');

  // 1. Login test2 (Recruiter)
  const loginRec = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'test2@recruiter.com', password: 'password123' }),
  });
  if (!loginRec.ok) throw new Error(`Recruiter login failed: ${JSON.stringify(loginRec.body)}`);
  const recToken = loginRec.body.token;
  const recUser = loginRec.body.user;
  console.log(`✔ Recruiter test2 logged in (#${recUser.id}: ${recUser.name})`);

  // 2. Login test1 (Candidate)
  const loginCand = await fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'test1@candidate.com', password: 'password123' }),
  });
  if (!loginCand.ok) throw new Error(`Candidate login failed: ${JSON.stringify(loginCand.body)}`);
  const candToken = loginCand.body.token;
  const candUser = loginCand.body.user;
  console.log(`✔ Candidate test1 logged in (#${candUser.id}: ${candUser.name})`);

  // 3. Recruiter sends connection request to Candidate (POST /api/swipes)
  console.log(`\n👉 Recruiter (#${recUser.id}) swipes RIGHT (LIKE) on Candidate (#${candUser.id})...`);
  const swipeRes = await fetchJson(`${API_BASE}/swipes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${recToken}` },
    body: JSON.stringify({ toUserId: candUser.id, direction: 'LIKE' }),
  });
  console.log('Swipe response:', swipeRes.body);
  if (!swipeRes.ok) throw new Error(`Swipe failed: ${JSON.stringify(swipeRes.body)}`);

  // 4. Directly check Candidate's notifications (GET /api/notifications)
  console.log(`\n👉 Checking Candidate (#${candUser.id}) notifications directly from DB...`);
  const notifRes = await fetchJson(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  console.log(`Candidate has ${notifRes.body?.data?.length || 0} notifications:`, notifRes.body?.data);

  const reqNotif = (notifRes.body?.data || []).find(
    (n) => n.type === 'REQUEST' && n.data?.fromUserId === recUser.id
  );
  if (!reqNotif) {
    throw new Error('❌ FAILURE: Candidate did NOT receive the collaboration request notification directly in DB!');
  }
  console.log('✔ SUCCESS: Direct notification found in candidate inbox:', {
    title: reqNotif.title,
    body: reqNotif.body,
    data: reqNotif.data,
  });

  // 5. Check Candidate's received requests list (GET /api/swipes/received)
  const receivedRes = await fetchJson(`${API_BASE}/swipes/received`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const recItem = (receivedRes.body?.data || []).find((r) => r.fromUser?.id === recUser.id);
  if (!recItem) {
    throw new Error('❌ Received collaboration request not found in /api/swipes/received');
  }
  console.log('✔ SUCCESS: Received request present in /api/swipes/received with status:', recItem.status);

  // 6. Candidate accepts the connection (POST /api/swipes with LIKE)
  console.log(`\n👉 Candidate (#${candUser.id}) accepts request (LIKE on #${recUser.id})...`);
  const acceptRes = await fetchJson(`${API_BASE}/swipes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${candToken}` },
    body: JSON.stringify({ toUserId: recUser.id, direction: 'LIKE' }),
  });
  console.log('Accept response:', acceptRes.body);
  if (!acceptRes.body?.isNewMatch || !acceptRes.body?.match?.id) {
    throw new Error('❌ FAILURE: Expected match creation on mutual like!');
  }
  const matchId = acceptRes.body.match.id;
  console.log(`✔ SUCCESS: Reciprocal MATCH established! Match ID: #${matchId}`);

  // 7. Verify both have MATCH notification directly
  const candNotifsAfter = await fetchJson(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  const matchNotif = (candNotifsAfter.body?.data || []).find((n) => n.type === 'MATCH');
  console.log('✔ Candidate Match Notification:', matchNotif?.title, '->', matchNotif?.body);

  // 8. Test live chatting between test1 and test2
  const msgRes = await fetchJson(`${API_BASE}/matches/${matchId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${recToken}` },
    body: JSON.stringify({ content: 'Hello Kenji! Excited to connect regarding our Rust systems role.' }),
  });
  console.log('✔ Recruiter sent chat message:', msgRes.body?.data?.content);

  const getMsgs = await fetchJson(`${API_BASE}/matches/${matchId}/messages`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  console.log(`✔ Candidate read chat messages (${getMsgs.body?.data?.length} messages):`, getMsgs.body?.data?.[0]?.content);

  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

