var ControllerMessages = require("./controllerMessages");
var AdministrationUtils = require("../utils/Administration");
const helpers = require("../services/helper");
const upload = require("../services/helper/image-upload");
const singleUpload = upload.single("admin_profile");
const s3_upload = require('../services/helper/image-uploadAWS').single('admin_profile');
const { convertImageToWebp } = require('../services/helper/image_convert');

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
    s3_upload(req, res, async(err) => {
        if(!req.file || err){
            return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.NO_IMAGE), 203);
        }
        let fileObj = req.file;
        let uploadResponseFromAws = await convertImageToWebp(fileObj);
        if(!uploadResponseFromAws.status){
          return helpers.showResponse(false, "AWS Error!!, Upload Failed", null, null, 200);
        }
        let fileName = uploadResponseFromAws.data.key;
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

  updateProfile : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    s3_upload(req, res, async(err) => {
      let dataObj = {};
      if(req.file){
        let fileObj = req.file;
        let uploadResponseFromAws = await convertImageToWebp(fileObj);
        if(!uploadResponseFromAws.status){
          return helpers.showResponse(false, "AWS Error!!, Upload Failed", null, null, 200);
        } else {
          let fileName = uploadResponseFromAws.data.key; 
          dataObj.profile_pic = fileName;
        }
      }
      if(Object.keys(req.body).length !== 0){
        dataObj = { ...dataObj, ...req.body }
      }
      let result = await AdministrationUtils.updateProfile(dataObj, admin_id);
      return helpers.showOutput(res, result, result.code);
    });
  },

  getAllUsersDetailsAdmin : async(req, res) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    // let requiredFields = ['page', 'limit'];
    // let validator = helpers.validateParams(req, requiredFields);
    // if (!validator.status) {
    //   return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    // }
    let result = await AdministrationUtils.getAllUsersDetailsAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  // getAllBookingsAdmin : async(req, res, next) => {
  //   let admin_id = req.decoded.admin_id;
  //   if (!admin_id) {
  //     return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
  //   }
  //   let requiredFields = ['time_zone', 'start_date', 'end_date'];  // according to time_zone.
  //     let validator = helpers.validateParams(req, requiredFields);
  //     if (!validator.status) {
  //       return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
  //     }
  //   let result = await AdministrationUtils.getAllBookingsAdmin(req.body);
  //   return helpers.showOutput(res, result, result.code);
  // },
  
  getAllBookingsAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getAllBookingsAdmin(req.body);
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

  // getDashBoardData : async(req, res, next) => {
  //   let admin_id = req.decoded.admin_id;
  //   if (!admin_id) {
  //     return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
  //   }
  //   let requiredFields = ['date_time_type'];  // day, week, month, year, max --> no need to pass date_time
  //   let validator = helpers.validateParams(req, requiredFields);
  //   if (!validator.status) {
  //     return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
  //   }
  //   let result = await AdministrationUtils.getDashBoardData(req.body);
  //   return helpers.showOutput(res, result, result.code);
  // },

  getDashBoardData : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['start', 'end'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.getDashBoardData(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  contactToUserByAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['email', 'message'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.contactToUserByAdmin(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getContactUsAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getContactUsAdmin(req.body);
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

  customNotification : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['text'];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.customNotification(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getPricesAndSlots : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getPricesAndSlots(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getTruckMakeAndColor : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let result = await AdministrationUtils.getTruckMakeAndColor();
    return helpers.showOutput(res, result, result.code);
  },

  exportBookingsDocument : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['type']; // pdf and word
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.exportBookingsDocument(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  exportUsersDocument : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_ADMIN), 403);
    }
    let requiredFields = ['type']; // pdf and word
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await AdministrationUtils.exportUsersDocument(req.body);
    // return helpers.showOutput(res, result, result.code);
  }

};

module.exports = {
  ...adminController,
};