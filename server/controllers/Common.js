var ControllerMessages = require("./controllerMessages");
var Common = require("../utils/Common");
var helpers = require("../services/helper");
const upload = require("../services/helper/image-upload");
const answerVideo = upload.single("answer_video");

const commonController = {
// Booking type
addBookingType: async (req, res) => {
  let result = await Common.AddBookingType(req.body);
  return helpers.showOutput(res, result, result.code);
},

getBookingType: async (req, res) => {
  let result = await Common.getBookingType(req.body);
  return helpers.showOutput(res, result, result.code);
},

  // Vechile type
  all_vehicleType: async (req, res) => {
    let result = await Common.All_VehicleType(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  vehicleTypeId: async (req, res) => {
    let result = await Common.VehicleTypeId(req);
    return helpers.showOutput(res, result, result.code);
  },

  Add_VehicleType: async (req, res) => {
    let requiredFields = ["vehicle_Type", "daily", "weekly", "monthly"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Common.add_VehicleType(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  Update_VehicleType: async (req, res) => {
    let requiredFields = ["_id"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let result = await Common.update_VehicleType(req.body);
    return helpers.showOutput(res, result, result.code);
  },
  
  // Terms and privacy and how it works
  AddTermsContent: async (req, res) => {
    let result = await Common.AddTermsContent(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  getTermsContent: async (req, res) => {
    let result = await Common.getTermsContent(req.body);
    return helpers.showOutput(res, result, result.code);
  },

   // Faq Apis
   Addfaq: async (req, res) => {
    let requiredFields = ["question", "answer"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203 ); }
    let result = await Common.Addfaq(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  updatefaq: async (req, res) => {
    let requiredFields = ["_id", "question", "answer"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203 );
    }
    let result = await Common.updateFaq(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  deletefaq: async (req, res) => {
    let result = await Common.deleteFaq(req);
    return helpers.showOutput(res, result, result.code);
  },

  getAllfaq: async (req, res) => {
    let result = await Common.getAllfaq(req);
    return helpers.showOutput(res, result, result.code);
  },

  getVehicleData : async (req, res) => {
    let result = await Common.getVehicleData(req.body);
    return helpers.showOutput(res, result, result.code);
  },

  fireNotificationOnDailyEvents : async(req, res, next) => {
    let query = { booking_status : { $ne : 2 }, slot_type : 'daily', end_time : { $gte : new Date(Date.now() - 2 * 60 * 60 * 1000) } }
    let result = await Common.fireNotificationOnEvents(query);
    return helpers.showResponse(result.status, result.message, null, null, result.code);
  },

  fireNotificationOnUpcomingEvent : async() => {
    let query = { booking_status : { $ne : 2 }, start_time : { $lt : new Date(Date.now() - 30 * 60 * 1000) } }
    let result = await Common.fireNotificationOnEvents(query);
    return helpers.showResponse(result.status, result.message, null, null, result.code);
  },

  fireNotificationOnWeeklyAndMonthlyEvent : async() => {
    let query = { booking_status : { $ne : 2 }, start_time : { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }
    let result = await Common.fireNotificationOnEvents(query);
    return helpers.showResponse(result.status, result.message, null, null, result.code);
  },

  getUserNotifications : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let result = await Common.getUserNotifications(_id);
    return helpers.showOutput(res, result, result.code);
  }

};

module.exports = {
  ...commonController,
};