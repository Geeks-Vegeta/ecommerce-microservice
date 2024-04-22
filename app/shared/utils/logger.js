const moment = require("moment");

exports.error = error;
exports.warn = warn;
exports.debug = debug;
exports.info = info;
exports.exception = exception;

/**
 *
 * @param {*} message
 */
async function info(message) {
  message = `${moment().toLocaleString()} | ${message}`;
  console.info(message);
}

/**
 *
 * @param {*} message
 */
async function debug(message) {
  message = `${moment().toLocaleString()} | ${message}`;
  console.debug(message);
}

/**
 *
 * @param {*} message
 */
async function warn(message) {
  message = `${moment().toLocaleString()} | ${message}`;
  console.warn(message);
}

/**
 *
 * @param {*} message
 */
async function error(message) {
  message = `${moment().toLocaleString()} | ${message}`;
  console.error(message);
}

/**
 *
 * @param {*} ex
 */
async function exception(ex) {
  const message = `message:${ex.message} |description : ${ex.description} | stacktrace: ${ex.stack}`;
  error(`${message}`);
}
