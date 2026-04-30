const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const controller = require('../controllers/match.controller');

const router = Router();

router.get('/', requireAuth, controller.listMine);
router.get('/:userId', requireAuth, controller.listForUser);

module.exports = router;
