'use strict';

const { EventEmitter } = require('events');
const fg = require('fast-glob');
const workerFarm = require('worker-farm');

class FileProcessor extends EventEmitter {
  constructor(globPattern, worker, options = {}, globOptions = {}) {
    super();

    options = options || {};
    const glob = (this.glob = fg.stream(globPattern, globOptions));

    this.invokeWorker = options.invokeWorker || defaultInvokeWorker;
    const workers = (this.workers = workerFarm(options.worker || {}, worker));

    // initilize vars to track processing status
    let allQueued = false;
    let errorOccured = false;
    let queuedCount = 0;
    let processedCount = 0;

    // Checks for completion of processing
    const checkForEnd = () => {
      if (errorOccured || (allQueued && queuedCount === processedCount)) {
        if (!options.keepAlive) {
          workerFarm.end(workers);
        }
        if (!errorOccured) this.emit('end');
      }
    };

    // Listen for 'data' event emitted by glob stream
    glob.on('data', (path) => {
      queuedCount++;
      this.emit('queued', path);
      this.process(path, (err, result) => {
        processedCount++;
        if (err) {
          errorOccured = true;
          this.emit('error', err);
        } else {
          this.emit('processed', path, result);
        }

        checkForEnd();
      });
    });

    // Listen for 'end' event emitted by the glob stream
    glob.on('end', () => {
      allQueued = true;
      this.emit('allQueued', { queuedCount, processedCount });
      checkForEnd();
    });
  }

  // Method to process a file using the worker function
  process(path, callback) {
    this.invokeWorker(this.workers, path, callback);
  }
  // Method to destroy the FileProcessor instance
  destroy(callback) {
    this.glob.destroy();
    workerFarm.end(this.workers, callback);
  }
}

// Worker invoker
function defaultInvokeWorker(workers, path, callback) {
  workers(path, callback);
}

module.exports = FileProcessor;
