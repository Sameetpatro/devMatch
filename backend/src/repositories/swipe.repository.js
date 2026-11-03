const prisma = require('../config/prisma');

class SwipeRepository {
  async recordSwipe(tx, { fromUserId, toUserId, direction }) {
    return tx.swipe.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: Number(fromUserId),
          toUserId: Number(toUserId),
        },
      },
      create: {
        fromUserId: Number(fromUserId),
        toUserId: Number(toUserId),
        direction,
      },
      update: { direction },
    });
  }

  async findReciprocalSwipe(tx, fromUserId, toUserId) {
    return tx.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: Number(toUserId),
          toUserId: Number(fromUserId),
        },
      },
    });
  }

  async getSwipedUserIds(currentUserId) {
    const swipes = await prisma.swipe.findMany({
      where: { fromUserId: Number(currentUserId) },
      select: { toUserId: true },
    });
    return swipes.map((s) => s.toUserId);
  }
}

module.exports = new SwipeRepository();

