var RatingApp = require("../utils/RatingApp");
var helpers = require("../services/helper");
var ControllerMessage = require("./controllerMessages");

const ratingAppController = {
  addrating: async (req, res) => {
    let requiredFields = [ "message","rating" ];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203 );
    }
    let result = await RatingApp.add_ratingApp(req);
    return helpers.showOutput(res, result, result.code);
  },
  getrating: async (req, res) => {
    let result = await RatingApp.getallrating(req);
    return helpers.showOutput(res, result, result.code);
  },

 
};

module.exports = {
  ...ratingAppController,
};
