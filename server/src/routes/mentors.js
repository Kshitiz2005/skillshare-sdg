const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const mentorController = require('../controllers/mentorController');

router.get('/', mentorController.listMentors);          // public browse/search
router.get('/:id', mentorController.getMentor);          // public mentor detail
router.patch('/me', requireAuth, mentorController.updateMyMentorProfile);

module.exports = router;
