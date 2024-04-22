/**
 * Model representing the status of the operation
 */
class Status {
    /**
     *
     * @param {Number} code default is 200 ok
     * @param {String} message
     * @param {String} description
     */
    constructor(code=200, message='', description='') {
      this.code = code;
      this.message= message;
      this.description = description;
    }
  }
  
  module.exports = Status;
  