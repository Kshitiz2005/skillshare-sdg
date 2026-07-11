const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

router.use(requireAuth); // all booking routes require a logged-in user

router.post('/', bookingController.createBooking);
router.get('/me', bookingController.getMyBookings);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.post('/:id/feedback', bookingController.submitFeedback);

module.exports = router;
