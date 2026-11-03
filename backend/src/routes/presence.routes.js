const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const presenceService = require('../services/presence.service');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/heartbeat',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await presenceService.heartbeat(req.user.id);
    res.json({ status: 'ok', data: result });
  })
);

router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const isOnline = await presenceService.isOnline(req.params.userId);
    res.json({ status: 'ok', data: { userId: Number(req.params.userId), isOnline } });
  })
);

router.post(
  '/batch',
  asyncHandler(async (req, res) => {
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    const presenceMap = await presenceService.getUsersPresence(userIds);
    res.json({ status: 'ok', data: presenceMap });
  })
);

router.post(
  '/offline',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await presenceService.setOffline(req.user.id);
    res.json({ status: 'ok', data: result });
  })
);

module.exports = router;

