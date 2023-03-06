var ControllerMessages = require("./controllerMessages");
var AdministrationUtils = require("../utils/Administration");
const helpers = require("../services/helper");
const upload = require("../services/helper/image-upload");
const singleUpload = upload.single("admin_profile");

const adminController = {
  login: async (req, res, next) => {
    let requiredFields = ['email', 'password'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.login(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  forgotPassword : async (req, res, next) => {
    let requiredFields = ['email'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.forgotPassword(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  verifyOtp: async (req, res) => {
    let requiredFields = ['otp', 'email'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.verifyOtp(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  resetPassword : async(req, res, next) => {
    let requiredFields = ['otp', 'email', 'password'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.resetPassword(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  logout : async(req, res, next) => {
    let requiredFields = ['admin_id'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.logout(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getAdminDetail : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getAdminDetail(admin_id);
    return helpers.showOutput(res, result, result.code);
  },

  addProfilePicture : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    singleUpload(req, res, async(err) => {
      if(!req.file || err){
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.NO_IMAGE), 203);
      }
      let fileName = req.file.filename;
      let result = await AdministrationUtils.addProfilePicture(fileName, admin_id);
      return helpers.showOutput(res, result, result.code);
    });
  },

  changePassword : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let requiredFields = ['old_password', 'new_password'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.changePassword(req.body, admin_id);
    return helpers.showOutput(res, result, result.code);
  },
  
  changeEmail : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let requiredFields = ['email'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.changeEmail(req.body, admin_id);
    return helpers.showOutput(res, result, result.code);
  },

  getAllUsersDetailsAdmin : async(req, res) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getAllUsersDetailsAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  deleteUserByAdmin : async(req, res) => {
    let admin_id = req.decoded.admin_id;
      if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
      }
      let requiredFields = ['user_id', 'type'];  // type :- 1.enable, 2.disable,  3.delete
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
    let result = await AdministrationUtils.deleteUserByAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getAdminDashboardCount : async(req, res) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getAdminDashboardCount(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getAllBookingsAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getAllBookingsAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getDashBoardData : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getDashBoardData(req.body);
    // return helpers.showOutput(res, result, result.code);
  }

};

module.exports = {
  ...adminController,
};
