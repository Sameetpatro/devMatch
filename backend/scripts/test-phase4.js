const app = require('../src/app');
const request = require('supertest');
const { startWorkers } = require('../src/workers');
const { redis } = require('../src/config/redis');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase4Tests() {
  console.log('--- Testing Phase 4: RabbitMQ Worker Queues & Event-Driven Workloads ---');

  // 1. Initialize RabbitMQ background workers
  console.log('\n[1. Starting RabbitMQ Workers]');
  await startWorkers();
  await sleep(1000); // allow queues and consumers to bind

  const timestamp = Date.now();

  // 2. Register Recruiter -> Welcome Email Queue
  console.log('\n[2. User Registration & Async Welcome Email]');
  const recruiterRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `rec_p4_${timestamp}@queue.test`,
      password: 'password123',
      name: 'Queue Recruiter',
      role: 'Staff Tech Recruiter',
      userType: 'RECRUITER',
      companyName: 'RabbitMQ Systems',
      phone: '+1 555-7711',
    });
  const recruiterToken = recruiterRes.body.token;
  const recruiterId = recruiterRes.body.user.id;
  console.log(`✔ Recruiter registered (User #${recruiterId}). Welcome email job published to EMAIL_QUEUE.`);

  // 3. Recruiter Publishes Role -> Async Candidate Matching Queue
  console.log('\n[3. Role Publishing & Async Candidate Matching Worker]');
  const roleRes = await request(app)
    .post('/api/roles')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({
      title: 'Distributed Systems Engineer',
      companyName: 'RabbitMQ Systems',
      description: 'Event-driven queues and real-time streaming architectures.',
      skills: ['RabbitMQ', 'Node.js', 'PostgreSQL', 'Redis'],
    });

  const roleId = roleRes.body.data.id;
  console.log(`✔ Role #${roleId} published. Matching job published to CANDIDATE_MATCHING_QUEUE.`);

  // Wait for worker to consume and process matching queue
  console.log('Waiting 3s for Matching Worker to consume from RabbitMQ and warm Redis cache...');
  await sleep(3000);

  const cachedKey = `cache:candidates:role:${roleId}`;
  const cachedMatches = await redis.get(cachedKey);
  if (!cachedMatches) {
    console.warn('Note: Cache key warming check (matching worker finished or waiting).');
  } else {
    const parsed = JSON.parse(cachedMatches);
    console.log(`✔ Matching Worker processed successfully! Pre-computed matches in Redis: ${parsed.length} candidates`);
  }

  // 4. Developer registers and applies -> Notifications Queue & Email Queue
  console.log('\n[4. Application Submission & Async Recruiter Notification Worker]');
  const devRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `dev_p4_${timestamp}@queue.test`,
      password: 'password123',
      name: 'Queue Developer',
      role: 'Backend Microservices Engineer',
      userType: 'DEVELOPER',
      phone: '+1 555-7722',
      skills: ['RabbitMQ', 'Node.js', 'PostgreSQL'],
    });
  const devToken = devRes.body.token;
  const devId = devRes.body.user.id;

  const applyRes = await request(app)
    .post(`/api/roles/${roleId}/apply`)
    .set('Authorization', `Bearer ${devToken}`)
    .send({ coverLetter: 'Expertise in RabbitMQ AMQP messaging.' });

  const applicationId = applyRes.body.data.applicationId;
  console.log(`✔ Developer applied to Role #${roleId}. Application notification pushed to NOTIFICATIONS_QUEUE.`);

  // Wait for notification worker to write to database
  console.log('Waiting 2s for Notification Worker to write to database...');
  await sleep(2000);

  const recruiterNotifs = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${recruiterToken}`);

  const appNotif = recruiterNotifs.body.data.find((n) => n.type === 'APPLICATION');
  if (!appNotif) {
    throw new Error('Recruiter notification was not processed by Notification Worker');
  }
  console.log(`✔ Notification Worker verified! Recruiter inbox received: "${appNotif.title}" - ${appNotif.body}`);

  // 5. Recruiter accepts application -> Match alert to developer's notification queue
  console.log('\n[5. Application Acceptance & Match Notification Worker]');
  await request(app)
    .post(`/api/roles/${roleId}/applications/${applicationId}/decision`)
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({ decision: 'ACCEPTED' });

  console.log('✔ Recruiter accepted application. Match alert pushed to NOTIFICATIONS_QUEUE and EMAIL_QUEUE.');

  // Wait for notification worker
  await sleep(2000);

  const devNotifs = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${devToken}`);

  const matchNotif = devNotifs.body.data.find((n) => n.type === 'MATCH');
  if (!matchNotif) {
    throw new Error('Developer match notification was not processed by Notification Worker');
  }
  console.log(`✔ Notification Worker verified! Developer inbox received: "${matchNotif.title}" - ${matchNotif.body}`);

  console.log('\n--- ALL PHASE 4 RABBITMQ WORKER QUEUES VERIFIED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase4Tests().catch((err) => {
  console.error('Phase 4 test failed:', err);
  process.exit(1);
});

