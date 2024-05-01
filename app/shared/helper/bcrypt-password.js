const bcrypt = require("bcryptjs");

/**
 *
 * @param {*} password
 * @returns
 */
const hashedPassword = async (password) => {
  let salt = await bcrypt.genSaltSync(13);
  return await bcrypt.hash(password, salt);
};

/**
 *
 * @param {*} password
 * @param {*} user_password
 * @returns
 */
const comparePassword = async (password, user_password) => {
  return await bcrypt.compare(password, user_password);
};

module.exports = {
  hashedPassword,
  comparePassword,
};