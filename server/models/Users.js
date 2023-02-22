var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');
let moment=require("moment")
var Schema = mongoose.Schema;
var userSchema = new Schema({
    username: { type: String, default: "", },
    email: {
      type: String,
      default: "",
      trim: true,
     
      immutable: true,
      unique: true
    },
    phone_number: {
      type: String,
      default: "",
      immutable: true,
    
    },
    country_code: {
      type: String,
      default: "1",
    },
    password: {
      type: String,
      default: "",
    },
    fcm_token: {
      type: String,
      default: "",
    },
    google_id: {
      type: String,
      default: "",
    },
    auth_token: {
      type: String,
      default: "",
    },
    stripe_id: {
      type: String,
      default: "",
    },
    login_source: {
      type: String,
      default: "email",
      enum: ["email", "google", "apple"],
    },
    otp: {
      type: Number,
      default: 0,
    },
    is_verified: {
      type: Number,
      default: constValues.User_unverified,
    },
    user_status: {
      type: Number,
      default: constValues.user_active,
    },
    notification_status: {
      type: Number,
      default: constValues.notification_on,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

  } , { timestamps: true });

module.exports = mongoose.model('userSchema', userSchema, 'userSchema');