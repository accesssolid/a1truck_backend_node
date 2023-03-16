var Users = require("../utils/Users");
var Stripcard = require("../utils/Cards");
var helpers = require("../services/helper");
var ControllerMessages = require("./controllerMessages");
const upload = require("../services/helper/image-upload");
const singleUpload = upload.single("user_profile");

const authController = {

  register: async (req, res) => {
    const { login_source } = req.body;
    let requiredFields = ["login_source"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let requiredFieldsauth = [];
    if (login_source == "email") {
      requiredFieldsauth = [
        "username",
        "email",
        "password",
        "phone_number",
        "country_code",
        "login_source",
      ];
    }
    if (login_source == "apple") {
      requiredFieldsauth = ["auth_token", "login_source"];
    }
    if (login_source == "google") {
      requiredFieldsauth = ["username", "email", "google_id", "login_source"];
    }
    let validatorauth = helpers.validateParams(req, requiredFieldsauth);
    if (!validatorauth.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validatorauth.message),
        203
      );
    }
    let result = await Users.register(req.body);
    return helpers.showOutput(res, result, result?.code);
  },

  login: async (req, res) => {
    let requiredFields = ["email", "password", "fcm_token"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Users.login(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  Otp_verification: async (req, res) => {
    let requiredFields = ["UserId", "otp"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Users.otp_verification(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  forgot_pass: async (req, res) => {
    let requiredFields = ["country_code", "phone_number"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Users.forgot_pass(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  new_password: async (req, res) => {
    let requiredFields = ["UserId", "new_password"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Users.new_password(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  resend_otp: async (req, res) => {
    let requiredFields = ["country_code", "phone_number"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Users.resend_otp(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  user_profile: async (req, res) => {
    let result = await Users.user_profile(req);
    return helpers.showOutput(res, result, result.code);
  },

  user_Updateprofile: async (req, res) => {
    let result = await Users.profile_update(req);
    return helpers.showOutput(res, result, result.code);
  },

  delete_account: async (req, res) => {
    let result = await Users.Delete_account(req);

    return helpers.showOutput(res, result, result.code);
  },

  change_pass: async (req, res) => {
    let requiredFields = ["current_password", "new_password"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Users.Change_pass(req);
    return helpers.showOutput(res, result, result.code);
  },

  addCard: async (req, res) => {
    let requiredFields = ["token"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Stripcard.addCard(req);
    console.log(result);
    return helpers.showOutput(res, result, result.code);
  },
  
  listCards: async (req, res) => {
    let result = await Stripcard.listCards(req);
    console.log(result);
    return helpers.showOutput(res, result, result.code);
  },

  updateCustomer: async (req, res) => {
    let requiredFields = ["default_source"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Stripcard.updateCustomer(req);
    console.log(result);
    return helpers.showOutput(res, result, result.code);
  },

  deleteCard: async (req, res) => {
    let requiredFields = ["card_id"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Stripcard.deleteCard(req);
    console.log(result);
    return helpers.showOutput(res, result, result.code);
  },

  createCardToken : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let result = await Stripcard.createCardToken(req);
    return helpers.showOutput(res, result, result.code);
  },

  changeEmailSendOtp : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let requiredFields = ["phone_no"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }    
    let result = await Stripcard.changeEmailSendOtp(_id, req.body);
    return helpers.showOutput(res, result, result.code);
  },

  changePhoneNoVerifyOtp : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let requiredFields = ["otp"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Stripcard.changePhoneNoVerifyOtp(_id, req.body);
    return helpers.showOutput(res, result, result.code);
  }

}

module.exports = {
  ...authController,
};
