require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('-pooler.')) {
  dbUrl = dbUrl.replace('-pooler.', '.');
}
const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

async function resetTestIds() {
  console.log('🔄 Resetting test1 (candidate) and test2 (recruiter) data...');

  const test1 = await prisma.user.findUnique({ where: { email: 'test1@candidate.com' } });
  const test2 = await prisma.user.findUnique({ where: { email: 'test2@recruiter.com' } });

  const idsToClean = [];
  if (test1) idsToClean.push(test1.id);
  if (test2) idsToClean.push(test2.id);

  if (idsToClean.length > 0) {
    // 1. Delete messages involving test1 or test2
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: idsToClean } },
          { match: { OR: [{ userAId: { in: idsToClean } }, { userBId: { in: idsToClean } }] } },
        ],
      },
    });

    // 2. Delete matches involving test1 or test2
    await prisma.match.deleteMany({
      where: {
        OR: [
          { userAId: { in: idsToClean } },
          { userBId: { in: idsToClean } },
        ],
      },
    });

    // 3. Delete swipes involving test1 or test2
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: idsToClean } },
          { toUserId: { in: idsToClean } },
        ],
      },
    });

    // 4. Delete applications involving test1 or test2
    await prisma.application.deleteMany({
      where: {
        OR: [
          { developerId: { in: idsToClean } },
          ...(test2 ? [{ jobRole: { recruiterId: test2.id } }] : []),
        ],
      },
    });

    // 5. Delete notifications for test1 and test2
    await prisma.notification.deleteMany({
      where: {
        userId: { in: idsToClean },
      },
    });

    console.log(`✔ Cleared all prior swipes, matches, applications, messages, and notifications for test1 (#${test1?.id}) and test2 (#${test2?.id})`);
  }

  // Ensure password is password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Upsert Skills
  const rustSkill = await prisma.skill.upsert({ where: { name: 'Rust' }, create: { name: 'Rust' }, update: {} });
  const tokioSkill = await prisma.skill.upsert({ where: { name: 'Tokio' }, create: { name: 'Tokio' }, update: {} });
  const wasmSkill = await prisma.skill.upsert({ where: { name: 'WebAssembly' }, create: { name: 'WebAssembly' }, update: {} });
  const distSkill = await prisma.skill.upsert({ where: { name: 'Distributed Systems' }, create: { name: 'Distributed Systems' }, update: {} });
  const pgSkill = await prisma.skill.upsert({ where: { name: 'PostgreSQL' }, create: { name: 'PostgreSQL' }, update: {} });

  // Reset or create test2 (Recruiter)
  const recruiter = await prisma.user.upsert({
    where: { email: 'test2@recruiter.com' },
    update: {
      passwordHash: hashedPassword,
      name: 'Alex Rivera (Test 2)',
      userType: 'RECRUITER',
      companyName: 'Rust Systems Corp',
      role: 'Director of Systems Talent',
      bio: 'Leading hiring for low-level systems, kernel development, and distributed Rust infrastructure.',
      experienceYears: 8,
      phone: '+1 555-0102',
      linkedin: 'https://linkedin.com/in/test2-recruiter',
      github: 'https://github.com/rustsystems',
    },
    create: {
      email: 'test2@recruiter.com',
      passwordHash: hashedPassword,
      name: 'Alex Rivera (Test 2)',
      userType: 'RECRUITER',
      companyName: 'Rust Systems Corp',
      role: 'Director of Systems Talent',
      bio: 'Leading hiring for low-level systems, kernel development, and distributed Rust infrastructure.',
      experienceYears: 8,
      phone: '+1 555-0102',
      linkedin: 'https://linkedin.com/in/test2-recruiter',
      github: 'https://github.com/rustsystems',
    },
  });

  // Ensure test2 has open roles
  let role = await prisma.jobRole.findFirst({
    where: { recruiterId: recruiter.id, title: 'Senior Rust Systems Engineer' },
  });
  if (!role) {
    role = await prisma.jobRole.create({
      data: {
        recruiterId: recruiter.id,
        title: 'Senior Rust Systems Engineer',
        companyName: 'Rust Systems Corp',
        description: 'Building high-throughput, memory-safe distributed database engines and network actors in Rust using Tokio and WebAssembly.',
        location: 'San Francisco, CA (or Remote)',
        isRemote: true,
        experienceYearsRequired: 3,
        salaryRange: '$165k - $195k',
        status: 'OPEN',
      },
    });
  }

  // Ensure role skills
  await prisma.roleSkill.deleteMany({ where: { roleId: role.id } });
  await prisma.roleSkill.createMany({
    data: [
      { roleId: role.id, skillId: rustSkill.id },
      { roleId: role.id, skillId: tokioSkill.id },
      { roleId: role.id, skillId: wasmSkill.id },
      { roleId: role.id, skillId: distSkill.id },
      { roleId: role.id, skillId: pgSkill.id },
    ],
  });

  // Reset or create test1 (Candidate)
  const candidate = await prisma.user.upsert({
    where: { email: 'test1@candidate.com' },
    update: {
      passwordHash: hashedPassword,
      name: 'Kenji Sato (Test 1)',
      userType: 'DEVELOPER',
      role: 'Rust & Distributed Systems Developer',
      bio: 'Systems software engineer passionate about Rust, async Tokio, WebAssembly, and low-latency network architectures.',
      experienceYears: 4,
      rating: 4.8,
      isAvailable: true,
      phone: '+1 555-0101',
      linkedin: 'https://linkedin.com/in/test1-rustacean',
      github: 'https://github.com/test1-rust',
      telegram: '@test1_rust',
    },
    create: {
      email: 'test1@candidate.com',
      passwordHash: hashedPassword,
      name: 'Kenji Sato (Test 1)',
      userType: 'DEVELOPER',
      role: 'Rust & Distributed Systems Developer',
      bio: 'Systems software engineer passionate about Rust, async Tokio, WebAssembly, and low-latency network architectures.',
      experienceYears: 4,
      rating: 4.8,
      isAvailable: true,
      phone: '+1 555-0101',
      linkedin: 'https://linkedin.com/in/test1-rustacean',
      github: 'https://github.com/test1-rust',
      telegram: '@test1_rust',
    },
  });

  // Ensure candidate skills
  await prisma.userSkill.deleteMany({ where: { userId: candidate.id } });
  await prisma.userSkill.createMany({
    data: [
      { userId: candidate.id, skillId: rustSkill.id },
      { userId: candidate.id, skillId: tokioSkill.id },
      { userId: candidate.id, skillId: wasmSkill.id },
      { userId: candidate.id, skillId: pgSkill.id },
    ],
  });

  console.log('✅ Test accounts reset completely:');
  console.log(`   Candidate: test1@candidate.com (#${candidate.id}) | password: password123`);
  console.log(`   Recruiter: test2@recruiter.com (#${recruiter.id}) | password: password123`);
}

resetTestIds()
  .catch((err) => {
    console.error('Reset error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

