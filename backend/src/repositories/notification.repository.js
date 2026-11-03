const prisma = require('../config/prisma');

class NotificationRepository {
  async create({ userId, type, title, body, data = null }) {
    const uId = Number(userId);

    // Deduplication safeguard: if an identical notification was created within 30 seconds, reuse it
    try {
      const recent = await prisma.notification.findFirst({
        where: {
          userId: uId,
          type,
          title,
          createdAt: {
            gte: new Date(Date.now() - 30 * 1000),
          },
        },
      });
      if (recent) {
        return recent;
      }
    } catch (err) {
      // If check fails for any reason, proceed to create
    }

    return prisma.notification.create({
      data: {
        userId: uId,
        type,
        title,
        body,
        data: data ? (typeof data === 'string' ? JSON.parse(data) : data) : undefined,
      },
    });
  }

  async listByUser(userId, { unreadOnly = false, limit = 30 } = {}) {
    const where = { userId: Number(userId) };
    if (unreadOnly) where.isRead = false;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: {
        id: Number(notificationId),
        userId: Number(userId),
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId: Number(userId), isRead: false },
      data: { isRead: true },
    });
  }
}

module.exports = new NotificationRepository();

