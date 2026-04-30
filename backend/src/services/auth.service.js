const prisma = require('../config/prisma');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

// Strip sensitive fields before sending a User to the client.
function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

// Issue a JWT for a given user record.
function issueTokenFor(user) {
  return signToken({ sub: user.id, email: user.email });
}

// Upsert skills by name and connect them to a user via the UserSkill join.
async function attachSkillsToUser(tx, userId, skillNames) {
  if (!skillNames || skillNames.length === 0) return;

  const normalized = [...new Set(skillNames.map((s) => s.trim()).filter(Boolean))];

  await Promise.all(
    normalized.map((name) =>
      tx.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const skills = await tx.skill.findMany({
    where: { name: { in: normalized } },
    select: { id: true },
  });

  await tx.userSkill.createMany({
    data: skills.map((s) => ({ userId, skillId: s.id })),
    skipDuplicates: true,
  });
}

async function register(input) {
  const { email, password, name, role, bio, experienceYears, skills } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        bio: bio ?? null,
        experienceYears: experienceYears ?? 0,
      },
    });

    await attachSkillsToUser(tx, created.id, skills);

    return tx.user.findUnique({
      where: { id: created.id },
      include: {
        skills: { include: { skill: true } },
      },
    });
  });

  return {
    user: toPublicUser(user),
    token: issueTokenFor(user),
  };
}

async function login(input) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { skills: { include: { skill: true } } },
  });

  // Generic message — never reveal whether the email exists.
  if (!user) throw new HttpError(401, 'Invalid email or password');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  return {
    user: toPublicUser(user),
    token: issueTokenFor(user),
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { skills: { include: { skill: true } } },
  });
  if (!user) throw new HttpError(404, 'User not found');
  return toPublicUser(user);
}

module.exports = { register, login, getMe, toPublicUser };
