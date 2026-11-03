const app = require('../src/app');
const request = require('supertest');

async function runPhase2Tests() {
  console.log('--- Testing Phase 2: Core REST APIs (Recruiters & Developers) ---');

  const timestamp = Date.now();

  // 1. Register Recruiter
  const recruiterEmail = `recruiter_${timestamp}@techcorp.com`;
  const recruiterRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: recruiterEmail,
      password: 'password123',
      name: 'Sarah Connor',
      role: 'Tech Talent Lead',
      userType: 'RECRUITER',
      companyName: 'TechCorp Labs',
      phone: '+1 555-0199',
    });

  if (recruiterRes.status !== 201 && recruiterRes.status !== 200) {
    throw new Error(`Failed to register recruiter: ${JSON.stringify(recruiterRes.body)}`);
  }
  const recruiterToken = recruiterRes.body.token;
  console.log('✔ 1. Recruiter registered successfully with userType: RECRUITER');

  // 2. Publish a role as Recruiter
  const roleRes = await request(app)
    .post('/api/roles')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({
      title: 'Fullstack Platform Engineer',
      companyName: 'TechCorp Labs',
      description: 'Building event-driven distributed systems and React micro-frontends.',
      location: 'San Francisco, CA',
      isRemote: true,
      experienceYearsRequired: 3,
      salaryRange: '$140k - $170k',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
    });

  if (roleRes.status !== 201) {
    throw new Error(`Failed to publish role: ${JSON.stringify(roleRes.body)}`);
  }
  const roleId = roleRes.body.data.id;
  console.log(`✔ 2. Role published successfully! Role ID: ${roleId}, Title: "${roleRes.body.data.title}"`);

  // 3. Register a Developer
  const developerEmail = `dev_${timestamp}@example.com`;
  const devRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: developerEmail,
      password: 'password123',
      name: 'Alex Rivera',
      role: 'Senior Fullstack Developer',
      userType: 'DEVELOPER',
      experienceYears: 4,
      phone: '+1 555-0144',
      skills: ['React', 'Node.js', 'PostgreSQL'],
    });

  if (devRes.status !== 201 && devRes.status !== 200) {
    throw new Error(`Failed to register developer: ${JSON.stringify(devRes.body)}`);
  }
  const devToken = devRes.body.token;
  const devId = devRes.body.user.id;
  console.log('✔ 3. Developer registered successfully with userType: DEVELOPER');

  // 4. Developer personalized feed discovery
  const feedRes = await request(app)
    .get('/api/roles/feed')
    .set('Authorization', `Bearer ${devToken}`);

  if (feedRes.status !== 200) {
    throw new Error(`Failed to get role feed: ${JSON.stringify(feedRes.body)}`);
  }
  const feedMatch = feedRes.body.data.find((item) => item.role.id === roleId);
  if (!feedMatch) {
    throw new Error('Published role not found in personalized feed');
  }
  console.log(`✔ 4. Personalized feed computed match score: ${feedMatch.scoring.score}/100 (matchingSkills: ${feedMatch.scoring.matchingSkills}/${feedMatch.scoring.requiredSkillsCount})`);

  // 5. Developer applies to role
  const applyRes = await request(app)
    .post(`/api/roles/${roleId}/apply`)
    .set('Authorization', `Bearer ${devToken}`)
    .send({ coverLetter: 'Super excited to build high-scale distributed backends with you!' });

  if (applyRes.status !== 201) {
    throw new Error(`Failed to apply to role: ${JSON.stringify(applyRes.body)}`);
  }
  const applicationId = applyRes.body.data.applicationId;
  console.log(`✔ 5. Developer applied to role successfully (Application ID: ${applicationId})`);

  // 6. Recruiter reviews candidates/applicants
  const candidatesRes = await request(app)
    .get(`/api/roles/${roleId}/candidates`)
    .set('Authorization', `Bearer ${recruiterToken}`);

  if (candidatesRes.status !== 200) {
    throw new Error(`Failed to get candidates: ${JSON.stringify(candidatesRes.body)}`);
  }
  console.log(`✔ 6. Recruiter fetched applicants (${candidatesRes.body.data.applicantCount} applicant found)`);

  // 7. Recruiter accepts application -> Creates Match atomically
  const decisionRes = await request(app)
    .post(`/api/roles/${roleId}/applications/${applicationId}/decision`)
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({ decision: 'ACCEPTED' });

  if (decisionRes.status !== 200 || !decisionRes.body.data.isMatch) {
    throw new Error(`Failed to accept applicant or create match: ${JSON.stringify(decisionRes.body)}`);
  }
  const matchId = decisionRes.body.data.match.id;
  console.log(`✔ 7. Recruiter accepted applicant. Atomic Match created! (Match ID: ${matchId})`);

  // 8. Both parties see Match in their matches list
  const matchesRes = await request(app)
    .get('/api/matches')
    .set('Authorization', `Bearer ${devToken}`);

  if (matchesRes.status !== 200 || matchesRes.body.data.length === 0) {
    throw new Error('Match not listed for developer');
  }
  console.log(`✔ 8. Verified match in developer matches list. Connected with recruiter: ${matchesRes.body.data[0].user.name}`);

  console.log('\n--- ALL PHASE 2 REST APIs VERIFIED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test failed:', err);
  process.exit(1);
});
