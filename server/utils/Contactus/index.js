require("../../db_functions");
let ContactUs = require("../../models/Contactus");
let ObjectId = require("mongodb").ObjectID;
let helpers = require("../../services/helper");
let moment = require('moment-timezone');
const { constValues, statusCodes } = require("../../services/helper/constants");
const Messages = require("../Users/messages");
const CommonContent = require('../../models/CommonContent');
const Contact = require('../../models/Contactus');

const ContactUtils = {
  addcontact: async (data) => {
    try {
      const { name, email, message } = data;
      let isMailexist = await getSingleData(Contact, { email, status : { $eq : 1 }}, '');
      if(isMailexist.status){
        return helpers.showResponse(false, 'This email is already exist!!', null, null, 200);
      }
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

  servicesAndAmenities : async(data) => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "services_and_amenities");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  videoUploadAdmin : async(fileName) => {
    let updateObj = {
      video_link : fileName,
    }
    let response = await updateSingleData(CommonContent, {}, updateObj, { new : true });
    if (response.status) {
      return helpers.showResponse( true, 'Successfully updated video', null, null, 200);
    }
    return helpers.showResponse(false, err.message, null, null, 200);
  },

  getLandingPageVideo : async() => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "video_link");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  getWhyA1TruckParkingData : async() => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "why_truck_parking_data");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  aboutAndOwnersSaying : async(data) => {
    let { type } = data;
    if(type == 'owners'){
      let { owners_saying } = data;
      let response = await updateSingleData(CommonContent, {}, { owners_saying : owners_saying }, { new : true });
      if (response.status) {
        return helpers.showResponse( true, 'Successfully updated landing page data', null, null, 200);
      }
      return helpers.showResponse(false, 'Failed to updated landing page data', null, null, 200);
      
    }else if(type == 'about'){
      let { title, description } = data;
      let updateObj = {
        title,
        description
      }
      let response = await updateSingleData(CommonContent, {}, { about_truck_parking : updateObj }, { new : true });
      if (response.status) {
        return helpers.showResponse( true, 'Successfully updated landing page data', null, null, 200);
      }
      return helpers.showResponse(false, 'Failed to updated landing page data', null, null, 200);

    }else{
      return helpers.showResponse(false, 'Invalid type', null, null, 200);
    }
  },

  getAboutAndOwnersSayingData : async() => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "owners_saying");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  getLandingPageData : async() => {
    let result = await getDataArray(CommonContent, { status: { $ne: 2 }, }, "-how_working -privacy_policy -terms_condition -truck_colors -truck_makes -why_truck_parking");
    if(result.status){
      return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  },

  whyA1TruckAdmin : async(data) => {
    let { _id, title, caption, a1_image } = data;
    let query = { 'why_truck_parking_data.why_data._id' : ObjectId(_id) }
    let updateObj = {}
    if(title && title != ''){
      await updateByQuery(CommonContent, { 'why_truck_parking_data.title' : title }, {});
    }
    if(caption && caption != ''){
      updateObj['why_truck_parking_data.why_data.$.caption'] = caption;
    }
    if(a1_image && a1_image != ''){
      updateObj['why_truck_parking_data.why_data.$.a1_image'] = a1_image;
    }
    let updateResponse = await updateByQuery(CommonContent, updateObj, query);
    if(updateResponse.status){
      return helpers.showResponse( true, 'Successfully updated why a1_truck data', null, null, 200);
    }
    return helpers.showResponse(false, 'Server Error!!!, Failed to update why a1_truck data', null, null, 200);

  },

  addServicesAmenitiesIconAndCaption : async(data) => {
    let { content, icon } = data;
    let updateObj = {
      icon,
      content
    }
    let result = await pushAndUpdateMany(CommonContent, { services_and_amenities : updateObj }, {});
    if(result.status){
      return helpers.showResponse( true, 'successfully added service and amenities', null, null, 200);
    }
    return helpers.showResponse(false, 'Server Error!!, Failed to add service and amenities', null, null, 200);
  },

  updateServicesAndAmenities : async(data) => {
    let { _id, icon, content } = data;
    let query = { 'services_and_amenities._id' : ObjectId(_id) }
    let updateObj = {}
    if(icon && icon != ''){
      updateObj['services_and_amenities.$.icon'] = icon;
    }
    if(content && content != ''){
      updateObj['services_and_amenities.$.content'] = content;
    }
    let updateResponse = await updateByQuery(CommonContent, updateObj, query);
    if(updateResponse.status){
      return helpers.showResponse( true, 'Successfully updated services data', null, null, 200);
    }
    return helpers.showResponse(false, 'Server Error!!!, Failed to update services data', null, null, 200);
  },

  deleteServicesAndAmenities : async(data) => {
    let { _id } = data;
    let responseData = await CommonContent.updateMany({}, { $pull : { services_and_amenities : { _id : ObjectId(_id) } } });
    if(responseData){
      return helpers.showResponse( true, 'Successfully delete services data', null, null, 200);
    }
    return helpers.showResponse(false, 'Server Error!!!, Failed to delete services data', null, null, 200);
  }

}

module.exports = {
  ...ContactUtils,
};