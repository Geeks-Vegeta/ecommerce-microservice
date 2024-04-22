const { createClient, createCluster } = require('redis');
const CACHE_ENUMS = require('./keys');
const ServerError = require('../exceptions/server-error');
const logger = require('../../shared/utils/logger');

let ISREADY = false;
let client;


exports.init = init;
exports.isReady = isReady;
exports.getValues = getValues;
exports.getValue = getValue;
exports.addValue = addValue;
exports.addValues = addValues;
exports.delValue = delValue;
exports.delKey = delKey;
exports.isKeyExists = isKeyExists;
exports.isMembersExists = isMembersExists;
exports.delKeys = delKeys;
exports.popMinFromSortedSet = popMinFromSortedSet;
exports.isMemberOfSet = isMemberOfSet;
exports.getScoreFromSortedSet = getScoreFromSortedSet;
exports.getRangeByScoreFromSortedSet = getRangeByScoreFromSortedSet;
exports.removeMemberFromSortedSet = removeMemberFromSortedSet;
exports.addMemberIfNotExists = addMemberIfNotExists;
exports.hashGet = hashGet;
exports.hashSet = hashSet;
exports.findKeysByPattern=findKeysByPattern;

/**
 * 
 */
async function init() {
  let connectionOptions;

  if (process.env['redisMode'] == 'cluster') {
    connectionOptions = {
      rootNodes: [
        { url: process.env['redisUrl'] }
      ],
      defaults: {
        socket: {
          tls: true
        }
      }
    };
    client = createCluster(connectionOptions);
  } else {
    connectionOptions = {
      url: process.env['redisUrl'],
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          return retries > 10 ? 10000:retries * 1000;
        }
    }
    };
    client = createClient(connectionOptions);
  }

  client.on('error', (err) => {
    logger.error(`Error connecting to Redis : ${err.message} `);
    ISREADY = false;
  });
  
  client.on('connect', (err) => {
    logger.info(`Connected to Redis server`);
    ISREADY = true;
  });

  client.on('reconnecting', (err) => {
    logger.info(`Attempting to reconnecting to Redis server`);
    ISREADY = false;
  });

  client.on('ready', (err) => {
    logger.info(`Redis Connection is ready`);
    ISREADY = true;
  });

  await client.connect();
};

/**
 * @return {Boolean} 
 */
function isReady() {
  return ISREADY;
};


/**
 * 
 * @param {*} key 
 * @param {*} range
 * @param {*} path
 */
async function getValue(key, range = [0, -1], path = '.') {
  if (!validate(client, key)) return null;

  let result;
  const type = await client.type(key);
  switch (type) {
    case CACHE_ENUMS.STRING:
      result = await client.get(key);
      break;
    case CACHE_ENUMS.SET:
      result = await client.sMembers(key);
      break;
    case CACHE_ENUMS.SORTED_SET:
      result = await client.zRange(key, range[0], range[1]);
      break;
    case CACHE_ENUMS.HASH:
      result = await client.hGet(key, path);
      break;
    case CACHE_ENUMS.REJSON:
      result = await client.json.get(key, {path:path});
      break;
    case CACHE_ENUMS.TIMESERIES:
      result = await client.ts.range(key, path);
      break;
    default:
      break;
  }
  return result;
};

/**
 * 
 * @param {*} keys 
 */
async function getValues(keys) {
  if (!validate(client, keys)) return null;

  const result = await client.mGet(keys);
  return result;
};

/**
 * 
 * @param {*} key 
 * @param {*} value 
 */
async function isMemberOfSet(key, value) {
  if (!validate(client, key, value)) return null;

  const isExists = await client.sIsMember(key, value);

  return isExists == 1 ? true : false;
};

/**
 * 
 * @param {*} obj
 */
async function addValues(obj) {
  if (!validate(client)) return null;

  if (typeof (obj) != 'object' || Object.keys(obj).length == 0) return;

  const arr = [];

  for (const key of Object.keys(obj)) {
    arr.push(key);
    arr.push(obj[key]);
  }
  const result = await client.mSet(arr);
  return result;
};

/**
 * 
 * @param {*} key 
 * @param {*} value 
 * @param {*} type 
 * @param {*} score
 * @param {*} path
 * @param {*} expiry
 */
async function addValue(key, value, type, score = 0, path = '.', expiry = null) {
  if (!validate(client, key, value)) return null;

  let result;
  switch (type) {
    case CACHE_ENUMS.STRING:
      result = await client.set(key, value);
      break;
    case CACHE_ENUMS.SET:
      result = await client.sAdd(key, value);
      break;
    case CACHE_ENUMS.SORTED_SET:
      result = await client.zAdd(key, { score, value });
      break;
    case CACHE_ENUMS.HASH:
      result = await client.hSet(key, path, value);
      break;
    case CACHE_ENUMS.REJSON:
      result = await client.json.set(key, path, value);
      break;
    case CACHE_ENUMS.TIMESERIES: 
      result = await client.ts.mAdd(value);
      break; 
    default:
      break;
  }
  if (expiry) {
    await client.expire(key, expiry);
  }
  return result;
};



