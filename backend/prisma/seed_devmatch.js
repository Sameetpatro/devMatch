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

const SKILL_POOL = [
  'Rust', 'Tokio', 'WebAssembly', 'Go', 'Python', 'Node.js', 'React', 'TypeScript',
  'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'GraphQL', 'Kafka', 'RabbitMQ',
  'AWS', 'gRPC', 'Next.js', 'Tailwind', 'Linux', 'Distributed Systems', 'C++', 'Java'
];

const COMPANIES = [
  'Rust Systems Corp', 'AsyncScale Labs', 'ByteWave Networks', 'CloudKernel Inc',
  'Nexus Distributed', 'Veloce Data', 'Hyperion Tech', 'Aether Dynamics',
  'Vertex Systems', 'QuantFlow Technologies', 'IronClad Security', 'ZeroCopy Solutions',
  'Polymorph AI', 'Solana Labs', 'Kite Distributed', 'Personal Project: MiniDB',
  'Personal Project: RustyEngine', 'Personal Project: AudioDSP', 'Personal Project: WasmBrowser',
  'Personal Project: P2PNetwork'
];

const TITLES = [
  'Senior Rust Systems Engineer', 'Rust Performance Specialist', 'Distributed Storage Engineer (Rust)',
  'Backend Infrastructure Architect', 'Async Rust & Tokio Developer', 'Embedded Linux & Rust Developer',
  'Wasm & Core Web Systems Engineer', 'Cloud Platform Engineer (Go/Rust)', 'Low-Latency Systems Lead',
  'Senior Fullstack Engineer (Rust + React)', 'Kernel & Memory Safety Specialist', 'P2P Networking Architect',
  'High-Throughput Data Pipeline Lead', 'Database Engine Developer (Rust)', 'Microservices Engineer',
  'DevOps & Infrastructure Lead', 'Fullstack Platform Engineer', 'WebAssembly Core Developer',
  'Systems Software Engineer', 'Security & Cryptography Engineer'
];

