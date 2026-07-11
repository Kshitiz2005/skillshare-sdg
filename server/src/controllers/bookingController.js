const Booking = require('../models/Booking');
const User = require('../models/User');
const { createZoomMeeting } = require('../config/zoom');

// POST /api/bookings  (mentee books a mentor's slot)
exports.createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') {
      return res.status(403).json({ error: 'Only mentees can create bookings' });
    }

    const { mentorId, subject, sessionType, startTime, endTime, notes } = req.body;
    if (!mentorId || !subject || !startTime || !endTime) {
      return res.status(400).json({ error: 'mentorId, subject, startTime, endTime are required' });
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    // Prevent double-booking: check for overlapping confirmed/pending sessions
    const overlap = await Booking.findOne({
      mentor: mentorId,
      status: { $in: ['pending', 'confirmed'] },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
    });
    if (overlap) {
      return res.status(409).json({ error: 'This time slot is no longer available' });
    }

    const booking = await Booking.create({
      mentor: mentorId,
      mentee: req.user._id,
      subject,
      sessionType: sessionType || 'video',
      startTime,
      endTime,
      notes: notes || '',
      status: 'pending',
    });

    // Auto-schedule a Zoom meeting for video sessions. This never blocks
    // the booking itself — if Zoom is unreachable or misconfigured, the
    // booking still succeeds and meetingLink just stays empty; a mentor
    // can add a link manually later.
    if (booking.sessionType === 'video') {
      try {
        const durationMinutes = Math.max(
          15,
          Math.round((new Date(endTime) - new Date(startTime)) / 60000)
        );
        const zoomMeeting = await createZoomMeeting({
          topic: `${subject} mentoring session · SkillShare SDG`,
          startTime,
          durationMinutes,
        });
        booking.meetingLink = zoomMeeting.join_url;
        await booking.save();
      } catch (zoomErr) {
        console.error('Zoom meeting creation failed, continuing without it:', zoomErr.message);
      }
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// GET /api/bookings/me  (sessions for the logged-in user, either role)
exports.getMyBookings = async (req, res) => {
  try {
    const filter =
      req.user.role === 'mentor' ? { mentor: req.user._id } : { mentee: req.user._id };

    const bookings = await Booking.find(filter)
      .populate('mentor', 'displayName expertise photoURL')
      .populate('mentee', 'displayName photoURL')
      .sort({ startTime: 1 })
      .lean();

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// PATCH /api/bookings/:id/status  (mentor confirms/cancels; either side can cancel)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isParticipant =
      booking.mentor.toString() === req.user._id.toString() ||
      booking.mentee.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ error: 'Not authorized' });

    booking.status = status;

    // If this booking is being confirmed and it's a video session that
    // doesn't have a Zoom link yet (e.g. Zoom wasn't configured correctly
    // when the booking was first requested), try again now.
    if (status === 'confirmed' && booking.sessionType === 'video' && !booking.meetingLink) {
      try {
        const durationMinutes = Math.max(
          15,
          Math.round((booking.endTime - booking.startTime) / 60000)
        );
        const zoomMeeting = await createZoomMeeting({
          topic: `${booking.subject} mentoring session · SkillShare SDG`,
          startTime: booking.startTime,
          durationMinutes,
        });
        booking.meetingLink = zoomMeeting.join_url;
      } catch (zoomErr) {
        console.error('Zoom meeting creation failed on confirm:', zoomErr.message);
        // Booking still gets confirmed; meetingLink stays empty and the
        // dashboard will show a "not yet available" state instead of a link.
      }
    }

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// POST /api/bookings/:id/feedback  (post-session rating)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Feedback only allowed after session is completed' });
    }

    booking.feedback = { rating, comment: comment || '', submittedBy: req.user._id };
    await booking.save();

    const mentor = await User.findById(booking.mentor);
    const newCount = mentor.ratingCount + 1;
    const newAvg = (mentor.rating * mentor.ratingCount + rating) / newCount;
    mentor.rating = Math.round(newAvg * 10) / 10;
    mentor.ratingCount = newCount;
    await mentor.save();

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};
