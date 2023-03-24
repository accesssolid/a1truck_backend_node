var Contact = require("../utils/Contactus");
var helpers = require("../services/helper");
var ControllerMessage = require("./controllerMessages");

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

  whyA1Truck : async(req, res, next) => {
    let result = await Contact.whyA1Truck(req);
    return helpers.showOutput(res, result, result.code);
  },
  
  servicesAndAmenities : async(req, res, next) => {
    let result = await Contact.servicesAndAmenities(req);
    return helpers.showOutput(res, result, result.code);
  }

}

module.exports = {
  ...ContactController,
};
