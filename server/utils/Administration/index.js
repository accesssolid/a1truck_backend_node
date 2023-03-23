require("../../db_functions");
let Administration = require("../../models/Administration");
let ObjectId = require("mongodb").ObjectID;
var Messages = require("./messages");
let helpers = require("../../services/helper");
let jwt = require("jsonwebtoken");
let nodemailer = require("nodemailer");
let moment = require('moment-timezone');
let md5 = require("md5");
let FAQ = require("../../models/FAQ");
let Users = require('../../models/Users');
let Bookings = require('../../models/Bookings');
const { constValues, statusCodes } = require("../../services/helper/constants");
const CommonContent = require('../../models/CommonContent');
const VehicleType = require('../../models/VehicleType');

const adminUtils = {
    login : async(bodyData) => {
        let { email, password } = bodyData;
        let query = { email, password: md5(password), status: { $ne : 2 } }
        let result = await getSingleData(Administration, query, '-password');
        if(result.status) {
            let { data } = result;
            let token = jwt.sign({ admin_id : data._id }, process.env.PRIVATE_KEY, {
                expiresIn : process.env.TOKEN_EXPIRE
            });
            let dataObject = { ...data._doc, token, time : process.env.TOKEN_EXPIRE }
            return helpers.showResponse(true, 'Successfully logged-In', dataObject, null, 200);
        }
        return helpers.showResponse(false, 'Invalid Credentials', null, null, 200);
    },

    forgotPassword : async(bodyData) => {
        const { email } =  bodyData;
        let query = { email : { $eq : email }, status : { $ne : 2 } }
        let result = await getSingleData(Administration, query, '');
        if(result.status){
            let { data } = result;
            let otp = helpers.randomStr(4, "1234567890");
            let dataObj = {
                otp,
                updated_on : moment().unix()
            }
            let response = await updateData(Administration, dataObj, ObjectId(data._id));
            if(response.status){
                // Forget-password email send to admin here
                try{
                    let transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: process.env.APP_EMAIL,
                            pass: process.env.APP_PASSWORD
                        },
                    });
                    await transporter.sendMail({
                        from: process.env.APP_EMAIL,
                        to: email,
                        subject: 'Forgot password',
                        html: "<b>Greetings, </b><br /><br />Here is your 4 Digits reset password Code<br />" +
                            "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code for Authorization." +
                            "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>Frontier" +
                            "Community</label>",
                    });
                    return helpers.showResponse(true, 'Forgot Password Instruction has been sent to your Registered email', null, null, 200);

                }catch(error){
                    return helpers.showResponse(false, 'Unable to send email at the moment', null, null, 200);
                }
            }
            return helpers.showResponse(false, 'Internal Server Error!!', null, null, 200);
        }
        return helpers.showResponse(false, 'Mentioned email is not registered with us', null, null, 200);
    },

    verifyOtp : async(bodyData) => {
        let { otp, email } = bodyData;
        let query = { email, otp, status : { $ne: 2 } }
        let result = await getSingleData(Administration, query, '');
        if (result.status) {
            return helpers.showResponse(true, 'Successfully Validated OTP', null, null, 200);
        }
        return helpers.showResponse(false, 'Failed to validate OTP', null, null, 200);
    },

    resetPassword : async(bodyData) => {
        let { otp, email, password } = bodyData;
        let query = { email, otp, status : { $eq : 1 } }
        let result = await getSingleData(Administration, query, '');
        if(result.status){
            let { data } = result;
            let updateObj = {
                otp : '',
                password : md5(password),
                updated_on : moment().unix()
            }
            let response = await updateData(Administration, updateObj, ObjectId(data._id));
            if (response.status) {
                return helpers.showResponse(true, 'Successfully changed password', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error!!', null, null, 200);
        }
        return helpers.showResponse(false, 'Failed to validate OTP', null, null, 200);
    },

    logout : async(bodyData) => {
        let { admin_id } = bodyData;
        let result = await getSingleData(Administration, { _id : ObjectId(admin_id) }, '');
        if (!result.status) {
            return helpers.showResponse(false, 'Invalid Admin Identifier', null, null, 200);
        }
        return helpers.showResponse(true, "Logout Success", null, null, 200);
    },

    getAdminDetail : async(admin_id) => {
        let query = { _id: ObjectId(admin_id), status : { $ne : 2 } }
        let result = await getSingleData(Administration, query, '-password -Fcm_token -otp');
        if (!result.status) {
            return helpers.showResponse(false, 'Invalid Admin Identifier', null, null, 200);
        }
        return helpers.showResponse(true, "Successfully fetched admin details", result.data, null, 200);
    },

    addProfilePicture : async(fileName, admin_id) => {
        let updateObj = {
            profile_pic : fileName,
            updated_on : moment().unix()
        }
        let response = await updateData(Administration, updateObj, ObjectId(admin_id));
        if (response.status) {
            let { data } = response;
            let responseData = { _id : data._id, profile_pic : data.profile_pic }
            return helpers.showResponse(true, 'Successfully Uploaded Profile Pic', responseData, null, 200);
        }
        return helpers.showResponse(false, 'Internal Server Error!!', null, null, 200);
    },

    changePassword : async(bodyData, admin_id) => {
        const { old_password, new_password } = bodyData;
        let query = { _id : ObjectId(admin_id), password: md5(old_password), status : { $ne : 2 } }
        let result = await getSingleData(Administration, query, '');
        if(result.status){
            let updateObj = {
                password : md5(new_password),
                updated_on : moment().unix()
            }
            let response = await updateData(Administration, updateObj, ObjectId(admin_id));
            if (response.status) {
                return helpers.showResponse(true, 'Successfully changed passwword', null, null, 200);
            }
            return helpers.showResponse(false, 'Failed to change password', null, null, 200);
        }
        return helpers.showResponse(false, 'Old password is invalid', null, null, 200);
    },

    changeEmail : async(bodyData, admin_id) => {
        const { email } = bodyData;
        let query = { email, status : { $ne : 2 } }
        let isEmailAlreadyRegistered = await getSingleData(Administration, query, '-otp');
        if(isEmailAlreadyRegistered.status){
            return helpers.showResponse(false, 'Email already exist, please use different email', null, null, 200);
        }
        let updateObj = {
            email,
            updated_on : moment().unix()
        }
        let response = await updateData(Administration, updateObj, ObjectId(admin_id));
        if (response.status) {
            return helpers.showResponse(true, 'Email Successfully changed', null, null, 200);
        }
        return helpers.showResponse(false, 'Failed to update email', null, null, 200);
    },

    getAllUsersDetailsAdmin : async(data) => {
        const { page, limit } = data;
        let currentPage = +(page ? page : 1);
        let pageLimit = +(limit ? limit : 0);
        let skip = (currentPage - 1) * pageLimit;
        let paginate = {
            skip,
            limit : pageLimit * 1 || 0
        }
        let query = { user_status : { $ne : 2 } }
        let sort = { createdAt : -1 }
        let result = await getDataArray(Users, query, '-password -otp -stripe_id', paginate, sort);
        if(result.status){
            totalCount = result.data.length;
            return helpers.showResponse(true, 'Successfully fetched all users', result.data, totalCount, 200);
        }
        return helpers.showResponse(false, 'No Users Found', null, null, 200);
    },

    deleteUserByAdmin : async(data) => {
    const{ user_id, type } = data;
    let query = { _id : ObjectId(user_id), user_status : { $ne : 2 } }
    let result = await getSingleData(Users, query, '-password -otp');
    if(result.status){
      let { data } = result;
      if(type == 'enable'){
        let response = await updateData(Users, { user_status : 1 }, ObjectId(data._id));
        if(response.status){
          return helpers.showResponse(true, 'Successfully enabled user account', null, null, 200);
        }
        return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

      }else if(type == 'disable'){
        let response = await updateData(Users, { user_status : 0 }, ObjectId(data._id));
        if(response.status){
          return helpers.showResponse(true, 'Successfully disabled user account', null, null, 200);
        }
        return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

      }else if(type == 'delete'){
        let response = await updateData(Users, { user_status : 2 }, ObjectId(data._id));
        if(response.status){
          return helpers.showResponse(true, 'Successfully deleted user account', null, null, 200);
        }
        return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

      }else{
        return helpers.showResponse(false, 'Invalid Type', null, null, 200);
      }
    }
    return helpers.showResponse(false, 'User not found', null, null, 200);
  },

  getAdminDashboardCount : async(data) => {
    let result1 = await getCount(Users, { user_status : { $eq : 1 } });
    let result2 = await getCount(Bookings, {});
    let dataArray = {
      user_count : result1.data,
      bookings_count : result2.data
    }
    return helpers.showResponse(true, 'List of dashboard data', dataArray, null, 200);
  },

    getAllBookingsAdmin : async(data) => {
        let populate = [{
        path: 'vehicle_id'
        }]
        let result = await getDataArray(Bookings, {}, '-payment_object', null, null, populate);
        if(result.status){
            let newData = result.data;
            return helpers.showResponse(true, 'Successfully fetched bookings', newData, null, 200);
        }
        return helpers.showResponse(false, 'Bookings not found', null, null, 200);
    },

    getDashBoardData : async(bodyData) => {
        const { date_time_type } = bodyData;
        let startOf = null;
        let endOf = null;
        if(date_time_type == 'day'){
            startOf = moment().startOf('day').format();
            endOf = moment().endOf('day').format();

        }else if(date_time_type == 'week'){
            startOf = moment().startOf('week').format();
            endOf = moment().endOf('week').format();

        }else if(date_time_type == 'month'){
            startOf = moment().startOf('month').format();
            endOf = moment().endOf('month').format();

        }else if(date_time_type == 'year'){
            startOf = moment().startOf('year').format();
            endOf = moment().endOf('year').format();

        }else{
            return helpers.showResponse(false, 'Invalid date time', null, null, 200);
        }

        if(startOf != null && endOf != null){
            let startOfData = new Date(startOf)
            let endOfData = new Date(endOf)
            let vehicleTypeResult = await getDataArray(VehicleType, { status : { $eq : 1 } }, '');
            if(vehicleTypeResult.status){
                let vehiclePriceData = vehicleTypeResult.data;
                let query =  { $and : [ { createdAt : { $gte : startOfData, $lte : endOfData } } ] }
                // let bookingResult = await getDataArray(Bookings, query, '-payment_object');
                // console.log(bookingResult)
                // if(bookingResult.status){
                //     let bookingData = bookingResult.data;
                //     let dailybookings = bookingData.filter(data => data.slot_type == 'daily');
                //     let weeklybookings = bookingData.filter(data => data.slot_type == 'weekly');
                //     let monthlybookings = bookingData.filter(data => data.slot_type == 'monthly');
                // }
                let bookingResult = await Bookings.aggregate([
                    { $match : { $and : [ { createdAt : { $gte : startOfData, $lte : endOfData } } ] } },
                    { $project : { payment_object : 0 } }
                ])
                console.log(bookingResult)
            }

        }
        
    },

  contactToAdminByAdmin : async(data) => {
    let { email, message } = data;
    let response = await getSingleData(Users, { email, status : { $ne : 2 } });
    if(response.status){
        try {
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.APP_EMAIL,
                    pass: process.env.APP_PASSWORD
                },
            });
            await transporter.sendMail({
                from : process.env.APP_EMAIL,
                to : email,
                    subject: 'Response from A1 Truck',
                    html: message,
                });
                return helpers.showResponse(true, "Email sent successfully", null, null, 200);
        
            } catch (err) {
                return helpers.showResponse(false, "Error Occured, try again", null, null, 200);
            }
        }
        return helpers.showResponse(false, 'Mentioned email is not registered with us', null, null, 200);
    },

    addTruckMakeAndColorAdmin : async(data) => {
        const { type, make, color } = data;
        if(type == 'truck_make'){
            let result = await pushAndUpdateMany(CommonContent, { truck_makes : make }, {});
            if(result.status){
                return helpers.showResponse(false, 'Successfully updated truck make', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

        }else if(type == 'truck_color'){
            let result = await pushAndUpdateMany(CommonContent, { truck_colors : color }, {});
            if(result.status){
                return helpers.showResponse(false, 'Successfully updated truck color', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

        }else{
            return helpers.showResponse(false, 'Invalid type', null, null, 200);
        }
    },

    deleteTruckMakeAndColor : async(data) => {
        const { type, make, color } = data;
        if(type == 'truck_make'){
            let result = await pullAndUpdateMany(CommonContent, { truck_makes : make }, {});
            if(result.status){
                return helpers.showResponse(false, 'Successfully delete truck make', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

        }else if(type == 'truck_color'){
            let result = await pullAndUpdateMany(CommonContent, { truck_colors : color }, {});
            if(result.status){
                return helpers.showResponse(false, 'Successfully delete truck color', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

        }else{
            return helpers.showResponse(false, 'Invalid type', null, null, 200);
        }
    },

    updatePricesAndSlots : async(data) => {
        // {
        //     "type" : "slots",
        //     "price" : [
        //       {
        //         "_id" : "6405d7e4f45db096bb204f17",
        //         "daily" : "300",
        //         "weekly" : "500",
        //         "monthly" : "450"
        //       }
        //     ]
        //   }
        // {
            // "type" : "slots",
            // "slot" : [
            //     {
            //       "_id" : "6405d7e4f45db096bb204f17",
            //       "slot_data" : "20"
            //     }
            //   ]
        // }
        const { type } = data;
        if(type == 'prices'){
            const { price } = data;
            let response = null;
                for(let item of price){
                    let price = {
                        daily : item.daily != '' ? item.daily : 0,
                        weekly : item.weekly!= '' ? item.weekly : 0,
                        monthly : item.monthly != '' ? item.monthly : 0,
                        half_yearly : item.monthly != '' ? Number(item.monthly * 5) : 0,
                        full_yearly : item.monthly != '' ? Number(item.monthly * 11) : 0
                    }
                    let query = { _id : ObjectId(item._id), status : { $ne : 2 } }
                    response = await updateSingleData(VehicleType, query, { price : price }, { new: true, upsert : true });
                }
                if(response.status){
                    return helpers.showResponse(true, 'Successfully updated prices', null, null, 200);
                }
                return helpers.showResponse(false, 'Internal server error!!', null, null, 200);

        }else if(type == 'slots'){
            const { slot } = data;
            let response = null;
                for(let item of slot){
                    let query = { _id : ObjectId(item._id), status : { $ne : 2 } }
                    response = await updateSingleData(VehicleType, query, { slots : item.slot_data }, { new: true, upsert : true });
                }
                if(response.status){
                    return helpers.showResponse(true, 'Successfully updated slots', null, null, 200);
                }
                return helpers.showResponse(false, 'Internal server error!!', null, null, 200);

        }else{
            return helpers.showResponse(false, 'Invalid type', null, null, 200);
        }

    },

    landingPageDataUpdate : async(data) => {
        let response = await updateSingleData(CommonContent, {}, data, { new: true, upsert: true, });
        if (response.status) {
            return helpers.showResponse( true, 'Successfully updated landing page data', null, null, 200);
        }
        return helpers.showResponse(false, err.message, null, null, 200);
    }

}

module.exports = {
    ...adminUtils,
};
