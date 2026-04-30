const prisma = require('../src/config/prisma');

(async () => {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    include: { skills: { include: { skill: true } } },
  });

  console.log('\n=== Users in DB ===');
  for (const u of users) {
    const skills = u.skills.map((s) => s.skill.name).join(', ') || '-';
    console.log(`id=${u.id}  ${u.email.padEnd(22)} role=${String(u.role).padEnd(28)} skills=[${skills}]`);
  }

  const skillCount = await prisma.skill.count();
  const userSkillCount = await prisma.userSkill.count();
  console.log(`\nTotals: ${users.length} users, ${skillCount} unique skills, ${userSkillCount} user-skill links`);

  await prisma.$disconnect();
})();
