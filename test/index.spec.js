const path = require('path');
const FileProcessor = require('../FileProcessor');
const workerPath = require.resolve('./workers/worker');

const getFileAbsolutePath = (fileName) => path.join(__dirname, 'example', fileName);
const txtPattern = getFileAbsolutePath('*.txt');

describe('File Processing', () => {
  let processor;

  beforeEach(() => {
    processor = new FileProcessor(txtPattern, workerPath);
  });

  test('Queued files are processed', async () => {
    expect.assertions(3);
    const handler = jest.fn();
    processor.on('queued', handler);

    await new Promise((resolve) => {
      processor.on('end', () => {
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('1.txt'));
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('2.txt'));
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('3.txt'));
        resolve();
      });
    });
  });

  test('Processed files emit the correct data', async () => {
    expect.assertions(3);
    const handler = jest.fn();
    processor.on('processed', handler);

    await new Promise((resolve) => {
      processor.on('end', () => {
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('1.txt'), 'a');
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('2.txt'), 'b');
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('3.txt'), 'c');
        resolve();
      });
    });
  });

  test('All queued files emit event with expected data', async () => {
    expect.assertions(1);
    const handler = jest.fn();
    processor.on('allQueued', handler);

    await new Promise((resolve) => {
      processor.on('end', () => {
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            queuedCount: 3,
            processedCount: expect.any(Number),
          })
        );
        resolve();
      });
    });
  });

  test('Destroying the processor', async () => {
    await new Promise((resolve) => {
      processor.destroy(resolve);
    });
  });

  test('Processing multiple paths', async () => {
    processor = new FileProcessor(
      [getFileAbsolutePath('1.txt'), getFileAbsolutePath('3.txt')],
      workerPath
    );

    expect.assertions(3);
    const handler = jest.fn();
    processor.on('queued', handler);

    await new Promise((resolve) => {
      processor.on('end', () => {
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('1.txt'));
        expect(handler).not.toHaveBeenCalledWith(getFileAbsolutePath('2.txt'));
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('3.txt'));
        resolve();
      });
    });
  });

  describe('Keep alive processing', () => {
    let fileProcessor;

    beforeEach(() => {
      fileProcessor = new FileProcessor(getFileAbsolutePath('1.txt'), workerPath, {
        keepAlive: true,
      });
    });

    test('Allows processing more files after initial pass', async () => {
      expect.assertions(2);
      await new Promise((resolve) => {
        fileProcessor.on('end', () => {
          fileProcessor.process(getFileAbsolutePath('2.txt'), (error, result) => {
            expect(error).toBe(null);
            expect(result).toEqual('b');
            resolve();
          });
        });
      });
    });

    afterEach(() => {
      return new Promise((resolve) => {
        fileProcessor.destroy(resolve);
      });
    });
  });

  test('Custom worker invocation', async () => {
    expect.assertions(3);

    const customProcessor = new FileProcessor(txtPattern, workerPath, {
      invokeWorker(workers, filepath, callback) {
        workers(filepath, (err, result) =>
          err ? callback(err) : callback(null, `${result}!`)
        );
      },
    });

    const handler = jest.fn();
    customProcessor.on('processed', handler);

    await new Promise((resolve) => {
      customProcessor.on('end', () => {
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('1.txt'), 'a!');
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('2.txt'), 'b!');
        expect(handler).toHaveBeenCalledWith(getFileAbsolutePath('3.txt'), 'c!');
        resolve();
      });
    });
  });
});
