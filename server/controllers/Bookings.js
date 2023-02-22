var Bookings = require("../utils/Bookings");
var helpers = require("../services/helper");
var ControllerMessages = require("./controllerMessages");

const boookingsController = {

  checkSlotAvailabilty: async (req, res) => {
    let requiredFields = ["startTime", "endTime", "slot_type", "vehicle_type", "card_id", "vehicle_id"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(res, helpers.showResponse(false, validator.message), 203);
    }
    let user_id = req.decoded._id;
    if (!user_id) {
      return helpers.showOutput(res, helpers.showResponse(false, ControllerMessages.INVALID_USER), 403);
    }
    let result = await Bookings.checkSlotAvailabilty(req.body, user_id);
    return helpers.showOutput(res, result, result.code);
  }
};

module.exports = {
  ...boookingsController
};