require("../../db_functions");
let ContactUs = require("../../models/Contactus");
let ObjectId = require("mongodb").ObjectID;
let helpers = require("../../services/helper");
let moment = require('moment-timezone');
const { constValues, statusCodes } = require("../../services/helper/constants");
const Messages = require("../Users/messages");
const CommonContent = require('../../models/CommonContent');

const ContactUtils = {
  addcontact: async (data) => {
    try {
      const { name, email, message } = data;
      let newObj = {
        name,
        email,
        message
      }
      let contactRef = new ContactUs(newObj);
      let result = await postData(contactRef);
      if (result.status) {
        return helpers.showResponse(true, Messages.CONTACT_SUCCESS, null, null, statusCodes.success);
      }
      return helpers.showResponse(false, Messages.CONTACT_FAIL, null, null, statusCodes.success);

    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  aboutUs : async(data) => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "about_truck_parking");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  whyA1Truck : async(data) => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "why_truck_parking");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  servicesAndAmenities : async(data) => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "services_and_amenities");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  }

};

module.exports = {
  ...ContactUtils,
};
