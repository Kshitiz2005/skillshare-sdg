const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    subject: { type: String, required: true },
    sessionType: {
      type: String,
      enum: ['video', 'text'], // text = low-bandwidth-friendly session
      default: 'video',
    },

    startTime: { type: Date, required: true }, // stored in UTC
    endTime: { type: Date, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    meetingLink: { type: String, default: '' },
    notes: { type: String, maxlength: 1000, default: '' },

    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, maxlength: 1000 },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

bookingSchema.index({ mentor: 1, startTime: 1 });
bookingSchema.index({ mentee: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
