const Joi = require("joi");
const JoiOptions = require("../../../shared/joi/config.json");

/**
 *
 * @param {*} reqBody
 * @returns
 */
function validateRegister(reqBody) {
  const registerObj = Joi.object({
    email: Joi.string().email().label("email").required().messages({
      "string.base": `email must be a type of string`,
    }),
    password: Joi.string()
      .min(6)
      .max(20)
      .label("password")
      .required()
      .messages({
        "string.base": `password must be a type of string`,
        "string.min": `password should have minimum length of {#limit}`,
        "string.max": `password can not be more than {#limit}`,
      }),
  });

  return registerObj.validate(reqBody, JoiOptions);
}

/**
 *
 * @param {*} reqBody
 * @returns
 */
function validateLogin(reqBody) {
  const loginObj = Joi.object({
    email: Joi.string().email().label("email").required().messages({
      "string.base": `email must be a type of string`,
    }),
    password: Joi.string()
      .min(6)
      .max(20)
      .label("password")
      .required()
      .messages({
        "string.base": `password must be a type of string`,
        "string.min": `password should have minimum length of {#limit}`,
        "string.max": `password can not be more than {#limit}`,
      }),
  });

  return loginObj.validate(reqBody, JoiOptions);
}

module.exports = { validateRegister, validateLogin };