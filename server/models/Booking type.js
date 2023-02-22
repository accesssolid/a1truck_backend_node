var mongoose = require("mongoose");
const { constValues } = require("../services/helper/constants");

const BookingTypeSchema = mongoose.Schema(
  {
    weekly_price: {
      type: String,
      default: "",
    },
    monthly_price: {
      type: String,
      default: "",
    },
    daily_price: {
      type: String,
      default: "",
    },
   
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("BookingType", BookingTypeSchema, "bookingType");
