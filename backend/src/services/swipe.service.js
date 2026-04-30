const prisma = require('../config/prisma');
const HttpError = require('../utils/httpError');

// Canonical pair ordering: each Match row has userAId < userBId, so a pair (X,Y)
// is stored once regardless of who LIKEd first.
function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * Record a swipe. If LIKE and the target has already LIKEd back, also create
 * the Match row (atomically, in a single transaction).
 *
 * Returns: { swipe, match | null, isNewMatch: boolean }
 */
async function recordSwipe(fromUserId, { toUserId, direction }) {
  if (fromUserId === toUserId) {
    throw new HttpError(400, 'You cannot swipe on yourself');
  }

  const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
  if (!target) throw new HttpError(404, 'Target user not found');

  return prisma.$transaction(async (tx) => {
    const swipe = await tx.swipe.upsert({
      where: { fromUserId_toUserId: { fromUserId, toUserId } },
      create: { fromUserId, toUserId, direction },
      update: { direction },
    });

    let match = null;
    let isNewMatch = false;

    if (direction === 'LIKE') {
      const reciprocal = await tx.swipe.findUnique({
        where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
      });

      if (reciprocal && reciprocal.direction === 'LIKE') {
        const [userAId, userBId] = canonicalPair(fromUserId, toUserId);

        const existing = await tx.match.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
        });

        match = await tx.match.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId },
          update: {},
        });
        isNewMatch = !existing;
      }
    }

    return { swipe, match, isNewMatch };
  });
}

module.exports = { recordSwipe };
