const { Router } = require('express');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { registerSchema, loginSchema } = require('./auth.schema');
const controller = require('../controllers/auth.controller');

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.get('/me', requireAuth, controller.me);

module.exports = router;
