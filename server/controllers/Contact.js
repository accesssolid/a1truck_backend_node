var Contact = require("../utils/Contactus");
var helpers = require("../services/helper");
var ControllerMessage = require("./controllerMessages");
const s3_upload_single = require('../services/helper/image-uploadAWS').single('media_file');
const { videoUploadToS3 }  = require('../services/helper/image_convert');
const { convertImageToWebp } = require('../services/helper/image_convert');

const ContactController = {
  addcontact: async (req, res) => {
    let requiredFields = ["name", "email", "message"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Contact.addcontact(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  aboutUs : async(req, res) => {
    let result = await Contact.aboutUs(req);
    return helpers.showOutput(res, result, result.code);
  },
  
  servicesAndAmenities : async(req, res, next) => {
    let result = await Contact.servicesAndAmenities(req);
    return helpers.showOutput(res, result, result.code);
  },

  videoUploadAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    s3_upload_single(req, res, async(err) => {
        // if(!req.file || err){
        //     return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.NO_IMAGE), 203);
        // }
        let fileObj = req.file;
        let dataObj = {};
        if(fileObj){
          let uploadResponseFromAws = await videoUploadToS3(fileObj, fileObj.buffer);
          if(!uploadResponseFromAws.status){
            return helpers.showResponse(false, "AWS Error!!, Upload Failed", null, null, 200);
          }
          dataObj['media_file'] = uploadResponseFromAws.data.Key;
        }
        dataObj = { ...dataObj, ...req.body };
        let result = await Contact.videoUploadAdmin(dataObj);
        return helpers.showOutput(res, result, result.code);
    });
  },

  getLandingPageVideo : async(req, res, next) => {
    let result = await Contact.getLandingPageVideo();
    return helpers.showOutput(res, result, result.code);
  },

  getWhyA1TruckParkingData : async(req, res, next) => {
    let result = await Contact.getWhyA1TruckParkingData();
    return helpers.showOutput(res, result, result.code);
  },

  aboutAndOwnersSaying : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    let requiredFields = ["type"]; // owners and about
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Contact.aboutAndOwnersSaying(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getAboutAndOwnersSayingData : async(req, res, next) => {
    let result = await Contact.getAboutAndOwnersSayingData();
    return helpers.showOutput(res, result, result.code);
  },

  getLandingPageData : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    let result = await Contact.getLandingPageData();
    return helpers.showOutput(res, result, result.code);
  },

  whyA1TruckAdmin : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    s3_upload_single(req, res, async(err) => {
      let requiredFields = ["_id"];
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203);
      }
      let dataObj = {};
      if(req.file){
        let fileObj = req.file;
        let uploadResponseFromAws = await convertImageToWebp(fileObj);
        if(!uploadResponseFromAws.status){
          return helpers.showResponse(false, "AWS Error!!, Upload Failed", null, null, 200);
        } else {
          let fileName = uploadResponseFromAws.data.key;
          dataObj.a1_image = fileName;
        }
      }
      if(Object.keys(req.body).length !== 0){
        dataObj = { ...dataObj, ...req.body }
      }
      let result = await Contact.whyA1TruckAdmin(dataObj);
      return helpers.showOutput(res, result, result.code);
    });
  },

  addServicesAmenitiesIconAndCaption : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    s3_upload_single(req, res, async(err) => {
      if(!req.file || err){
        return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.NO_IMAGE), 203);
      }
      let requiredFields = ["content"];
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203);
      }
      let fileObj = req.file;
      let uploadResponseFromAws = await convertImageToWebp(fileObj);
      if(!uploadResponseFromAws.status){
        return helpers.showResponse(false, "AWS Error!!, Upload Failed", null, null, 200);
      }
      let fileName = uploadResponseFromAws.data.key;
      req.body.icon = fileName;
      let result = await Contact.addServicesAmenitiesIconAndCaption(req.body);
    return helpers.showOutput(res, result, result.code);
    });
  },

  updateServicesAndAmenities : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    s3_upload_single(req, res, async(err) => {
      let requiredFields = ["_id"];
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203);
      }
      let dataObj = {};
      if(req.file){
        let fileObj = req.file;
        let uploadResponseFromAws = await convertImageToWebp(fileObj);
        if(!uploadResponseFromAws.status){
          return helpers.showResponse(false, "AWS Error!!, Upload Failed", null, null, 200);
        } else {
          let fileName = uploadResponseFromAws.data.key;
          dataObj.icon = fileName;
        }
      }
      if(Object.keys(req.body).length !== 0){
        dataObj = { ...dataObj, ...req.body }
      }
      let result = await Contact.updateServicesAndAmenities(dataObj);
      return helpers.showOutput(res, result, result.code);
    });
  },

  deleteServicesAndAmenities : async(req, res, next) => {
    let admin_id = req.decoded.admin_id;
    if (!admin_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessage.INVALID_USER), 403);
    }
    let requiredFields = ["_id"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Contact.deleteServicesAndAmenities(req.body);
    return helpers.showOutput(res, result, result.code);
  }

}

module.exports = {
  ...ContactController,
};