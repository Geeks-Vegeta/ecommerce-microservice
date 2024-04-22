const mongoose = require("mongoose");
const logger = require("../utils/logger");

module.exports = {
  isReady,
  connect,
  removeConnection,
  removeAllConnections,
};

let ISREADY = false;
const connections = new Map();
const baseConnectionString = process.env["mongobaseUrlString"];

const options = {
  useNewUrlParser: true,
  connectTimeoutMS: 5000,
  maxPoolSize: 50,
};

// default mongoose connection events needs to be subscribed before connection is established
subscribeToEvents(mongoose.connection, "Cluster");

/**
 * connect to the master db by default so that application readiness is verified as part of startup
 */
async function connect() {
  try {
    // connect to cluster product db
    await mongoose.connect(baseConnectionString, options);
  } catch (error) {
    logger.error(`Error connecting to database`);
    ISREADY = false;
    throw error;
  }
}


/**
 *
 * @param {*} database
 */
function removeConnection(database) {
  if (!database || database == "") return;
  const dbName = database;
  if (connections.has(dbName)) {
    connections.delete(dbName);
  }
}

/**
 *
 */
function removeAllConnections() {
  logger.info("Removing All Mongo Connenctions from Cache");
  for (const database of connections.keys()) {
    removeConnection(database);
  }
}

/**
 * listen on connection events
 * @param {*} connection
 * @param {*} name
 */
async function subscribeToEvents(connection, name) {
  if (!name || name == "") return;
  connection.addListener("connecting", (args) => {
    logger.info(`Connecting to ${name} database`);
  });
  connection.on("connected", (args) => {
    logger.info(`Connected to ${name} database`);
    ISREADY = true;
  });
  connection.on("disconnected", (args) => {
    logger.error(`Disconnected from  ${name} database`);
  });
  connection.addListener("disconnecting", (args) => {
    logger.error(`Disconnecting from  ${name} database`);
  });
  connection.addListener("reconnected", (args) => {
    logger.error(`Reconnected to ${name} database`);
    ISREADY = true;
  });
  connection.addListener("error", function(err) {
    logger.error(err.message);
    throw new Error(`Error connecting to ${name} Database`);
  });
}

/**
 * @return {*} Client
 */
function isReady() {
  return ISREADY;
}
