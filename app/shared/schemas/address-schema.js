const mongoose = require('mongoose');
// const pointSchema = require('./location.schema');

const pointSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number, Number],
      default: [0, 0],
    },
  },
  { _id: false }
);

const addressSchema = mongoose.Schema(
  {
    addressLine1: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
      default: "",
    },
    location: {
      type: pointSchema,
      // default: () => ({}),
    },
  },{_id:false});

module.exports = {
  addressSchema,
  pointSchema
};
