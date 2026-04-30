const prisma = require('../config/prisma');
const { toPublicUser } = require('./auth.service');

/**
 * Return all matches involving `userId`. For each Match row we project the
 * "other" user (full profile + skills) so the client gets everything in one go.
 */
async function listMatches(userId) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      userA: { include: { skills: { include: { skill: true } } } },
      userB: { include: { skills: { include: { skill: true } } } },
    },
  });

  return matches.map((m) => {
    const other = m.userAId === userId ? m.userB : m.userA;
    const publicOther = toPublicUser(other);
    return {
      matchId: m.id,
      matchedAt: m.createdAt,
      user: {
        ...publicOther,
        skills: publicOther.skills.map((us) => us.skill.name),
      },
    };
  });
}

module.exports = { listMatches };
