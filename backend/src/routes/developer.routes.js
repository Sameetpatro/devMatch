const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { developerListQuery } = require('./developer.schema');
const controller = require('../controllers/developer.controller');

const router = Router();

router.get('/', requireAuth, validate(developerListQuery, 'query'), controller.list);

module.exports = router;
