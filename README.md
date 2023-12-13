# simple-file-processor

Nodejs utility service for mass-processing files in parallel.

## Getting Started
The `simple-file-processor` library enables concurrent file processing using worker modules. To utilize this library, you'll need two modules:

### Worker Module
The file-processor library enables concurrent file processing using worker modules. To utilize this library, you'll need two modules:

Worker Module
Create a worker module that exports a single function, accepting fileName and callback. This function should handle the file processing and invoke the callback upon completion. The function can be asynchronous.

**Example worker module:**
```js
module.exports = function (fileName, callback) {
  // Perform processing tasks on the file
  const result = performFileProcessing(fileName);
  callback(null, result);
};
```
### Implementation Module
Utilize the FileProcessor class from the file-processor package. Provide it with one or more glob patterns and the path to the worker module. Each file matching the pattern will be processed by the specified worker module.

**Example implementation:**
```js
const FileProcessor = require('file-processor');
const processor = new FileProcessor(
  ['path/to/some/files/*.txt', 'some/other/path/*.js'],
  require.resolve('./worker')
);

processor.on('processed', (fileName, result) => {
  console.log(`Result for ${fileName}: ${result}`);
});

```

`FilePorcssor` instance emits the following events:

 * `queued`: File queued for processing.

Arguments:

`fileName`
processed: File successfully processed by the worker.

Arguments:

* `fileName`
    * `result`: Result returned by the worker module
    * `error`: Worker failed to process the file.

Arguments:

 * `error`
 * `allQueued`: All files matching the pattern are queued for processing.

Arguments:

* `stats`: Object with the following fields:
    * `queuedCount`: Total number of queued files.
    * `processedCount`: Total number of processed files
* `end`: All files have been processed.


