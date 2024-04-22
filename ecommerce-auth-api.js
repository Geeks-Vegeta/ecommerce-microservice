const express = require("express");
require("express-async-errors");
const logger = require("./app/shared/utils/logger");
const init = require("./app/startup/init");
const errorHandler = require("./app/shared/utils/error-handler");

const app = express();
const PORT = 3000;

/**
 *
 */
async function startup() {
  //INIT MONGO, REDIS [Middleware]
  await init(app);

  //INITIALIZE ROUTES BELOW
  await require("./app/startup/routes")(app);

  app.use(errorHandler);
}

startup().then(
  () => {
    app.listen(PORT, () => {
      logger.info(`ecommerce auth Service Connected on port ${PORT}`);
    });
  },
  (err) => {
    logger.error(`Error starting the service on port ${PORT}`);
    logger.exception(err);
    process.exit(0);
  }
);

exports.app = app;
