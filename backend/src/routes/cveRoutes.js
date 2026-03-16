const express = require('express');
const router = express.Router();
const { getAllCVEs, getCVEById, searchCVEs, getHotCVEs, getCVEStats } = require('../controllers/cveController');

router.get('/', getAllCVEs);
router.get('/search', searchCVEs);
router.get('/hot', getHotCVEs);
router.get('/stats', getCVEStats);
router.get('/:id', getCVEById);

module.exports = router;
