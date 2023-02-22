require("../../db_functions");
let ContactUs = require("../../models/Contactus");
let ObjectId = require("mongodb").ObjectID;
let helpers = require("../../services/helper");
let moment = require("moment");
const { constValues, statusCodes } = require("../../services/helper/constants");
const Messages = require("../Users/messages");

const ContactUtils = {
  addcontact: async (data) => {
    try {
      let { _id } = data?.decoded;
      const { message } = data?.body;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let newObj = { message: message, created_by: _id };
  
      let vehRef = new ContactUs(newObj);
      let result = await postData(vehRef);
      if (result.status) {
        return helpers.showResponse(
          true,
         Messages.CONTACT_SUCCESS,
          null,
          null,
          statusCodes.success
        );
      }
      return helpers.showResponse(
        false,
        Messages.CONTACT_FAIL,
        null,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },


};

module.exports = {
  ...ContactUtils,
};
