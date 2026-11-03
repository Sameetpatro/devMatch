const prisma = require('../config/prisma');

class NotificationRepository {
  async create({ userId, type, title, body, data = null }) {
    return prisma.notification.create({
      data: {
        userId: Number(userId),
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

