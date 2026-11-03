const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { actionLimiter } = require('../middlewares/rateLimiter');
const { swipeBody } = require('./swipe.schema');
const controller = require('../controllers/swipe.controller');

const router = Router();

router.post('/', requireAuth, actionLimiter, validate(swipeBody), controller.create);

module.exports = router;
