const authService = require("./service");
const ClientError = require("../../../shared/exceptions/client-error");
const ServerError = require("../../../shared/exceptions/server-error");
const logger = require("../../../shared/utils/logger");
const sendResponse = require("../../../shared/utils/send-response");
const { validateRegister, validateLogin } = require("./validator");

module.exports = {
  register,
  login,
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
async function register(req, res, next) {
  try {
    let { email } = req.body;
    const { error } = validateRegister(req.body);
    if (error) {
      throw new ClientError(400, error.message);
    }

    let isUserExists = await authService.isUserExists(email);
    if (isUserExists) {
      throw new ClientError(400, "user already exists");
    }
    await authService.registerUser(req.body);
    return sendResponse(req, res, next, {
      message: "user created successfully",
    });
  } catch (ex) {
    logger.exception(ex, req);
    throw new ServerError(
      500,
      ex.description || "Failed to create user",
      ex.message
    );
  }
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function login(req, res, next) {
  try {
    let { password, email } = req.body;
    const { error } = validateLogin(req.body);
    if (error) {
      throw new ClientError(400, error.message);
    }
    let user = await authService.isUserExists(email);
    if (!user) throw new ClientError(404, "user not found");

    let comparePassword = await authService.isAuthenticPassword(
      password,
      user.password
    );
    if (!comparePassword) throw new ClientError(400, "invalid password");

    let token = await authService.generateToken(user._id);
    return sendResponse(req, res, next, token);

  } catch (ex) {
    logger.exception(ex, req);
    throw new ServerError(
      500,
      ex.description || "Failed to login user",
      ex.message
    );
  }
}
