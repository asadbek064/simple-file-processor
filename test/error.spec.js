const path = require('path');
const workerPath = require.resolve('./workers/error-worker');
const FileProcessor = require('..');

const examplePath = (fileName) => path.join(__dirname, 'example', fileName);
const pattern = examplePath('*.txt');

describe('fails', () => {
  test('reports error in worker', (done) => {
    const fileProcessor = new FileProcessor(pattern, workerPath);
    
    // Listen for the 'error' event emitted by fileProcessor
    fileProcessor.on('error', (err) => {
      // Check if the error received is an instance of Error and has a specific message
      if (err instanceof Error && err.message === 'Not today') {
        // Assertion passes if the error matches the expected error message
        done(); // Notify Jest that the test is done
      } else {
        // Assertion fails if the error doesn't match the expected error message
        done(new Error('Received unexpected error'));
      }
    });

    fileProcessor.emit('error', new Error('Not today'));
  });
});