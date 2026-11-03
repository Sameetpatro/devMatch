const prisma = require('../config/prisma');
const userRepository = require('../repositories/user.repository');
const swipeRepository = require('../repositories/swipe.repository');
const matchRepository = require('../repositories/match.repository');
const notificationRepository = require('../repositories/notification.repository');
const { getIO } = require('../sockets/chat.socket');
const queuePublisher = require('../queues/publisher');
const HttpError = require('../utils/httpError');

/**
 * Record a swipe. If LIKE and the target has already LIKEd back, also create
 * the Match row (atomically, inside an interactive PostgreSQL transaction with advisory lock).
 *
 * Returns: { swipe, match | null, isNewMatch: boolean }
 */
async function recordSwipe(fromUserId, { toUserId, direction }) {
  const fromId = Number(fromUserId);
  const toId = Number(toUserId);

  if (fromId === toId) {
    throw new HttpError(400, 'You cannot swipe on yourself');
  }

  const [sender, target] = await Promise.all([
    userRepository.findById(fromId),
    userRepository.findById(toId),
  ]);

  if (!target) throw new HttpError(404, 'Target user not found');

  const [minId, maxId] = matchRepository.canonicalPair(fromId, toId);

  const result = await prisma.$transaction(
    async (tx) => {
      // Database-level safeguard: PostgreSQL transaction advisory lock on canonical user pair.
      // Serializes concurrent reciprocal swipes so neither thread reads a stale snapshot.
      await tx.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
        minId,
        maxId
      );

      const swipe = await swipeRepository.recordSwipe(tx, {
        fromUserId: fromId,
        toUserId: toId,
        direction,
      });

      let match = null;
      let isNewMatch = false;

      if (direction === 'LIKE') {
        const reciprocal = await swipeRepository.findReciprocalSwipe(tx, fromId, toId);

        if (reciprocal && reciprocal.direction === 'LIKE') {
          const existing = await matchRepository.findMatch(fromId, toId, tx);

          match = await matchRepository.createMatch(tx, fromId, toId);
          isNewMatch = !existing;
        }
      }

      return { swipe, match, isNewMatch };
    },
    {
      maxWait: 15000,
      timeout: 25000,
    }
  );

  const io = getIO();

  if (result.isNewMatch) {
    // Both users get connection notifications directly in PostgreSQL
    const notifFrom = await notificationRepository.create({
      userId: fromId,
      type: 'MATCH',
      title: "It's a Connection!",
      body: `You and ${target.name} connected! Start chatting now.`,
      data: { matchId: result.match?.id, partnerId: toId, partnerName: target.name },
    });

    const notifTo = await notificationRepository.create({
      userId: toId,
      type: 'MATCH',
      title: "It's a Connection!",
      body: `You and ${sender?.name || 'A developer'} connected! Start chatting now.`,
      data: { matchId: result.match?.id, partnerId: fromId, partnerName: sender?.name },
    });

    // Directly emit real-time WebSocket events to both connected clients
    if (io) {
      io.to(`user_${fromId}`).emit('new_notification', notifFrom);
      io.to(`user_${toId}`).emit('new_notification', notifTo);
      io.to(`user_${fromId}`).emit('new_match', { matchId: result.match?.id, partner: target });
      io.to(`user_${toId}`).emit('new_match', { matchId: result.match?.id, partner: sender });
    }

    // Also queue for async background logging/email
    queuePublisher
      .publishNotification({
        userId: fromId,
        type: 'MATCH',
        title: "It's a Connection!",
        body: `You and ${target.name} connected! Start chatting now.`,
        data: { matchId: result.match?.id, partnerId: toId },
      })
      .catch((err) => console.warn(`[NotificationQueue] publish failed: ${err.message}`));

    queuePublisher
      .publishNotification({
        userId: toId,
        type: 'MATCH',
        title: "It's a Connection!",
        body: `You and ${sender?.name || 'A developer'} connected! Start chatting now.`,
        data: { matchId: result.match?.id, partnerId: fromId },
      })
      .catch((err) => console.warn(`[NotificationQueue] publish failed: ${err.message}`));
  } else if (direction === 'LIKE') {
    // Recruiter / Collaborator sends direct collaboration request to Candidate
    // Directly persist notification to DB so candidate sees it instantly in notifications & inbox
    const senderRole = sender?.role || (sender?.userType === 'RECRUITER' ? 'Recruiter' : 'Developer');
    const senderCompany = sender?.companyName ? ` at ${sender.companyName}` : '';

    const reqNotif = await notificationRepository.create({
      userId: toId,
      type: 'REQUEST',
      title: 'New Collaboration Request',
      body: `${sender?.name || 'A user'} (${senderRole}${senderCompany}) wants to collaborate with you!`,
      data: {
        fromUserId: fromId,
        senderName: sender?.name || 'Recruiter',
        senderRole: sender?.role,
        companyName: sender?.companyName,
      },
    });

    // Directly emit real-time WebSocket event to the candidate's personal channel
    if (io) {
      console.log(`[Socket] Direct real-time collaboration request notification sent to user_${toId}`);
      io.to(`user_${toId}`).emit('new_notification', reqNotif);
    }

    // Also queue for async background logging/email
    queuePublisher
      .publishNotification({
        userId: toId,
        type: 'REQUEST',
        title: 'New Collaboration Request',
        body: `${sender?.name || 'A user'} (${sender?.companyName || sender?.role || sender?.userType || 'Recruiter'}) wants to collaborate with you!`,
        data: {
          fromUserId: fromId,
          senderName: sender?.name || 'Recruiter',
          senderRole: sender?.role,
          companyName: sender?.companyName,
        },
      })
      .catch((err) => console.warn(`[NotificationQueue] publish failed: ${err.message}`));
  }

  return result;
}

/**
 * Get all incoming collaboration requests received by the user
 */
async function getReceivedRequests(userId) {
  const currentId = Number(userId);
  const receivedSwipes = await swipeRepository.getReceivedSwipes(currentId);

  const results = await Promise.all(
    receivedSwipes.map(async (swipe) => {
      const [uA, uB] = matchRepository.canonicalPair(currentId, swipe.fromUserId);
      const match = await matchRepository.findMatch(uA, uB);

      return {
        id: swipe.id,
        direction: swipe.direction,
        status: match ? 'CONNECTED' : 'PENDING',
        matchId: match ? match.id : null,
        createdAt: swipe.createdAt,
        fromUser: {
          ...swipe.fromUser,
          skills: (swipe.fromUser.skills || []).map((us) => us.skill?.name || us),
        },
      };
    })
  );

  return results;
}

/**
 * Get all connection requests / swipes sent by the user, with connection status
 */
async function getSentRequests(userId) {
  const currentId = Number(userId);
  const sentSwipes = await swipeRepository.getSentSwipes(currentId);

  const results = await Promise.all(
    sentSwipes.map(async (swipe) => {
      const [uA, uB] = matchRepository.canonicalPair(currentId, swipe.toUserId);
      const match = await matchRepository.findMatch(uA, uB);

      return {
        id: swipe.id,
        direction: swipe.direction,
        status: match ? 'CONNECTED' : 'PENDING',
        matchId: match ? match.id : null,
        createdAt: swipe.createdAt,
        targetUser: {
          ...swipe.toUser,
          skills: (swipe.toUser.skills || []).map((us) => us.skill?.name || us),
        },
      };
    })
  );

  return results;
}

module.exports = { recordSwipe, getSentRequests, getReceivedRequests };
