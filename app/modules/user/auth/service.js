const User = require("../../../shared/models/user");
const { comparePassword, hashedPassword } = require("../../../shared/helper/bcrypt-password");
const moment = require("moment");
const jwt = require("jsonwebtoken")
/**
 *
 * @param {*} email
 */
async function isUserExists(email) {
  return await User.findOne({ email: email });
}

/**
 *
 * @param {*} reqBody
 * @returns
 */
const registerUser = async (reqBody) => {
  reqBody.password = await hashedPassword(reqBody.password);
  let user = await User.create({
    ...reqBody,
    createdAt: moment().unix(),
    updatedAt: moment().unix(),
  });
  return user;
};

/**
 *
 * @param {*} password1
 * @param {*} password2
 * @returns
 */
const isAuthenticPassword = async (password1, password2) => {
  return await comparePassword(password1, password2);
};

/**
 *
 * @param {*} userId
 * @returns
 */
const generateToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.AUTH_TOKEN_EXPIRE_TIMEOUT,
  });
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRE_TIMEOUT }
  );

  return { token, refreshToken };
};

module.exports = {
    isUserExists,
    registerUser,
    isAuthenticPassword,
    generateToken
  };