var Contact = require("../utils/Contactus");
var helpers = require("../services/helper");
var ControllerMessage = require("./controllerMessages");

const ContactController = {
  addcontact: async (req, res) => {
    let requiredFields = [ "message" ];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput( res, helpers.showResponse(false, validator.message), 203 );
    }
    let result = await Contact.addcontact(req);
    return helpers.showOutput(res, result, result.code);
  },

 
};

module.exports = {
  ...ContactController,
};
