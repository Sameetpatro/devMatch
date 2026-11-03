const userRepository = require('../repositories/user.repository');
const swipeRepository = require('../repositories/swipe.repository');

// ---- Ranking weights (sum to 100 so scores are 0..100) ----
const W_SKILL = 50;
const W_RATING = 30;
const W_EXPERIENCE = 20;

// Ratings are stored 0..5; experience caps at 10 years for ranking purposes.
const RATING_MAX = 5;
const EXPERIENCE_MAX_YEARS = 10;

// Normalize an array of skill names: lowercase + trim + dedupe.
function normalizeSkillNames(names) {
  return [...new Set((names || []).map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

// Compute the ranking score for a single candidate against a reference skill set.
function computeScore(candidate, referenceSkillsLower) {
  const candidateSkillsLower = (candidate.skills || []).map((us) =>
    (us.skill ? us.skill.name : us).toLowerCase()
  );

  let matchingSkills = 0;
  if (referenceSkillsLower.length > 0) {
    matchingSkills = candidateSkillsLower.filter((s) => referenceSkillsLower.includes(s)).length;
  }

  const skillMatch =
    referenceSkillsLower.length > 0 ? matchingSkills / referenceSkillsLower.length : 0;
  const ratingNorm = Math.min((candidate.rating || 0) / RATING_MAX, 1);
  const expNorm = Math.min((candidate.experienceYears || 0) / EXPERIENCE_MAX_YEARS, 1);

  const score = skillMatch * W_SKILL + ratingNorm * W_RATING + expNorm * W_EXPERIENCE;

  return {
    score: Number(score.toFixed(2)),
    skillMatch: Number(skillMatch.toFixed(2)),
    matchingSkills,
  };
}

// Privacy: when listing developers in the swipe feed, hide all contact info
function toPublicDeveloper(user, scoring) {
  const {
    passwordHash, skills,
    email, phone, linkedin, github, telegram,
    ...rest
  } = user;
  return {
    ...rest,
    skills: (skills || []).map((us) => (us.skill ? us.skill.name : us)),
    ...scoring,
  };
}

async function listDevelopers(currentUserId, query) {
  const { role, search, skills: skillsFilter, availableOnly, page, limit } = query;
  const wantAvailableOnly = availableOnly !== false; // default true

  const where = {
    id: { not: currentUserId },
  };
  if (wantAvailableOnly) where.isAvailable = true;
  if (role) where.role = { contains: role, mode: 'insensitive' };
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const swipedIds = await swipeRepository.getSwipedUserIds(currentUserId);
  if (swipedIds.length > 0) where.id = { not: currentUserId, notIn: swipedIds };

  // Reference skills for ranking
  let referenceSkills;
  if (skillsFilter && skillsFilter.length > 0) {
    referenceSkills = skillsFilter;
  } else {
    const me = await userRepository.findById(currentUserId, { includeSkills: true });
    referenceSkills = (me?.skills || []).map((us) => us.skill?.name || us);
  }
  const referenceSkillsLower = normalizeSkillNames(referenceSkills);

  const candidates = await userRepository.findCandidates(where, { limit: 200 });

  const ranked = candidates
    .map((c) => ({ user: c, scoring: computeScore(c, referenceSkillsLower) }))
    .sort((a, b) => {
      if (b.scoring.score !== a.scoring.score) return b.scoring.score - a.scoring.score;
      if (b.user.rating !== a.user.rating) return b.user.rating - a.user.rating;
      if (b.user.experienceYears !== a.user.experienceYears)
        return b.user.experienceYears - a.user.experienceYears;
      return a.user.id - b.user.id;
    });

  const total = ranked.length;
  const start = (page - 1) * limit;
  const slice = ranked.slice(start, start + limit);

  return {
    data: slice.map(({ user, scoring }) => toPublicDeveloper(user, scoring)),
    meta: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      referenceSkills,
      weights: { skill: W_SKILL, rating: W_RATING, experience: W_EXPERIENCE },
    },
  };
}

module.exports = { listDevelopers, computeScore, toPublicDeveloper };
