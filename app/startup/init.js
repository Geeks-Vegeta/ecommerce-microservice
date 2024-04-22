const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const cacheClient = require("../shared/cache/client");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
const logger = require("../shared/utils/logger");
const mongoClient = require("../shared/database/mongo");
const moment = require("moment");
const s3 = require("../shared/storage/s3");

/**
 *
 * @param {*} app
 */
module.exports = async function init(app) {
  await mongoClient.connect();
  await cacheClient.init();
  await s3.init();
  await initMiddlewares(app);
  handleProcessExceptions();
};

async function initMiddlewares(app) {
  app.use("/healthcheck", (req, res, next) => {
    res.send("ok");
  });

  morgan.token("time", (req) => {
    return moment().toLocaleString();
  });
  app.use(morgan(":time | :method :url :status :response-time ms"));
  app.use(cors());
  app.use(helmet());
  app.use((req, res, next) => {
    if (cacheClient.isReady() == false || mongoClient.isReady() == false)
      throw new Error("Server is not available");
    next();
  });
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(bodyParser.urlencoded({ limit: "1mb", extended: false }));
  app.use(fileUpload({ debug: false }));

  app.use((err, req, res, next) => {
    // Send a JSON response with the error message and status code
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      data: {
        item: {},
      },
      status: {
        type: "error",
        message: "Something went wrong. Please try again later.",
        description: "Something went wrong",
      },
    });
  });
}

function handleProcessExceptions() {
  process.on("uncaughtException", (ex) => {
    logger.exception(ex);
  });
  process.on("unhandledRejection", (ex) => {
    logger.exception(ex);
  });
}
