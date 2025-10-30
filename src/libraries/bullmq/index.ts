// src/libraries/bullmq/index.ts

// Re-export queues so services can add jobs easily
export * from './queues/email.queue';
export * from './queues/file.queue';

// Optionally export workers if you want to run them in the same process
export * from './workers/email.worker';
export * from './workers/file.worker';