async function seed() {
  console.log('--- Wiping all tables and reseeding DevMatch database ---');

  // 1. Delete all existing records in dependency order
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.swipe.deleteMany({});
  await prisma.roleSkill.deleteMany({});
  await prisma.jobRole.deleteMany({});
  await prisma.userSkill.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skill.deleteMany({});
  console.log('✔ Database wiped clean.');

  // 2. Seed Skills
  const skillMap = {};
  for (const name of SKILL_POOL) {
    const s = await prisma.skill.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    skillMap[name] = s.id;
  }
  console.log(`✔ Created ${Object.keys(skillMap).length} skills.`);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Create test2 (Recruiter with Rust Requirement)
  const test2Recruiter = await prisma.user.create({
    data: {
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

  // Post test2 primary Rust role
  const test2Role = await prisma.jobRole.create({
    data: {
      recruiterId: test2Recruiter.id,
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
  await prisma.roleSkill.createMany({
    data: [
      { roleId: test2Role.id, skillId: skillMap['Rust'] },
      { roleId: test2Role.id, skillId: skillMap['Tokio'] },
      { roleId: test2Role.id, skillId: skillMap['WebAssembly'] },
      { roleId: test2Role.id, skillId: skillMap['Distributed Systems'] },
      { roleId: test2Role.id, skillId: skillMap['PostgreSQL'] },
    ],
  });

  // Post test2 secondary role
  const test2Role2 = await prisma.jobRole.create({
    data: {
      recruiterId: test2Recruiter.id,
      title: 'Personal Project: Rust Audio DSP & Synthesizer',
      companyName: 'Personal Project: RustSynth',
      description: 'Looking for a passionate Rust collaborator to build a real-time software audio synthesizer and VST plugin in Rust.',
      location: 'Remote Friendly',
      isRemote: true,
      experienceYearsRequired: 1,
      salaryRange: 'Equity / Open Source',
      status: 'OPEN',
    },
  });
  await prisma.roleSkill.createMany({
    data: [
      { roleId: test2Role2.id, skillId: skillMap['Rust'] },
      { roleId: test2Role2.id, skillId: skillMap['WebAssembly'] },
      { roleId: test2Role2.id, skillId: skillMap['Linux'] },
    ],
  });

  // 4. Create other 19 Recruiters
  const allRecruiters = [test2Recruiter];
  for (let i = 2; i <= 20; i++) {
    const compName = COMPANIES[i - 1] || `Tech Enterprise ${i}`;
    const rec = await prisma.user.create({
      data: {
        email: `recruiter.${i}@devmatch.test`,
        passwordHash: hashedPassword,
        name: `Recruiter ${i} (${compName.split(':')[0]})`,
        userType: 'RECRUITER',
        companyName: compName,
        role: i % 4 === 0 ? 'Indie Creator & Lead' : 'Technical Recruiter',
        bio: `Hiring top engineering talent for ${compName}.`,
        experienceYears: 4 + (i % 6),
        phone: `+1 555-20${i.toString().padStart(2, '0')}`,
      },
    });
    allRecruiters.push(rec);
  }
  console.log(`✔ Created 20 Recruiters (including test2@recruiter.com).`);

  // 5. Seed remaining 48 Job Roles (Total 50 jobs across 20 recruiters)
  let jobsCount = 2; // test2 already posted 2
  for (let i = 0; i < 48; i++) {
    const rec = allRecruiters[(i % (allRecruiters.length - 1)) + 1];
    const title = `${TITLES[i % TITLES.length]} ${i > 19 ? `(Track ${i})` : ''}`;
    const isPersonal = rec.companyName.includes('Personal Project');

    const role = await prisma.jobRole.create({
      data: {
        recruiterId: rec.id,
        title,
        companyName: rec.companyName,
        description: `Exciting opportunity at ${rec.companyName}. We are tackling high concurrency, memory safety, and cloud scalability.`,
        location: i % 3 === 0 ? 'Remote Friendly' : i % 3 === 1 ? 'New York, NY' : 'Seattle, WA',
        isRemote: i % 2 === 0,
        experienceYearsRequired: 1 + (i % 5),
        salaryRange: isPersonal ? 'Equity / Rev Share' : `$${120 + (i % 8) * 10}k - $${150 + (i % 8) * 10}k`,
        status: 'OPEN',
      },
    });

    // Assign 3-4 skills
    const roleSkills = ['Rust', SKILL_POOL[(i + 1) % SKILL_POOL.length], SKILL_POOL[(i + 3) % SKILL_POOL.length]];
    if (i % 2 === 0) roleSkills.push(SKILL_POOL[(i + 5) % SKILL_POOL.length]);

    await prisma.roleSkill.createMany({
      data: roleSkills.map((s) => ({ roleId: role.id, skillId: skillMap[s] })),
      skipDuplicates: true,
    });
    jobsCount++;
  }
  console.log(`✔ Created 50 Job Roles across 20 recruiters.`);

  // 6. Create test1 (Candidate - Rust Developer)
  const test1Candidate = await prisma.user.create({
    data: {
      email: 'test1@candidate.com',
      passwordHash: hashedPassword,
      name: 'Kenji Sato (Test 1)',
      userType: 'DEVELOPER',
      role: 'Rust & Distributed Systems Developer',
      bio: 'Systems software engineer passionate about Rust, async Tokio, WebAssembly, and low-latency network architectures.',
      experienceYears: 4,
      rating: 4.8,
      phone: '+1 555-0101',
      linkedin: 'https://linkedin.com/in/test1-rustacean',
      github: 'https://github.com/test1-rust',
      telegram: '@test1_rust',
    },
  });
  await prisma.userSkill.createMany({
    data: [
      { userId: test1Candidate.id, skillId: skillMap['Rust'] },
      { userId: test1Candidate.id, skillId: skillMap['Tokio'] },
      { userId: test1Candidate.id, skillId: skillMap['WebAssembly'] },
      { userId: test1Candidate.id, skillId: skillMap['PostgreSQL'] },
      { userId: test1Candidate.id, skillId: skillMap['Docker'] },
      { userId: test1Candidate.id, skillId: skillMap['Linux'] },
    ],
  });

  // 7. Create remaining 39 Candidates (Total 40 candidates)
  const CANDIDATE_NAMES = [
    'Elena Rostova', 'Marcus Vance', 'Sofia Chen', 'Liam O\'Connor', 'Zara Patel',
    'Dmitri Volkov', 'Hannah Schmidt', 'Lucas Silva', 'Aria Montgomery', 'Ethan Hunt',
    'Maya Lin', 'Gabriel Rossi', 'Chloe Dubois', 'Julian Thorne', 'Priya Sharma',
    'Oliver Queen', 'Amara Okafor', 'Felix Baum', 'Freya Lind', 'David Kim',
    'Sarah Jenkins', 'Arthur Pendelton', 'Leila Haddad', 'Devon Brooks', 'Nina Petrova',
    'Mateo Morales', 'Clara Oswald', 'Viktor Steiner', 'Talia Al Ghul', 'Nate Drake',
    'Siddharth Joshi', 'Iris West', 'Leo Fitz', 'Jemma Simmons', 'Gideon Cross',
    'Cassian Andor', 'Rachel Zane', 'Louis Litt', 'Donna Paulsen'
  ];

  for (let i = 0; i < 39; i++) {
    const name = CANDIDATE_NAMES[i] || `Candidate Developer ${i + 2}`;
    const cand = await prisma.user.create({
      data: {
        email: `candidate.${i + 2}@devmatch.test`,
        passwordHash: hashedPassword,
        name,
        userType: 'DEVELOPER',
        role: i % 2 === 0 ? 'Rust Systems Developer' : 'Fullstack & Cloud Engineer',
        bio: `Software developer experienced in building performant services and collaborative projects.`,
        experienceYears: 1 + (i % 8),
        rating: 4.0 + (i % 10) * 0.1,
        phone: `+1 555-30${i.toString().padStart(2, '0')}`,
        github: `https://github.com/candidate${i + 2}`,
      },
    });

    // Assign skills (some Rust, some other stacks)
    const candSkills = [
      i % 2 === 0 ? 'Rust' : 'Go',
      SKILL_POOL[(i + 2) % SKILL_POOL.length],
      SKILL_POOL[(i + 4) % SKILL_POOL.length],
      SKILL_POOL[(i + 6) % SKILL_POOL.length],
    ];

    await prisma.userSkill.createMany({
      data: candSkills.map((s) => ({ userId: cand.id, skillId: skillMap[s] })),
      skipDuplicates: true,
    });
  }
  console.log(`✔ Created 40 Candidates (including test1@candidate.com).`);

  console.log('\n======================================================');
  console.log('🎉 DEVMATCH SEED COMPLETE!');
  console.log('======================================================');
  console.log('TEST ACCOUNTS CREATED:');
  console.log('------------------------------------------------------');
  console.log('1. CANDIDATE (Rust Developer):');
  console.log('   Email    : test1@candidate.com');
  console.log('   Password : password123');
  console.log('   Profile  : Kenji Sato (Test 1) — 4 yrs exp, Rust/Tokio/Wasm');
  console.log('------------------------------------------------------');
  console.log('2. RECRUITER (Rust Requirement):');
  console.log('   Email    : test2@recruiter.com');
  console.log('   Password : password123');
  console.log('   Profile  : Alex Rivera (Test 2) — Rust Systems Corp');
  console.log('   Role Post: Senior Rust Systems Engineer ($165k-$195k)');
  console.log('======================================================');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

