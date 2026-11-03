const prisma = require('../config/prisma');

function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

class MatchRepository {
  canonicalPair(a, b) {
    return canonicalPair(a, b);
  }

  async findMatch(userAId, userBId, tx = prisma) {
    const [first, second] = canonicalPair(Number(userAId), Number(userBId));
    return tx.match.findUnique({
      where: {
        userAId_userBId: {
          userAId: first,
          userBId: second,
        },
      },
    });
  }

  async createMatch(tx, userAId, userBId, jobRoleId = null) {
    const [first, second] = canonicalPair(Number(userAId), Number(userBId));
    return tx.match.upsert({
      where: {
        userAId_userBId: {
          userAId: first,
          userBId: second,
        },
      },
      create: {
        userAId: first,
        userBId: second,
        jobRoleId: jobRoleId ? Number(jobRoleId) : null,
      },
      update: {
        jobRoleId: jobRoleId ? Number(jobRoleId) : undefined,
      },
    });
  }

  async findById(matchId) {
    return prisma.match.findUnique({
      where: { id: Number(matchId) },
      include: {
        userA: {
          include: { skills: { include: { skill: true } } },
        },
        userB: {
          include: { skills: { include: { skill: true } } },
        },
        jobRole: true,
      },
    });
  }

  async listMatches(userId) {
    const id = Number(userId);
    return prisma.match.findMany({
      where: {
        OR: [{ userAId: id }, { userBId: id }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        userA: {
          include: { skills: { include: { skill: true } } },
        },
        userB: {
          include: { skills: { include: { skill: true } } },
        },
        jobRole: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}

module.exports = new MatchRepository();

