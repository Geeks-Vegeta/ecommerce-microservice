const jwt = require("jsonwebtoken");
const ClientError = require("../shared/exceptions/client-error");
const ServerError = require("../shared/exceptions/server-error");
const logger = require("../shared/utils/logger");

const verifyUser = (req, res, next) => {
  try {
    const auth = req.headers["x-auth-token"]?.split(" ")[1] || false;
    if (!auth) throw new ClientError(401, "Invalid Token");

    jwt.verify(auth, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        // Access token expired or invalid
        if (err.name === "TokenExpiredError") {
          // Access token expired
          // Check if a refresh token is available
          const refreshToken = req.headers["x-refresh-token"];

          if (!refreshToken) {
            throw new ClientError(401, "Refresh token not provided");
          }

          // Verify the refresh token
          jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (refreshErr, refreshDecoded) => {
              if (refreshErr) {
                throw new ClientError(403, "Please Login Again");
              }

              // Generate a new access token
              const newAccessToken = jwt.sign(
                { id: refreshDecoded.id },
                process.env.TOKEN_SECRET,
                { expiresIn: "14d" }
              );

              // Set the new access token in the response headers
              res.setHeader("Authorization", `Bearer ${newAccessToken}`);

              // Proceed to the next middleware or route
              req.user = refreshDecoded;
              next();
            }
          );
        } else {
          // Other error during token verification
          throw new ClientError(403, "Invalid access token");
        }
      } else {
        req.user = decoded;
        next();
      }
    });
  } catch (err) {
    if (err instanceof ClientError) {
      logger.exception(err, req);
      throw new ClientError(403, "Please Provide Auth and Refresh Token");
    }
    throw new ServerError(500, "", err.message);
  }
};
module.exports = verifyUser;