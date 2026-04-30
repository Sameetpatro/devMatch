const developerService = require('../services/developer.service');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await developerService.listDevelopers(req.user.id, req.query);
  res.json(result);
});

module.exports = { list };
