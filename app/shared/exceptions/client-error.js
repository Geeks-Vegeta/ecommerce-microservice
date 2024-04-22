"use strict";
/**
 * these errors will be  logged and response will be sent back to clients.
 * these occurs due to validations and preprocessing errors
 */
class ClientError extends Error {
  /**
   *
   * @param {*} status
   * @param {*} message
   * @param {*} description
   */
  constructor(status, message, description = "") {
    super(message);
    this.message = message;
    this.status = status;
    this.description = description;
  }
}

module.exports = ClientError;
