'use strict';

/**
 * 
 */
class NoResponseError extends Error {
  /**
   *
   * @param {*} status
   * @param {*} message
   * @param {*} description
   */
  constructor(status = 500, message = '500 Internal Server Error',
    description = 'Please contact System Administrator') {
    super(message);
    this.message = message;
    this.status = status;
    this.description = description;
  }
}

module.exports = NoResponseError;
