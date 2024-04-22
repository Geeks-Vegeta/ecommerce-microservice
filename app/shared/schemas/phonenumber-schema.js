const mongoose = require("mongoose");

const phoneNumberSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      required: true,
      // You can add validation for country code, e.g., length or regex pattern
    },
    number: {
      type: String,
      required: true,
      // You can add validation for phone number format, e.g., regex pattern
    },
  },
  { _id: false }
);

module.exports = phoneNumberSchema;
