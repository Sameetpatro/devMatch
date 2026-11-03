const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const notificationRepository = require('../repositories/notification.repository');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationRepository.listByUser(req.user.id, { unreadOnly });
    res.json({ status: 'ok', data: notifications });
  })
);

router.patch(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    await notificationRepository.markAsRead(req.params.id, req.user.id);
    res.json({ status: 'ok', message: 'Notification marked as read' });
  })
);

router.post(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await notificationRepository.markAllAsRead(req.user.id);
    res.json({ status: 'ok', message: 'All notifications marked as read' });
  })
);

module.exports = router;

