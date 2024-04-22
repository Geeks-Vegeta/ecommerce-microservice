const authService = require("./service");
const ClientError = require("../../../shared/exceptions/client-error");
const ServerError = require("../../../shared/exceptions/server-error");
const logger = require("../../../shared/utils/logger");
const sendResponse = require("../../../shared/utils/send-response");

module.exports = {
  register,
};

async function register(req, res, next) {
  try {
    let { email } = req.body;

    let isUserExists = await authService.isUserExists(email);
    if (isUserExists) {
        throw new ClientError(400, "user already exists");
    }
    await authService.create(req.body);
    return sendResponse(req, res, next, {"message":"user created successfully"})
  } catch (ex) {
    logger.exception(ex, req);
    throw new ServerError(
      500,
      ex.description || "Failed to send OTP",
      ex.message
    );
  }
}
