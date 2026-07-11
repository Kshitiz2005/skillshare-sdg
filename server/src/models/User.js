const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: true,
    },
    startTime: { type: String, required: true }, // "HH:mm" 24h, stored in mentor's local tz
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: ['mentor', 'mentee', 'admin'], required: true },

    // Shared profile fields
    bio: { type: String, maxlength: 500, default: '' },
    languages: [{ type: String }],
    timezone: { type: String, default: 'UTC' },
    photoURL: { type: String, default: '' },

    // Mentor-specific fields
    expertise: [{ type: String }], // e.g. ["Coding", "Mathematics", "English"]
    availability: [availabilitySlotSchema],
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Mentee-specific fields
    learningGoals: [{ type: String }],
    preferredSubjects: [{ type: String }],

    // Accessibility preference, persisted per user
    lowBandwidthMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ expertise: 1 });

module.exports = mongoose.model('User', userSchema);
