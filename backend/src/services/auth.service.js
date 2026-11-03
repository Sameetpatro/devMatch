const userRepository = require('../repositories/user.repository');
const queuePublisher = require('../queues/publisher');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

// Strip sensitive fields before sending a User to the client.
function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

// Issue a JWT for a given user record, including role/userType.
function issueTokenFor(user) {
  return signToken({
    sub: user.id,
    email: user.email,
    userType: user.userType || 'DEVELOPER',
  });
}

async function register(input) {
  const {
    email, password, name, role, userType, companyName, bio, experienceYears, skills,
    phone, linkedin, github, telegram,
  } = input;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const user = await userRepository.createWithSkills(
    {
      email,
      passwordHash,
      name,
      userType: userType || 'DEVELOPER',
      companyName: companyName ?? null,
      role,
      bio: bio ?? null,
      experienceYears: experienceYears ?? 0,
      phone,
      linkedin: linkedin ?? null,
      github: github ?? null,
      telegram: telegram ?? null,
    },
    skills
  );

  // Asynchronously dispatch welcome email via RabbitMQ
  queuePublisher.publishEmail({
    to: user.email,
    subject: 'Welcome to DevMatch!',
    template: 'WELCOME',
    data: { name: user.name },
  }).catch((err) => console.warn(`Failed to enqueue welcome email: ${err.message}`));

  return {
    user: toPublicUser(user),
    token: issueTokenFor(user),
  };
}

async function login(input) {
  const { email, password } = input;

  const user = await userRepository.findByEmail(email);

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
  const user = await userRepository.findById(userId, { includeSkills: true });
  if (!user) throw new HttpError(404, 'User not found');
  return toPublicUser(user);
}

module.exports = { register, login, getMe, toPublicUser, issueTokenFor };
