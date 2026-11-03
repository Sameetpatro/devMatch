const express = require('express');
const { requireAuth, requireUserType } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { actionLimiter } = require('../middlewares/rateLimiter');
const {
  createRoleSchema,
  updateRoleSchema,
  applyRoleSchema,
  decisionSchema,
} = require('./role.schema');
const roleController = require('../controllers/role.controller');

const router = express.Router();

// Developer Personalized Feed
router.get('/feed', requireAuth, roleController.getPersonalizedRoleFeed);

// Recruiter Role Management
router.post(
  '/',
  requireAuth,
  requireUserType('RECRUITER'),
  validate(createRoleSchema),
  roleController.publishRole
);

router.get(
  '/',
  requireAuth,
  requireUserType('RECRUITER'),
  roleController.getMyRoles
);

router.get('/:id', requireAuth, roleController.getRoleById);

router.patch(
  '/:id',
  requireAuth,
  requireUserType('RECRUITER'),
  validate(updateRoleSchema),
  roleController.updateRole
);

// Recruiter: View ranked candidates & applicants for a role
router.get(
  '/:id/candidates',
  requireAuth,
  requireUserType('RECRUITER'),
  roleController.getCandidatesForRole
);

// Developer: Apply / Swipe on a role
router.post(
  '/:id/apply',
  requireAuth,
  actionLimiter,
  validate(applyRoleSchema),
  roleController.applyToRole
);

// Recruiter: Decide on applicant (ACCEPT -> creates Match / REJECT)
router.post(
  '/:id/applications/:appId/decision',
  requireAuth,
  requireUserType('RECRUITER'),
  validate(decisionSchema),
  roleController.decideApplication
);

module.exports = router;

