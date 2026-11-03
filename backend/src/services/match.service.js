const matchRepository = require('../repositories/match.repository');
const presenceService = require('./presence.service');
const { toPublicUser } = require('./auth.service');

/**
 * Return all matches involving `userId`. For each Match row we project the
 * "other" user (full profile + skills + last message + online presence) so the client gets everything in one go.
 */
async function listMatches(userId) {
  const currentUserId = Number(userId);
  const matches = await matchRepository.listMatches(currentUserId);

  // Extract other user IDs to check presence in bulk
  const otherUserIds = matches.map((m) => (m.userAId === currentUserId ? m.userBId : m.userAId));
  const presenceMap = await presenceService.getUsersPresence(otherUserIds);

  return matches.map((m) => {
    const other = m.userAId === currentUserId ? m.userB : m.userA;
    const publicOther = toPublicUser(other);
    const isOnline = Boolean(presenceMap[other.id]);

    return {
      matchId: m.id,
      matchedAt: m.createdAt,
      jobRole: m.jobRole || null,
      lastMessage: m.messages?.[0] || null,
      user: {
        ...publicOther,
        isOnline,
        skills: (publicOther.skills || []).map((us) => us.skill?.name || us),
      },
    };
  });
}

module.exports = { listMatches };
