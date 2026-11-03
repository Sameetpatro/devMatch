const prisma = require('../config/prisma');

class MessageRepository {
  async createMessage({ matchId, senderId, content }) {
    return prisma.message.create({
      data: {
        matchId: Number(matchId),
        senderId: Number(senderId),
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async listMessages(matchId, { limit = 50, offset = 0 } = {}) {
    return prisma.message.findMany({
      where: { matchId: Number(matchId) },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async markAsRead(matchId, recipientId) {
    return prisma.message.updateMany({
      where: {
        matchId: Number(matchId),
        senderId: { not: Number(recipientId) },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}

module.exports = new MessageRepository();

