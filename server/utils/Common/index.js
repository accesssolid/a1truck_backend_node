require("../../db_functions");
let Common = require("../../models/CommonContent");
let VechileType = require("../../models/VehicleType");
let BookingType = require("../../models/Booking type");
let FAQ = require("../../models/FAQ");
let helpers = require("../../services/helper");
let moment = require("moment");
let ObjectId = require("mongodb").ObjectId;
const Message = require("../Administration/messages");
const { statusCodes, constValues } = require("../../services/helper/constants");
const commonUtil = {
//Booking type
AddBookingType: async (data) => {
  try {
    let response = await updateSingleData(BookingType, {}, data, { new: true, upsert: true, });
    if (response.status) {
      return helpers.showResponse( true, Message.UPDATED_SUCCESS, response.data, null, statusCodes.success );
    }
    return helpers.showResponse( false, response?.message, null, null, statusCodes.success );
  } catch (err) {
    return helpers.showResponse(false, err.message, null, null, 200);
  }
},
getBookingType: async (data) => {
  try {
    let response = await getSingleData(BookingType, {}, "-__v");
    if (response.status) {
      return helpers.showResponse( true, Message.DATA_FOUND_SUCCESS, response.data, null, statusCodes.success );
    }
    return helpers.showResponse( false, response?.message, null, null, statusCodes.success );
  } catch (err) {
    return helpers.showResponse(false, err.message, null, null, 200);
  }
},



// Vehicle Type add
VehicleTypeId: async (data) => {
  try {
    let { _id } = data?.params;

    if (!helpers.isValidId(_id)) {
      return helpers.showResponse( false, Message.NOT_VALIDID, null, null, statusCodes.success );
    }
    let response = await getSingleData(VechileType, {_id: ObjectId(_id),status: { $eq: 1 },}, "-__v",null,{createdAt:-1});
    if (response.status) {
      return helpers.showResponse( true, Message.DATA_FOUND_SUCCESS, response.data, null, statusCodes.success );
    }
    return helpers.showResponse( false, response?.message, null, null, statusCodes.success );
  } catch (err) {
    return helpers.showResponse(false, err.message, null, null, 200);
  }
},
All_VehicleType: async (data) => {
  try {

    let response = await getDataArray(VechileType, {status: { $eq: 1 },}, "-__v",null,{createdAt:-1});
    if (response.status) {
      return helpers.showResponse( true, Message.DATA_FOUND_SUCCESS, response.data, null, statusCodes.success );
    }
    return helpers.showResponse( false, response?.message, null, null, statusCodes.success );
  } catch (err) {
    return helpers.showResponse(false, err.message, null, null, 200);
  }
},

update_VehicleType:async(data)=>{
  try {

    let { _id,vehicle_Type } = data;

    if (!helpers.isValidId(_id)) {
      return helpers.showResponse( false, Message.NOT_VALIDID, null, null, statusCodes.success );
    }
    let checkVehicleExistance = await getSingleData( VechileType, { vehicle_Type, status: { $eq: 1 },_id:{$ne:ObjectId(_id)} }, "" );
    if (checkVehicleExistance.status) {
      return helpers.showResponse( false, Message.ALREADY_EXISTSTYPE, null, null, 200 );
    }
    let newObj = { ...data };
    delete newObj._id;
    let response = await updateData( VechileType, newObj, ObjectId(_id) );
    if (response.status) {
      return helpers.showResponse( true, Message.VEHICLE_UPDATED, response.data, null, 200 );
    }
    return helpers.showResponse( false, "Unable to update vehicle type at the moment", null, null, 200 );
  
  } catch (err) {
    return helpers.showResponse(false, err.message, null, null, 200);
  }
},
add_VehicleType:async(data)=>{
  try {

    let { vehicle_Type,price } = data;
    let checkVehicleExistance = await getSingleData( VechileType, { vehicle_Type, status: { $eq: 1 }, }, "" );
    if (checkVehicleExistance.status) {
      return helpers.showResponse( false, Message.ALREADY_EXISTSTYPE, null, null, 200 );
    }
    let newObj = { vehicle_Type,price };
    
    let vehRef = new VechileType(newObj);
    let result = await postData(vehRef);
    if (result.status) {
      return helpers.showResponse( true, Message.ADDED_NEWVEHICLE_TYPE, null, null, 200 );
    }
    return helpers.showResponse( false, Message.UNABLE_VEHICLE_TYPE, null, null, 200 );
  } catch (err) {
    return helpers.showResponse(false, err.message, null, null, 200);
  }
},


  // Terms and privacy and how its work 
  AddTermsContent: async (data) => {
    try {
      let response = await updateSingleData(Common, {}, data, { new: true, upsert: true, });
      if (response.status) {
        return helpers.showResponse( true, Message.UPDATED_SUCCESS, response.data, null, statusCodes.success );
      }
      return helpers.showResponse( false, response?.message, null, null, statusCodes.success );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  getTermsContent: async (data) => {
    try {
      let response = await getSingleData(Common, {}, "-__v");
      if (response.status) {
        return helpers.showResponse( true, Message.DATA_FOUND_SUCCESS, response.data, null, statusCodes.success );
      }
      return helpers.showResponse( false, response?.message, null, null, statusCodes.success );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  // FAQ
  Addfaq: async (data) => {
    try {
      const { question, answer } = data;
      let obj = { question: question, answer: answer, };
      let findfaq = await FAQ.aggregate([ { $match: { question: question, status: { $ne: constValues.faq_delete }, }, }, ]);
      if (findfaq.length > 0) {
        return helpers.showResponse( false, Message.QUESTION_EXITS, null, null, statusCodes.success );
      }
      let faqRef = new FAQ(obj);
      let result = await postData(faqRef);
      if (result.status) {
        return helpers.showResponse( true, Message.ADDED_SUCCESS, result?.data, null, statusCodes.createdsuccess );
      }
      return helpers.showResponse(false, result.message, null, null, 200);
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  updateFaq: async (data) => {
    try {
      const { _id, question, answer } = data;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse( false, Message.NOT_VALIDID, null, null, statusCodes.success );
      }
      let findfaq = await FAQ.aggregate([ { $match: { _id: { $ne: ObjectId(_id) }, question: question, status: { $ne: constValues.faq_delete }, }, }, ]);
      if (findfaq.length > 0) {
        return helpers.showResponse( false, Message.QUESTION_EXITS, null, null, statusCodes.success );
      }
      let updatedobj = { question: question, answer: answer, };
      let response = await updateData(FAQ, updatedobj, ObjectId(_id));
      if (response.status) {
        return helpers.showResponse( true, Message.UPDATED_SUCCESS, response.data, null, 200 );
      }
      return helpers.showResponse( false, Message.SOMETHING_WRONG, null, null, 200 );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  deleteFaq: async (data) => {
    try {
      const { _id } = data?.params;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse( false, Message.NOT_VALIDID, null, null, statusCodes.success );
      }
      let findfaq = await FAQ.aggregate([ { $match: { _id: ObjectId(_id), status: { $ne: constValues.faq_delete }, }, }, ]);
      if (findfaq.length < 1) {
        return helpers.showResponse( false, Message.NOT_FOUND, null, null, statusCodes.success );
      }
      let response = await updateData( FAQ, { status: constValues.faq_delete }, ObjectId(_id) );
      if (response.status) {
        return helpers.showResponse(true, Message.FAQ_DLETED, null, null, 200);
      }
      return helpers.showResponse( false, Message.SOMETHING_WRONG, null, null, 200 );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  getAllfaq: async (data) => {
    try {
      let result = await getDataArray( FAQ, { status: { $ne: constValues.vehicle_delete }, }, "-__v" );
      if (!result.status) {
        return helpers.showResponse(false, Message.NOT_FOUND, null, null, 200);
      }
      return helpers.showResponse( true, Message?.DATA_FOUND_SUCCESS, result?.data, null, 200 );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
};

module.exports = {
  ...commonUtil,
};
