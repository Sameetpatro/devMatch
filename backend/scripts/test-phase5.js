const http = require('http');
const request = require('supertest');
const { io: ioClient } = require('socket.io-client');
const app = require('../src/app');
const { initSocketServer } = require('../src/sockets/chat.socket');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase5Tests() {
  console.log('--- Testing Phase 5: WebSockets Real-Time Chat Engine ---');

  // 1. Start test HTTP server with Socket.io mounted
  const testServer = http.createServer(app);
  initSocketServer(testServer);

  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const wsUrl = `http://localhost:${port}`;
  console.log(`✔ Test HTTP & WebSocket server started on port ${port}`);

  const timestamp = Date.now();

  // 2. Setup Recruiter and Developer
  const recruiterRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `rec_p5_${timestamp}@chat.test`,
      password: 'password123',
      name: 'Chat Recruiter',
      role: 'Head of Engineering',
      userType: 'RECRUITER',
      companyName: 'Realtime Labs',
      phone: '+1 555-4411',
    });
  const recruiterToken = recruiterRes.body.token;

  const devRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `dev_p5_${timestamp}@chat.test`,
      password: 'password123',
      name: 'Chat Developer',
      role: 'Fullstack WebSocket Engineer',
      userType: 'DEVELOPER',
      phone: '+1 555-4422',
      skills: ['WebSockets', 'React', 'Node.js'],
    });
  const devToken = devRes.body.token;

  // 3. Recruiter posts role & Developer applies & Recruiter accepts -> creates Match
  const roleRes = await request(app)
    .post('/api/roles')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({
      title: 'Real-Time Chat Systems Lead',
      companyName: 'Realtime Labs',
      description: 'Building low-latency WebSockets and presence architectures.',
      skills: ['WebSockets', 'Node.js'],
    });
  const roleId = roleRes.body.data.id;

  const applyRes = await request(app)
    .post(`/api/roles/${roleId}/apply`)
    .set('Authorization', `Bearer ${devToken}`);
  const appId = applyRes.body.data.applicationId;

  const decisionRes = await request(app)
    .post(`/api/roles/${roleId}/applications/${appId}/decision`)
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({ decision: 'ACCEPTED' });
  const matchId = decisionRes.body.data.match.id;
  console.log(`✔ Match #${matchId} successfully established between recruiter and developer`);

  // 4. Test unauthorized socket connection rejection
  console.log('\n[2. Authentication Guard on WebSockets Handshake]');
  const unauthSocket = ioClient(wsUrl, {
    auth: { token: 'invalid.token.here' },
    reconnection: false,
    transports: ['websocket'],
  });

  const rejected = await new Promise((resolve) => {
    unauthSocket.on('connect_error', (err) => {
      resolve(true);
      unauthSocket.close();
    });
    unauthSocket.on('connect', () => {
      resolve(false);
      unauthSocket.close();
    });
  });

  if (!rejected) throw new Error('Unauthenticated socket should be rejected!');
  console.log('✔ Unauthenticated WebSocket connection properly rejected');

  // 5. Connect authorized Recruiter and Developer sockets
  console.log('\n[3. Authenticated WebSocket Clients Connection]');
  const socketRecruiter = ioClient(wsUrl, {
    auth: { token: recruiterToken },
    transports: ['websocket'],
  });

  const socketDev = ioClient(wsUrl, {
    auth: { token: devToken },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve) => socketRecruiter.on('connect', resolve)),
    new Promise((resolve) => socketDev.on('connect', resolve)),
  ]);
  console.log('✔ Both Recruiter and Developer connected with verified JWT handshakes');

  // 6. Join Match Room
  console.log('\n[4. Joining Match Room]');
  await new Promise((resolve) => {
    socketRecruiter.emit('join_match', { matchId }, resolve);
  });
  await new Promise((resolve) => {
    socketDev.emit('join_match', { matchId }, resolve);
  });
  console.log(`✔ Both clients joined room "match_${matchId}"`);

  // 7. Real-Time Typing Indicator Test
  console.log('\n[5. Real-Time Typing Indicators]');
  const typingPromise = new Promise((resolve) => {
    socketDev.on('user_typing', (payload) => {
      resolve(payload);
    });
  });

  socketRecruiter.emit('typing_start', { matchId });
  const typingEvent = await typingPromise;
  console.log(`✔ Developer received real-time "user_typing" event for match #${typingEvent.matchId}`);

  // 8. Real-Time Messaging Test
  console.log('\n[6. Real-Time Message Exchange]');
  const messagePromise = new Promise((resolve) => {
    socketDev.on('receive_message', (msg) => {
      resolve(msg);
    });
  });

  const testContent = "Hello Alex! Loved your profile. When are you free for a technical deep-dive?";
  socketRecruiter.emit('send_message', { matchId, content: testContent });

  const receivedMsg = await messagePromise;
  if (receivedMsg.content !== testContent) {
    throw new Error(`Message content mismatch: ${receivedMsg.content}`);
  }
  console.log(`✔ Developer received message in real-time: "${receivedMsg.content}"`);
  console.log(`✔ Message persisted with ID: ${receivedMsg.id} at ${receivedMsg.createdAt}`);

  // 9. Developer replies via REST endpoint, Recruiter receives via WebSocket
  console.log('\n[7. REST-to-WebSocket Cross Delivery]');
  const replyPromise = new Promise((resolve) => {
    socketRecruiter.on('receive_message', (msg) => {
      resolve(msg);
    });
  });

  const replyContent = "Hi Sarah! Tomorrow at 2 PM works great for me.";
  await request(app)
    .post(`/api/matches/${matchId}/messages`)
    .set('Authorization', `Bearer ${devToken}`)
    .send({ content: replyContent });

  const receivedReply = await replyPromise;
  if (receivedReply.content !== replyContent) {
    throw new Error(`Reply content mismatch: ${receivedReply.content}`);
  }
  console.log(`✔ Recruiter received reply via WebSocket emitted from REST endpoint: "${receivedReply.content}"`);

  // 10. Verify Full Message History via REST
  console.log('\n[8. Paginated Message History Verification]');
  const historyRes = await request(app)
    .get(`/api/matches/${matchId}/messages`)
    .set('Authorization', `Bearer ${recruiterToken}`);

  if (historyRes.body.data.length !== 2) {
    throw new Error(`Expected 2 messages in history, got: ${historyRes.body.data.length}`);
  }
  console.log(`✔ REST API returned ${historyRes.body.data.length} messages in history`);

  // Cleanup
  socketRecruiter.close();
  socketDev.close();
  await new Promise((resolve) => testServer.close(resolve));

  console.log('\n--- ALL PHASE 5 WEBSOCKET CHAT CAPABILITIES VERIFIED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase5Tests().catch((err) => {
  console.error('Phase 5 test failed:', err);
  process.exit(1);
});

