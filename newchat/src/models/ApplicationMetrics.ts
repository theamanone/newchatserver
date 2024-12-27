import mongoose from 'mongoose';

const applicationMetricsSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  activeUsers: {
    type: Number,
    required: true,
    default: 0
  },
  messageCount: {
    type: Number,
    required: true,
    default: 0
  },
  responseTime: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const ApplicationMetrics = mongoose.models.ApplicationMetrics || mongoose.model('ApplicationMetrics', applicationMetricsSchema);

export default ApplicationMetrics;
