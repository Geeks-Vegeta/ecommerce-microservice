const mongoose = require("mongoose");
const phoneNumberSchema = require("../schemas/phonenumber-schema");
const addressSchema = require("../schemas/address-schema");
const COLLECTIONS = require("../enums/collection-names");

const schema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    middleName: {
      type: String,
    },
    phone: {
      type: phoneNumberSchema,
    },
    altPhone: {
      type: phoneNumberSchema,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      minlength: 5,
      maxlength: 255,
    },
    currentAddress: {
      type: addressSchema,
    },
    permanentAddress: {
      type: addressSchema,
    },
    profilePic: {
      type: String,
    },
    createdAt: Number,
    updatedAt: Number,
  },
  { strict: false }
);

module.exports = mongoose.model(COLLECTIONS.USER, schema);
