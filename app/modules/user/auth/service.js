const User = require("../../../shared/models/user");

module.exports={
    isUserExists,
    create
}

/**
 * 
 * @param {*} email 
 */
async function isUserExists(email){
    return  await User.findOne({email:email});
}

async function create(reqBody){
   return await User.create(reqBody);
}