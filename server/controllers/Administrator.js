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
    let requiredFields = ['page', 'limit'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
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
  },

  contactToAdminByAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['email', 'message'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.contactToAdminByAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  addTruckMakeAndColorAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['type']; // truck_make -----> make,  and  truck_color -----> color
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    const { type } = req.body;
    if(type == 'truck_make'){
      requiredFields.push('make');
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
      
    }else if(type == 'truck_color'){
      requiredFields.push('color');
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
    }else{
      return helpers.showResponse(false, 'Invalid type', null, null, 200);
    }
    let result = await AdministrationUtils.addTruckMakeAndColorAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  deleteTruckMakeAndColor : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['type'];  // truck_make ----> make,  and truck_color ----> color
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    const { type } = req.body;
    if(type == 'truck_make'){
      requiredFields.push('make');
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
      
    }else if(type == 'truck_color'){
      requiredFields.push('color');
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
    }else{
      return helpers.showResponse(false, 'Invalid type', null, null, 200);
    }
    let result = await AdministrationUtils.deleteTruckMakeAndColor(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  updatePricesAndSlots : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['type'];  // prices and slot
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    const { type } = req.body;
    if(type == 'prices'){
      requiredFields.push('price');
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
      
    }else if(type == 'slots'){
      requiredFields.push('slot');
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
      }
    }else{
      return helpers.showResponse(false, 'Invalid type', null, null, 200);
    }
    let bodyData = typeof req.body == 'string' ? JSON.parse(req.body) : req.body;
    let result = await AdministrationUtils.updatePricesAndSlots(bodyData);
    return helpers.showOutput(res, result, result.code);
  },

  landingPageDataUpdate : async (req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.landingPageDataUpdate(req.body);
    return helpers.showOutput(res, result, result.code);
  }

};

module.exports = {
  ...adminController,
};