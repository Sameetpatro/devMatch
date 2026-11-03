const roleService = require('../services/role.service');
const asyncHandler = require('../utils/asyncHandler');

const publishRole = asyncHandler(async (req, res) => {
  const role = await roleService.publishRole(req.user.id, req.body);
  res.status(201).json({ status: 'ok', data: role });
});

const getMyRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getRecruiterRoles(req.user.id);
  res.json({ status: 'ok', data: roles });
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  res.json({ status: 'ok', data: role });
});

const updateRole = asyncHandler(async (req, res) => {
  const updated = await roleService.updateRole(req.user.id, req.params.id, req.body);
  res.json({ status: 'ok', data: updated });
});

const getCandidatesForRole = asyncHandler(async (req, res) => {
  const candidates = await roleService.getCandidatesForRole(req.user.id, req.params.id);
  res.json({ status: 'ok', data: candidates });
});

const applyToRole = asyncHandler(async (req, res) => {
  const result = await roleService.applyToRole(req.user.id, req.params.id, req.body.coverLetter);
  res.status(201).json({ status: 'ok', data: result });
});

const decideApplication = asyncHandler(async (req, res) => {
  const result = await roleService.decideApplication(
    req.user.id,
    req.params.id,
    req.params.appId,
    req.body.decision
  );
  res.json({ status: 'ok', data: result });
});

const getPersonalizedRoleFeed = asyncHandler(async (req, res) => {
  const feed = await roleService.getPersonalizedRoleFeed(req.user.id, req.query);
  res.json({ status: 'ok', ...feed });
});

module.exports = {
  publishRole,
  getMyRoles,
  getRoleById,
  updateRole,
  getCandidatesForRole,
  applyToRole,
  decideApplication,
  getPersonalizedRoleFeed,
};

