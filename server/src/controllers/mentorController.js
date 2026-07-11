const User = require('../models/User');

exports.listMentors = async (req, res) => {
  try {
    const { subject, language, search } = req.query;
    const query = { role: 'mentor' };

    if (subject) query.expertise = subject;
    if (language) query.languages = language;
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const mentors = await User.find(query)
      .select('displayName bio expertise languages timezone rating ratingCount availability photoURL')
      .sort({ rating: -1 })
      .lean();

    res.json(mentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
};

exports.getMentor = async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
      .select('displayName bio expertise languages timezone rating ratingCount availability photoURL')
      .lean();

    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    res.json(mentor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentor' });
  }
};

exports.updateMyMentorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can update mentor profile fields' });
    }

    const allowedFields = ['bio', 'expertise', 'languages', 'availability', 'timezone', 'photoURL'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
