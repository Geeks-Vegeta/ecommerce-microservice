const logger = require('./logger');
const sendResponse = require('./send-response');
const NoResponseError = require('./no-response-error-model');
const Status = require('./status-model');

module.exports = function handleError(err, req, res, next) {
  logger.exception(err);
  if (err instanceof NoResponseError) {
    // do not send any response to clients
    return;
  } else {
    if (req.audit) {
      req.audit.message += 'Message Logged: '+err.message || err.description;
      req.audit.stackError = err.stack;
      req.audit.status = "FAILED";
    }
    return sendResponse(req, res, next, {}, new Status(err.status || 500,
      err.message, err.description));
  }
};
