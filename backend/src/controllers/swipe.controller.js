const swipeService = require('../services/swipe.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const result = await swipeService.recordSwipe(req.user.id, req.body);
  res.status(201).json(result);
});

const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await swipeService.getSentRequests(req.user.id);
  res.json({ status: 'ok', data: requests });
});

const getReceivedRequests = asyncHandler(async (req, res) => {
  const requests = await swipeService.getReceivedRequests(req.user.id);
  res.json({ status: 'ok', data: requests });
});

module.exports = { create, getSentRequests, getReceivedRequests };
