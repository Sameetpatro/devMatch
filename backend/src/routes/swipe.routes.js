const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { swipeBody } = require('./swipe.schema');
const controller = require('../controllers/swipe.controller');

const router = Router();

router.post('/', requireAuth, validate(swipeBody), controller.create);

module.exports = router;
