var mongoose = require("mongoose");
const { constValues } = require("../services/helper/constants");

const RatingAppSchema = mongoose.Schema(
  {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userSchema",
    },
    message: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 1,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("RatingApp", RatingAppSchema, "RatingApp");
