const { Queue, Worker } = require('bullmq');
const config = require('../config');
const logger = require('../config/logger');

// Create queues
const emailQueue = new Queue('emails', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
});

const notificationQueue = new Queue('notifications', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
});

// Email worker
const emailWorker = new Worker(
  'emails',
  async (job) => {
    const { to, subject, content } = job.data;
    logger.info(`Processing email job: ${job.id}`);
    
    // TODO: Implement actual email sending logic using nodemailer
    // For now, just log the email
    logger.info(`Sending email to ${to}: ${subject}`);
    
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return { success: true, messageId: `msg-${Date.now()}` };
  },
  {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
  }
);

// Notification worker
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { userId, title, message, type } = job.data;
    logger.info(`Processing notification job: ${job.id}`);
    
    // TODO: Send notification via WebSocket
    logger.info(`Sending notification to user ${userId}: ${title}`);
    
    return { success: true };
  },
  {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
  }
);

// Event listeners
emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, error) => {
  logger.error(`Email job ${job.id} failed:`, error);
});

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, error) => {
  logger.error(`Notification job ${job.id} failed:`, error);
});

// Helper functions
const addEmailJob = async (emailData) => {
  return emailQueue.add('send-email', emailData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};

const addNotificationJob = async (notificationData) => {
  return notificationQueue.add('send-notification', notificationData);
};

module.exports = {
  emailQueue,
  notificationQueue,
  addEmailJob,
  addNotificationJob,
};
