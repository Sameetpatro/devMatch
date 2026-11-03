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

  async getSentSwipes(fromUserId) {
    return prisma.swipe.findMany({
      where: {
        fromUserId: Number(fromUserId),
        direction: 'LIKE',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            role: true,
            bio: true,
            companyName: true,
            userType: true,
            experienceYears: true,
            rating: true,
            skills: { include: { skill: true } },
          },
        },
      },
    });
  }

  async getReceivedSwipes(toUserId) {
    return prisma.swipe.findMany({
      where: {
        toUserId: Number(toUserId),
        direction: 'LIKE',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            role: true,
            bio: true,
            companyName: true,
            userType: true,
            experienceYears: true,
            rating: true,
            skills: { include: { skill: true } },
          },
        },
      },
    });
  }
}

module.exports = new SwipeRepository();

