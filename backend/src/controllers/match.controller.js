const matchService = require('../services/match.service');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const listMine = asyncHandler(async (req, res) => {
  const matches = await matchService.listMatches(req.user.id);
  res.json({ data: matches, total: matches.length });
});

// Spec endpoint: GET /matches/:userId — the JWT-authenticated user can only
// fetch their own matches.
const listForUser = asyncHandler(async (req, res) => {
  const requested = parseInt(req.params.userId, 10);
  if (!Number.isInteger(requested) || requested !== req.user.id) {
    throw new HttpError(403, 'You can only view your own matches');
  }
  const matches = await matchService.listMatches(req.user.id);
  res.json({ data: matches, total: matches.length });
});

module.exports = { listMine, listForUser };
