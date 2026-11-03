const matchService = require('../services/match.service');
const chatService = require('../services/chat.service');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { getIO } = require('../sockets/chat.socket');

const listMine = asyncHandler(async (req, res) => {
  const matches = await matchService.listMatches(req.user.id);
  res.json({ data: matches, total: matches.length });
});

const listForUser = asyncHandler(async (req, res) => {
  const requested = parseInt(req.params.userId, 10);
  if (!Number.isInteger(requested) || requested !== req.user.id) {
    throw new HttpError(403, 'You can only view your own matches');
  }
  const matches = await matchService.listMatches(req.user.id);
  res.json({ data: matches, total: matches.length });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.params.id, req.user.id, req.query);
  res.json({ status: 'ok', data: messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendMessage({
    matchId: req.params.id,
    senderId: req.user.id,
    content: req.body.content,
  });

  // If Socket.io is active, broadcast to room as well
  const io = getIO();
  if (io) {
    io.to(`match_${req.params.id}`).emit('receive_message', result.message);
  }

  res.status(201).json({ status: 'ok', data: result.message });
});

module.exports = {
  listMine,
  listForUser,
  getMessages,
  sendMessage,
};
