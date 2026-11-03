const matchRepository = require('../repositories/match.repository');
const messageRepository = require('../repositories/message.repository');
const presenceService = require('./presence.service');
const queuePublisher = require('../queues/publisher');
const HttpError = require('../utils/httpError');

class ChatService {
  async sendMessage({ matchId, senderId, content }) {
    const mId = Number(matchId);
    const sId = Number(senderId);

    if (!content || !content.trim()) {
      throw new HttpError(400, 'Message content cannot be empty');
    }

    const match = await matchRepository.findById(mId);
    if (!match) throw new HttpError(404, 'Match connection not found');

    if (match.userAId !== sId && match.userBId !== sId) {
      throw new HttpError(403, 'Forbidden: You are not part of this match');
    }

    const recipientId = match.userAId === sId ? match.userBId : match.userAId;
    const sender = match.userAId === sId ? match.userA : match.userB;
    const recipient = match.userAId === sId ? match.userB : match.userA;

    // Persist message to database
    const message = await messageRepository.createMessage({
      matchId: mId,
      senderId: sId,
      content: content.trim(),
    });

    // Check if recipient is online in Redis
    const isRecipientOnline = await presenceService.isOnline(recipientId);

    // If offline, dispatch asynchronous notification and email alert via RabbitMQ
    if (!isRecipientOnline) {
      queuePublisher
        .publishNotification({
          userId: recipientId,
          type: 'MESSAGE',
          title: `New message from ${sender.name}`,
          body: content.length > 80 ? `${content.slice(0, 77)}...` : content,
          data: { matchId: mId, senderId: sId },
        })
        .catch((err) => console.warn(`[ChatQueue] Notification error: ${err.message}`));

      if (recipient.email) {
        queuePublisher
          .publishEmail({
            to: recipient.email,
            subject: `New message from ${sender.name}`,
            template: 'CHAT_ALERT',
            data: { senderName: sender.name, contentPreview: content.slice(0, 100) },
          })
          .catch((err) => console.warn(`[ChatQueue] Email error: ${err.message}`));
      }
    }

    return {
      message,
      recipientId,
      isRecipientOnline,
    };
  }

  async getMessages(matchId, userId, query = {}) {
    const mId = Number(matchId);
    const uId = Number(userId);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(query.offset, 10) || 0);

    const match = await matchRepository.findById(mId);
    if (!match) throw new HttpError(404, 'Match connection not found');

    if (match.userAId !== uId && match.userBId !== uId) {
      throw new HttpError(403, 'Forbidden: You cannot view messages for this match');
    }

    const messages = await messageRepository.listMessages(mId, { limit, offset });
    return messages;
  }

  async markAsRead(matchId, userId) {
    const mId = Number(matchId);
    const uId = Number(userId);

    const match = await matchRepository.findById(mId);
    if (!match) throw new HttpError(404, 'Match connection not found');

    if (match.userAId !== uId && match.userBId !== uId) {
      throw new HttpError(403, 'Forbidden');
    }

    return messageRepository.markAsRead(mId, uId);
  }
}

module.exports = new ChatService();

