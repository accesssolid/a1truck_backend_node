var ControllerMessages = require("./controllerMessages");
var Common = require("../utils/Common");
var helpers = require("../services/helper");
const upload = require("../services/helper/image-upload");
const answerVideo = upload.single("answer_video");
const moment = require('moment');

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
    const next120MinTime = moment().add(120, 'minutes').toDate();
    const next119MinTime = moment().add(119, 'minutes').toDate();
    let query = { 
      booking_status : { $ne : 2 }, 
      slot_type : 'daily', 
      $and: [{ end_time : { $gte : next119MinTime }}, { end_time: {$lte : next120MinTime } }]
    }
    let bookingData = {
      title : 'A1 Truck Booking',
      body : 'Your truck parking time is about to expire in next 2 hours'
    }
    let result = await Common.fireNotificationOnEvents(bookingData, query);
    return helpers.showResponse(result.status, result.message, null, null, result.code);
  },

  fireNotificationOnUpcomingEvent : async() => {
    const nextHalfHourTime = moment().add(30, 'minutes').toDate();
    const next29MinTime = moment().add(29, 'minutes').toDate();
    let query = { 
      booking_status : { $ne : 2 }, 
      $and: [{ start_time : { $gte : next29MinTime} }, { start_time : { $lte : nextHalfHourTime } }]
    }
    let bookingData = {
      title : 'A1 Truck Booking',
      body : 'You have an upcoming booking in 30 min, please pay attention'
    }
    let result = await Common.fireNotificationOnEvents(bookingData, query);
    return helpers.showResponse(result.status, result.message, null, null, result.code);
  },

  fireNotificationOnWeeklyAndMonthlyEvent : async() => {
    const next48HoursTime = moment().add(48, 'hours').toDate();
    const next47HoursTime = moment().add(47, 'hours').toDate();
    let query = {
      booking_status : { $ne : 2 },
      $or:[{
        slot_type : 'weekly'
      }, {
        slot_type : 'monthly'
      }], 
      $and: [{ end_time : { $gte : next47HoursTime }}, { end_time: {$lte : next48HoursTime } }]
    }
    let bookingData = {
      title : 'A1 Truck Booking',
      body : 'Your booking subscription is about to expire in next 2 days'
    }
    let result = await Common.fireNotificationOnEvents(bookingData, query);
    return helpers.showResponse(result.status, result.message, null, null, result.code);
  },

  getUserNotifications : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let result = await Common.getUserNotifications(_id);
    return helpers.showOutput(res, result, result.code);
  },

  isReadNotification : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let result = await Common.isReadNotification(_id);
    return helpers.showOutput(res, result, result.code);
  },

  enableDisableNotification : async(req, res, next) => {
    let _id = req.decoded._id;
    if(!_id){
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let requiredFields = ["noti_status"];   // 0 -> Disable and 1 -> Enable
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203 );
    }
    let result = await Common.enableDisableNotification(_id, req.body);
    return helpers.showOutput(res, result, result.code);
  }

};

module.exports = {
  ...commonController,
};