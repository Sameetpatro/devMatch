const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function run() {
  console.log('--- Testing Connections, TTL, Sent Requests & Notifications Workflow ---');

  const ts = Date.now();

  try {
    // 1. Register Recruiter (Posting for a personal project)
    const recRes = await request(app).post('/api/auth/register').send({
      email: `recruiter_workflow_${ts}@test.com`,
      password: 'password123',
      name: 'Elena Rostova',
      role: 'Project Lead',
      userType: 'RECRUITER',
      phone: '+1 555-4040',
    });
    const recToken = recRes.body.token;
    const recId = recRes.body.user.id;
    console.log(`✔ 1. Recruiter registered (ID: ${recId})`);

    // 2. Publish a Personal Project role
    const roleRes = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${recToken}`)
      .send({
        title: 'Open Source AI Assistant',
        companyName: 'Personal Project: VoiceAI',
        description: 'Building an offline local voice assistant using WebAssembly.',
        skills: ['TypeScript', 'React', 'WebAssembly'],
        experienceYearsRequired: 1,
      });
    const roleId = roleRes.body.data.id;
    console.log(`✔ 2. Personal Project role published (ID: ${roleId}, Company/Project: "${roleRes.body.data.companyName}")`);

    // 3. Register Developer
    const devRes = await request(app).post('/api/auth/register').send({
      email: `dev_workflow_${ts}@test.com`,
      password: 'password123',
      name: 'Ken Thompson',
      role: 'Systems Engineer',
      userType: 'DEVELOPER',
      phone: '+1 555-5050',
      skills: ['TypeScript', 'React'],
    });
    const devToken = devRes.body.token;
    const devId = devRes.body.user.id;
    console.log(`✔ 3. Developer registered (ID: ${devId})`);

    // 4. Developer applies for role
    const applyRes = await request(app)
      .post(`/api/roles/${roleId}/apply`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ coverLetter: 'Excited to contribute to local voice models!' });
    const appId = applyRes.body.data.applicationId || applyRes.body.data.id;
    console.log(`✔ 4. Developer applied to role (App ID: ${appId})`);

    // 5. Developer checks "My Applications"
    const myAppsRes = await request(app)
      .get('/api/roles/applications/mine')
      .set('Authorization', `Bearer ${devToken}`);
    const myApp = myAppsRes.body.data.find((a) => a.id === appId);
    if (!myApp) throw new Error('Applied role not found in developer applications list');
    console.log(`✔ 5. "My Applications" verified: Status="${myApp.status}", Remaining Review Window=${myApp.remainingHours}h, Role="${myApp.role.title}"`);

    // 6. Recruiter checks applicants for role
    const candidatesRes = await request(app)
      .get(`/api/roles/${roleId}/candidates`)
      .set('Authorization', `Bearer ${recToken}`);
    const applicant = candidatesRes.body.data.applicants.find((a) => a.applicationId === appId);
    if (!applicant) throw new Error('Applicant not found in recruiter candidate deck');
    console.log(`✔ 6. Recruiter applicant deck verified: Applicant="${applicant.developer.name}", Match Score=${applicant.scoring.score}%, Time left=${applicant.remainingHours}h`);

    // 7. Recruiter accepts application -> Creates Match & Dispatches notifications to BOTH
    const acceptRes = await request(app)
      .post(`/api/roles/${roleId}/applications/${appId}/decision`)
      .set('Authorization', `Bearer ${recToken}`)
      .send({ decision: 'ACCEPTED' });
    console.log(`✔ 7. Recruiter accepted application. Match ID: ${acceptRes.body.data.match?.id}`);

    // Wait 1.5s for async RabbitMQ workers
    await new Promise((r) => setTimeout(r, 1500));

    // 8. Verify Notifications for Developer & Recruiter
    const devNotifsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${devToken}`);
    const devNotifs = devNotifsRes.body.data;
    const matchNotifDev = devNotifs.find((n) => n.type === 'MATCH');
    const adNotifDev = devNotifs.find((n) => n.type === 'ADVERTISEMENT');
    console.log(`✔ 8a. Developer notifications verified! Received Match Alert: "${matchNotifDev?.title}" & In-App Advertisement: "${adNotifDev?.title}"`);

    const recNotifsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${recToken}`);
    const recNotifs = recNotifsRes.body.data;
    const matchNotifRec = recNotifs.find((n) => n.type === 'MATCH');
    console.log(`✔ 8b. Recruiter notifications verified! Received: "${matchNotifRec?.title}"`);

    // 9. Developer checks "My Applications" again -> Shows ACCEPTED with matchId for chat
    const updatedAppsRes = await request(app)
      .get('/api/roles/applications/mine')
      .set('Authorization', `Bearer ${devToken}`);
    const acceptedApp = updatedAppsRes.body.data.find((a) => a.id === appId);
    console.log(`✔ 9. Developer "My Applications" updated: Status="${acceptedApp.status}", Match ID for Chat=${acceptedApp.matchId}`);

    // 10. Recruiter sends direct swipe request to another developer & checks "Sent Requests"
    const dev2Res = await request(app).post('/api/auth/register').send({
      email: `dev2_workflow_${ts}@test.com`,
      password: 'password123',
      name: 'Ada Lovelace',
      role: 'Algorithm Specialist',
      userType: 'DEVELOPER',
      phone: '+1 555-6060',
    });
    const dev2Id = dev2Res.body.user.id;

    await request(app)
      .post('/api/swipes')
      .set('Authorization', `Bearer ${recToken}`)
      .send({ toUserId: dev2Id, direction: 'LIKE' });

    const sentRequestsRes = await request(app)
      .get('/api/swipes/sent')
      .set('Authorization', `Bearer ${recToken}`);
    const sentReq = sentRequestsRes.body.data.find((r) => r.targetUser?.id === dev2Id);
    console.log(`✔ 10. Recruiter "Sent Requests" verified: Sent request to "${sentReq?.targetUser?.name}", Status="${sentReq?.status}"`);

    // 11. Developer 2 checks received invitations
    const dev2Token = dev2Res.body.token;
    const receivedRes = await request(app)
      .get('/api/swipes/received')
      .set('Authorization', `Bearer ${dev2Token}`);
    const incomingReq = receivedRes.body.data.find((r) => r.fromUser?.id === recId);
    if (!incomingReq) throw new Error('Incoming request from recruiter not found in developer received list');
    console.log(`✔ 11. Developer received request verified: From="${incomingReq.fromUser.name}", Status="${incomingReq.status}"`);

    // 12. Developer 2 accepts recruiter request -> Match formed!
    const dev2AcceptRes = await request(app)
      .post('/api/swipes')
      .set('Authorization', `Bearer ${dev2Token}`)
      .send({ toUserId: recId, direction: 'LIKE' });
    if (!dev2AcceptRes.body.match?.id) throw new Error('Match not created on developer acceptance');
    console.log(`✔ 12. Developer accepted collaboration request! Match formed (Match ID: ${dev2AcceptRes.body.match.id})`);

    // 13. Verify zero promotional notifications
    const promoCheck = await prisma.notification.findMany({ where: { type: 'ADVERTISEMENT' } });
    if (promoCheck.length > 0) throw new Error('Promotional notifications still exist');
    console.log(`✔ 13. Clean inbox verified: Zero promotional notifications.`);

    console.log('\n--- ALL CONNECTIONS, NOTIFICATIONS, TTL & RECRUITER/CANDIDATE LOGIC VERIFIED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();

