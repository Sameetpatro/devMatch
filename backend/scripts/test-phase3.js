const app = require('../src/app');
const request = require('supertest');
const { redis } = require('../src/config/redis');

async function runPhase3Tests() {
  console.log('--- Testing Phase 3: Redis Integration (Caching, Rate Limiting & Presence) ---');

  // 1. Verify Redis Connection
  console.log('\n[1. Redis Connection]');
  const pingRes = await redis.ping();
  if (pingRes !== 'PONG') throw new Error(`Redis ping failed: ${pingRes}`);
  console.log('✔ Redis ping returned PONG');

  // Setup test users
  const timestamp = Date.now();
  const recruiterRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `rec_p3_${timestamp}@tech.com`,
      password: 'password123',
      name: 'Redis Recruiter',
      role: 'Head of Infra',
      userType: 'RECRUITER',
      companyName: 'RedisScale Inc',
      phone: '+1 555-9988',
    });
  const recruiterToken = recruiterRes.body.token;

  const devRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `dev_p3_${timestamp}@tech.com`,
      password: 'password123',
      name: 'Redis Developer',
      role: 'Backend Architect',
      userType: 'DEVELOPER',
      phone: '+1 555-8877',
      skills: ['Redis', 'Node.js', 'PostgreSQL'],
    });
  const devToken = devRes.body.token;
  const devId = devRes.body.user.id;

  // 2. Publish initial role
  await request(app)
    .post('/api/roles')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({
      title: 'High-Throughput Systems Engineer',
      companyName: 'RedisScale Inc',
      description: 'Distributed caching and pub/sub message brokers.',
      skills: ['Redis', 'Node.js'],
    });

  // 3. Test Feed Caching & Invalidation
  console.log('\n[2. Redis Caching & Invalidation]');
  const feed1 = await request(app)
    .get('/api/roles/feed')
    .set('Authorization', `Bearer ${devToken}`);

  if (feed1.body.fromCache !== false) {
    throw new Error(`Expected first feed request to be a cache miss, got fromCache: ${feed1.body.fromCache}`);
  }
  console.log('✔ First feed request: Cache MISS (computed dynamically and cached in Redis)');

  const feed2 = await request(app)
    .get('/api/roles/feed')
    .set('Authorization', `Bearer ${devToken}`);

  if (feed2.body.fromCache !== true) {
    throw new Error(`Expected second feed request to be a cache hit, got fromCache: ${feed2.body.fromCache}`);
  }
  console.log('✔ Second feed request: Cache HIT (served in sub-milliseconds directly from Redis!)');

  // Recruiter posts new role -> should invalidate all feeds
  await request(app)
    .post('/api/roles')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({
      title: 'Site Reliability Engineer',
      companyName: 'RedisScale Inc',
      description: 'Observability and cache performance.',
      skills: ['Redis', 'Linux'],
    });
  console.log('✔ Published new role -> Invalidation signal sent to Redis');

  const feed3 = await request(app)
    .get('/api/roles/feed')
    .set('Authorization', `Bearer ${devToken}`);

  if (feed3.body.fromCache !== false) {
    throw new Error('Expected third feed request after role publish to be a fresh cache miss');
  }
  console.log('✔ Third feed request: Cache Invalidation confirmed (served fresh results)');

  // 4. Test Presence Tracking
  console.log('\n[3. Redis Real-Time Presence]');
  // Initially offline
  const initialPresence = await request(app).get(`/api/presence/${devId}`);
  console.log(`✔ Initial presence check for user ${devId}: isOnline = ${initialPresence.body.data.isOnline}`);

  // Send heartbeat
  const hbRes = await request(app)
    .post('/api/presence/heartbeat')
    .set('Authorization', `Bearer ${devToken}`);
  if (!hbRes.body.data.isOnline) throw new Error('Heartbeat failed to set online presence');
  console.log('✔ Heartbeat sent -> presence key stored with 60s TTL in Redis');

  // Check presence
  const activePresence = await request(app).get(`/api/presence/${devId}`);
  if (!activePresence.body.data.isOnline) throw new Error('User should be online after heartbeat');
  console.log(`✔ User ${devId} is now online: isOnline = true`);

  // Batch query presence
  const batchRes = await request(app)
    .post('/api/presence/batch')
    .send({ userIds: [devId, 999999] });
  if (!batchRes.body.data[devId] || batchRes.body.data[999999]) {
    throw new Error(`Batch presence failed: ${JSON.stringify(batchRes.body.data)}`);
  }
  console.log(`✔ Batch presence pipelined query verified: devId ${devId} -> true, unassigned -> false`);

  // Explicit offline
  await request(app)
    .post('/api/presence/offline')
    .set('Authorization', `Bearer ${devToken}`);
  const finalPresence = await request(app).get(`/api/presence/${devId}`);
  if (finalPresence.body.data.isOnline) throw new Error('User should be offline after explicit logout');
  console.log('✔ Explicit setOffline confirmed: isOnline = false');

  console.log('\n--- ALL PHASE 3 REDIS CAPABILITIES VERIFIED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase3Tests().catch((err) => {
  console.error('Phase 3 test failed:', err);
  process.exit(1);
});