/**
 * 
 * @param {*} key 
 * @param {*} value 
 */
async function delValue(key, value = '.') {
  if (!validate(client, key, value)) return null;

  let result;
  const type = await client.type(key);
  switch (type) {
    case CACHE_ENUMS.STRING:
      result = await client.del(key);
      break;
    case CACHE_ENUMS.SET:
      result = await client.sRem(key, value);
      break;
    case CACHE_ENUMS.SORTED_SET:
      result = await client.zRem(key, value);
      break;
    case CACHE_ENUMS.HASH:
      result = await client.hDel(key, value);
      break;
    case CACHE_ENUMS.REJSON:
      result = await client.json_del(key, value);
      break;
    default:
      break;
  }
  return result;
};

/**
 * 
 * @param {*} key 
 */
async function delKey(key) {
  if (!validate(client, key)) return null;

  const result = await client.del(key);
  return result;
};

/**
 * 
 * @param {*} key 
 */
async function isKeyExists(key) {
  if (!validate(client, key)) return null;

  return await client.exists(key);
};

/**
 * 
 * @param {*} key 
 * @param {*} values 
 */
async function isMembersExists(key, values) {
  if (!validate(client, key, values)) return null;

  for (const value of values) {
    const isExists = await client.sIsMember(key, value);
    if (!isExists) return false;
  }

  return true;
};


/**
 * 
 * @param {*} client 
 * @param {*} keys 
 * @param {*} values 
 * @return {Boolean}
 */
function validate(client, keys=null, values=null) {
  if (!ISREADY) throw new ServerError(500, 'Redis Client not connected');

  if (Array.isArray(keys) && keys.length == 0) return false;

  if (Array.isArray(values) && values.length == 0) return false;

  return true;
};

/**
 * 
 * @param {*} regex 
 */
async function delKeys(regex) {
  if (!validate(client)) return null;
  let cursor = '0';
  do {
    const result = await client.scan(cursor, 'MATCH', regex);

    if (!Array.isArray(result) || result.length != 2) break;

    cursor = result[0];
    const keys = result[1];

    if (Array.isArray(keys) && keys.length > 0) {
      await client.unlink(keys);
    }
  } while (cursor !== '0');
};

/**
 * 
 * @param {*} key 
 */
async function popMinFromSortedSet(key) {
  if (!validate(client)) return null;

  const result = await client.zPopMin(key);

  return result ? result.value : null;
};

/**
 * 
 * @param {*} key
 * @param {*} member
 * Get the score associated with the given member in a sorted set.
 */
async function getScoreFromSortedSet(key, member) {
  if (!validate(client)) return null;
  member = member.toString();
  const value = await client.zScore(key, member);

  return value;
};


/**
 * 
 * @param {*} key 
 * @param {*} minScore 
 * @param {*} maxScore 
 * Return a range of members in a sorted set, by score.
 * @return {Promise}
 */
async function getRangeByScoreFromSortedSet(key, minScore, maxScore) {
  if (!validate(client)) return null;

  const value = await client.zRangeByScore(key, minScore, maxScore);

  return value;
};


/**
 * 
 * @param {*} key 
 * @param {*} member 
 * Remove member
 * @return {Promise}
 */
async function removeMemberFromSortedSet(key, member) {
  if (!validate(client)) return null;
  member = member.toString();
  const value = await client.zRem(key, member);

  return value;
};

/**
 * 
 * @param {*} key 
 * @param {*} value 
 * @param {*} score 
 * @return {Promise}
 */
async function addMemberIfNotExists(key, value, score) {
  if (!validate(client)) return null;

  const result = await client.zAdd(key, { score, value }, { 'NX': 1 });

  return result;
};

/**
 * Sets the specified field and values of the given key to the Hash
 * @param {*} key 
 * @param {*} fieldAndValues [feild1,value1,field2,value2]
 * @returns 
 */
async function hashSet(key, fieldAndValues) {
  if (!validate(client, key)) return null;
  const result = await client.HSET(key, fieldAndValues);
  return result;

}

/**
 * Gets the specified fields of the given key from the Hash
 * @param {*} key 
 * @param {*} fields  [feild1,field2]
 * @returns 
 */
async function hashGet(key, fields) {
  if (!validate(client, key)) return null;
  const result = await client.HMGET(key, fields);
  return result;
}

/**
 * 
 * @param {*} pattern 
 * @returns 
 */
async function findKeysByPattern(pattern) {
  const matchingKeys = [];
  let cursor = '0';

  do {
    const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern);
    matchingKeys.push(...keys);
    cursor = newCursor;
  } while (cursor !== '0');

  return matchingKeys;
}