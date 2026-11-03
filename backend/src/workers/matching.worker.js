const roleRepository = require('../repositories/role.repository');
const userRepository = require('../repositories/user.repository');
const cacheService = require('../services/cache.service');
const { computeScore } = require('../services/developer.service');

async function processMatchingJob(payload) {
  const { roleId, recruiterId } = payload;
  console.log(`[MatchingWorker] Processing async candidate matching for role #${roleId}...`);

  const role = await roleRepository.findById(roleId);
  if (!role) {
    console.warn(`[MatchingWorker] Role #${roleId} not found, skipping.`);
    return;
  }

  const roleSkills = (role.skills || []).map((rs) =>
    (rs.skill ? rs.skill.name : rs).toLowerCase()
  );

  // Fetch available developers
  const candidates = await userRepository.findCandidates({ isAvailable: true }, { limit: 100 });

  // Score candidates against role requirements
  const scored = candidates
    .map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      scoring: computeScore(candidate, roleSkills),
    }))
    .filter((c) => c.scoring.score > 20)
    .sort((a, b) => b.scoring.score - a.scoring.score);

  // Warm Redis cache with top matches for fast recruiter discovery
  const cacheKey = `cache:candidates:role:${roleId}`;
  await cacheService.set(cacheKey, scored, 600); // 10 min TTL

  console.log(
    `[MatchingWorker] Asynchronous matching completed for role #${roleId}: ${scored.length} matching candidates pre-computed and cached.`
  );
}

function startMatchingWorker(channel, queueName) {
  channel.prefetch(5);
  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await processMatchingJob(payload);
        channel.ack(msg);
      } catch (err) {
        console.error(`[MatchingWorker] Error processing job: ${err.message}`);
        channel.nack(msg, false, false); // Do not requeue corrupted job
      }
    },
    { noAck: false }
  );
  console.log(`[MatchingWorker] Listening on queue: ${queueName}`);
}

module.exports = { startMatchingWorker, processMatchingJob };

