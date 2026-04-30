const prisma = require('../src/config/prisma');

(async () => {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    include: { skills: { include: { skill: true } } },
  });

  console.log('\n=== Users (with contact) ===');
  for (const u of users) {
    const skills = u.skills.map((s) => s.skill.name).join(', ') || '-';
    console.log(`id=${u.id}  ${u.email.padEnd(22)} role=${String(u.role).padEnd(28)}`);
    console.log(`         phone=${u.phone}   linkedin=${u.linkedin || '-'}`);
    console.log(`         github=${u.github || '-'}   telegram=${u.telegram || '-'}`);
    console.log(`         skills=[${skills}]`);
  }

  const skillCount = await prisma.skill.count();
  const userSkillCount = await prisma.userSkill.count();
  console.log(
    `\nTotals: ${users.length} users, ${skillCount} unique skills, ${userSkillCount} user-skill links`
  );

  await prisma.$disconnect();
})();
