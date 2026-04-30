const swipeService = require('../services/swipe.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const result = await swipeService.recordSwipe(req.user.id, req.body);
  res.status(201).json(result);
});

module.exports = { create };
