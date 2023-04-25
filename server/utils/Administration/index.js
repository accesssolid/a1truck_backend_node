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
const { Console } = require("winston/lib/winston/transports");
const Contact = require('../../models/Contactus');
const fireBaseAdmin = require('../../services/helper/firebaseAdmin');
const AWS = require('aws-sdk'); 

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

    // forgotPassword : async(bodyData) => {
    //     const { email } =  bodyData;
    //     let query = { email : { $eq : email }, status : { $ne : 2 } }
    //     let result = await getSingleData(Administration, query, '');
    //     if(result.status){
    //         let { data } = result;
    //         let otp = helpers.randomStr(4, "1234567890");
    //         let dataObj = {
    //             otp,
    //             updated_on : moment().unix()
    //         }
    //         let response = await updateData(Administration, dataObj, ObjectId(data._id));
    //         if(response.status){
    //             // Forget-password email send to admin here
    //             try{
    //                 let transporter = nodemailer.createTransport({
    //                     host: 'smtp.gmail.com',
    //                     port: 587,
    //                     secure: false,
    //                     auth: {
    //                         user: process.env.APP_EMAIL,
    //                         pass: process.env.APP_PASSWORD
    //                     },
    //                 });
    //                 await transporter.sendMail({
    //                     from: process.env.APP_EMAIL,
    //                     to: email,
    //                     subject: 'Forgot password',
    //                     html: "<b>Greetings, </b><br /><br />Here is your 4 Digits reset password Code<br />" +
    //                         "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code for Authorization." +
    //                         "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>Frontier" +
    //                         "Community</label>",
    //                 });
    //                 return helpers.showResponse(true, 'Forgot Password Instruction has been sent to your Registered email', null, null, 200);

    //             }catch(error){
    //                 return helpers.showResponse(false, 'Unable to send email at the moment', null, null, 200);
    //             }
    //         }
    //         return helpers.showResponse(false, 'Internal Server Error!!', null, null, 200);
    //     }
    //     return helpers.showResponse(false, 'Mentioned email is not registered with us', null, null, 200);
    // },

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
                let html = "<b>Greetings, </b><br /><br />Here is your 4 Digits reset password Code<br />" +
                "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code for Authorization." +
                "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>Frontier" +
                "Community</label>"
                await helpers.sendEmailService(process.env.APP_EMAIL, email, 'Forgot password', html);
                return helpers.showResponse(true, 'Forgot Password Instruction has been sent to your Registered email', null, null, 200);
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

    updateProfile : async(bodyData, admin_id) => {
        let updateObj = {
            updated_on : moment().unix()
        }
        if (bodyData?.name && bodyData?.name !== '') {
            updateObj.name = bodyData.name;
        }
        if (bodyData?.email && bodyData?.email !== '') {
            updateObj.email = bodyData.email;
        }
        if (bodyData?.profile_pic && bodyData?.profile_pic !== '') {
            updateObj.profile_pic = bodyData.profile_pic;
        }
        let response = await updateData(Administration, updateObj, ObjectId(admin_id));
        if (!response.status) {
            return helpers.showResponse(false, "Error occured!!, profile update failed", null, null, 200);
        }
        let adminData = response.data;
        let newObj = {
            _id : adminData._id, name : adminData.name,
            email : adminData.email,
            profile_pic : adminData.profile_pic,
            status : adminData.status,
            created_on : adminData.created_on,
            updated_on : adminData.updated_on
        }
        return helpers.showResponse(true, "Admin Profile Update Success", newObj, null, 200);
    },

    getAllUsersDetailsAdmin : async(data) => {
        // const { page, limit, name, email } = data;
        // let currentPage = +(page ? page : 1);
        // let pageLimit = +(limit ? limit : 0);
        // let skip = (currentPage - 1) * pageLimit;
        // let paginate = {
            // skip,
            // limit : pageLimit * 1 || 0
        // }
        let query = { user_status : { $ne : 2 } }
        // if(name && name != '' && name != undefined){
            // paginate = null;
            // query.username = { $regex : new RegExp(`^${name}`), $options : 'i' }
        // }
        // if(email && email != '' && email != undefined){
            // paginate = null;
            // query.email = { $regex : new RegExp(`^${email}`), $options : 'i' }
        // }
        let sort = { createdAt : -1 }
        let result = await getDataArray(Users, query, '-password -otp -stripe_id', null, sort);
        if(result.status){
            let totalCount = result.data.length;
            return helpers.showResponse(true, 'Successfully fetched all users', result.data, totalCount, 200);
        }
        return helpers.showResponse(false, 'No Users Found', null, null, 200);
    },

    // getAllBookingsAdmin : async(data) => {
    //     const { time_zone, start_date, end_date } = data;
    //     let startTimeZone = moment(start_date, 'DD-MM-YYYY').tz(time_zone).format();
    //     let endTimeZone = moment(end_date, 'DD-MM-YYYY').tz(time_zone).format();
    //     let sort = { createdAt : -1 }
    //     let populate = [{
    //         path: 'vehicle_id'
    //     }]
    //     let result = await getDataArray(Bookings, { $and : [{ createdAt : { $gte : startTimeZone, $lte : endTimeZone } }] }, '-payment_object', null, sort, populate);
    //     if(result.status){
    //         let newData = result.data;
    //         let dataObj = newData.map(item => {
    //             return {
    //                 _id : item._id,
    //                 user_id : item.user_id,
    //                 start_time : moment(item.start_time).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A'),
    //                 end_time : moment(item.end_time).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A'),
    //                 slot_type : item.slot_type,
    //                 vehicle_type : item.vehicle_type,
    //                 vehicle_type_key : item.vehicle_type_key,
    //                 slot_number : item.slot_number,
    //                 booking_ref : item.booking_ref,
    //                 booking_status : item.booking_status,
    //                 time_zone : item.time_zone,
    //                 createdAt : moment(item.createdAt).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A'),
    //                 updatedAt  : moment(item.updatedAt).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A')
    //             }
    //         });
    //         let totalCount = dataObj.length;
    //         return helpers.showResponse(true, 'Successfully fetched bookings', dataObj, totalCount, 200);
    //     }
    //     return helpers.showResponse(false, 'Bookings not found', null, null, 200);
    // },

    getAllBookingsAdmin : async(data) => {
        let sort = { createdAt : -1 }
        let populate = [{
            path: 'vehicle_id'
        }]
        let result = await getDataArray(Bookings, {}, '-payment_object', null, sort, populate);
        if(result.status){
            let newData = result.data;
            let dataObj = newData.map(item => {
                return {
                    _id : item._id,
                    user_id : item.user_id,
                    start_time : moment(item.start_time).tz('America/New_York').format('YYYY-MM-DD hh:mm:ss A'),
                    end_time : moment(item.end_time).tz('America/New_York').format('YYYY-MM-DD hh:mm:ss A'),
                    slot_type : item.slot_type,
                    vehicle_type : item.vehicle_type,
                    vehicle_type_key : item.vehicle_type_key,
                    slot_number : item.slot_number,
                    booking_ref : item.booking_ref,
                    booking_status : item.booking_status,
                    time_zone : item.time_zone,
                    vehicle_id : item.vehicle_id,
                    createdAt : moment(item.createdAt).tz('America/New_York').format('YYYY-MM-DD hh:mm:ss A'),
                    updatedAt  : moment(item.updatedAt).tz('America/New_York').format('YYYY-MM-DD hh:mm:ss A')
                }
            });
            let totalCount = dataObj.length;
            return helpers.showResponse(true, 'Successfully fetched bookings', dataObj, totalCount, 200);
        }
        return helpers.showResponse(false, 'Bookings not found', null, null, 200);
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

        } else {
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

    // getDashBoardData : async(bodyData) => {
    //     const { date_time_type } = bodyData;
    //     let startOf = null;
    //     let endOf = null;
    //     if(date_time_type == 'day'){
    //         startOf = moment().startOf('day').format();
    //         endOf = moment().endOf('day').format();

    //     }else if(date_time_type == 'week'){
    //         startOf = moment().startOf('week').format();
    //         endOf = moment().endOf('week').format();

    //     }else if(date_time_type == 'month'){
    //         startOf = moment().startOf('month').format();
    //         endOf = moment().endOf('month').format();

    //     }else if(date_time_type == 'year'){
    //         startOf = moment().startOf('year').format();
    //         endOf = moment().endOf('year').format();

    //     }else if(date_time_type == 'max'){
    //         startOf = null;
    //         endOf = null;

    //     }else{
    //         return helpers.showResponse(false, 'Invalid date time', null, null, 200);
    //     }

    //     let bookingResult = null;
    //     if(date_time_type != 'max' && startOf != null && endOf != null){
    //         let startOfData = new Date(startOf);
    //         let endOfData = new Date(endOf);
    //         bookingResult = await Bookings.aggregate([
    //             { $match : { $and : [ { createdAt : { $gte : startOfData, $lte : endOfData } } ] } }
    //         ]);
    //     }else if(date_time_type == 'max' && startOf == null && endOf == null){
    //         bookingResult = await Bookings.find({});

    //     }else{
    //         return helpers.showResponse(false, 'Invalid date time', null, null, 200);
    //     }

    //     if(bookingResult != null && bookingResult.length != 0){
    //         let dailyRevenueArray = bookingResult.filter(item => item.slot_type == 'daily');
    //         let dailyRevenue = dailyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);
                
    //         let weeklyRevenueArray = bookingResult.filter(item => item.slot_type == 'weekly');
    //         let weeklyRevenue = weeklyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);

    //         let monthlyRevenueArray = bookingResult.filter(item => item.slot_type == 'monthly');
    //         let monthlyRevenue = monthlyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);

    //         let yearlyRevenueArray = bookingResult.filter(item => item.slot_type == 'yearly');
    //         let yearlyRevenue = yearlyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);

    //         let reservations = {
    //             daily_reservation : dailyRevenueArray.length,
    //             weekly_reservation : weeklyRevenueArray.length,
    //             monthly_reservation : monthlyRevenueArray.length,
    //             yearly_reservation : yearlyRevenueArray.length,
    //             total_reservation : dailyRevenueArray.length + weeklyRevenueArray.length + monthlyRevenueArray.length + yearlyRevenueArray.length
    //         }
    //         let earnings = {
    //             daily_earning : dailyRevenue != 0 ? dailyRevenue.toFixed(2) : 0,
    //             weekly_earning : weeklyRevenue != 0 ? weeklyRevenue.toFixed(2) : 0,
    //             monthly_earning : monthlyRevenue != 0 ? monthlyRevenue.toFixed(2) : 0,
    //             yearly_earning : yearlyRevenue != 0 ? yearlyRevenue.toFixed(2) : 0,
    //             total_earning : (0 + dailyRevenue + weeklyRevenue + monthlyRevenue + yearlyRevenue).toFixed(2)
    //         }
    //         let dataObject = {
    //             reservations,
    //             earnings
    //         }
    //         return helpers.showResponse(true, 'successfully fetched dashboard data', dataObject, null, 200);

    //     }else{
    //         return helpers.showResponse(false, 'Data not found', null, null, 200);
    //     }
        
    // },

    getDashBoardData : async(bodyData) => {
        const { start, end } = bodyData;
        let newStart = new Date(start)
        let newEnd = new Date(end)
        let bookingResult = await Bookings.aggregate([
            { $match : { $and : [ { createdAt : { $gte : newStart, $lte : newEnd } } ] } }
        ]);
        if(bookingResult.length != 0){
            // let dailyRevenueArray = bookingResult.filter(item => item.slot_type == 'daily');
            // let dailyRevenue = dailyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);
                
            // let weeklyRevenueArray = bookingResult.filter(item => item.slot_type == 'weekly');
            // let weeklyRevenue = weeklyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);

            // let monthlyRevenueArray = bookingResult.filter(item => item.slot_type == 'monthly');
            // let monthlyRevenue = monthlyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);

            // let yearlyRevenueArray = bookingResult.filter(item => item.slot_type == 'yearly');
            // let yearlyRevenue = yearlyRevenueArray.reduce((total, item) => total + (item.payment_object.amount / 100), 0);

            // let reservations = {
            //     daily_reservation : dailyRevenueArray.length,
            //     weekly_reservation : weeklyRevenueArray.length,
            //     monthly_reservation : monthlyRevenueArray.length,
            //     yearly_reservation : yearlyRevenueArray.length,
            //     total_reservation : dailyRevenueArray.length + weeklyRevenueArray.length + monthlyRevenueArray.length + yearlyRevenueArray.length
            // }
            // let earnings = {
            //     daily_earning : dailyRevenue != 0 ? dailyRevenue.toFixed(2) : 0,
            //     weekly_earning : weeklyRevenue != 0 ? weeklyRevenue.toFixed(2) : 0,
            //     monthly_earning : monthlyRevenue != 0 ? monthlyRevenue.toFixed(2) : 0,
            //     yearly_earning : yearlyRevenue != 0 ? yearlyRevenue.toFixed(2) : 0,
            //     total_earning : (0 + dailyRevenue + weeklyRevenue + monthlyRevenue + yearlyRevenue).toFixed(2)
            // }
            // let dataObject = {
            //     reservations,
            //     earnings
            // }
            return helpers.showResponse(true, 'successfully fetched dashboard data', bookingResult, null, 200);
        }
        return helpers.showResponse(false, 'Data not found', null, null, 200);
    },

    contactToUserByAdmin : async(data) => {
        let { email, message } = data;
        let response = await getSingleData(Contact, { email, status : { $eq : 1 } });
        if(response.status){
            let userName = response.data.name;
            await helpers.sendContactEmail({ name : userName, email, message })
            return helpers.showResponse(true, "Contact mail sent successfully", null, null, 200);
        }
        return helpers.showResponse(false, "Error Occured, try again", null, null, 200);
    },

    getContactUsAdmin : async(data) => {
        let sort = { createdAt : -1 }
        let result = await getDataArray(Contact, { status: { $ne: 2 }, }, '', null, sort, null);
        if(result.status){
            return helpers.showResponse(true, 'successfully fetched data', result.data, null, 200);
        }
        return helpers.showResponse(false, 'No data found', null, null, 200);
    },

    addTruckMakeAndColorAdmin : async(data) => {
        const { type, make, color } = data;
        if(type == 'truck_make'){
            let result = await pushAndUpdateMany(CommonContent, { truck_makes : make }, {});
            if(result.status){
                return helpers.showResponse(true, 'Successfully updated truck make', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

        }else if(type == 'truck_color'){
            let result = await pushAndUpdateMany(CommonContent, { truck_colors : color }, {});
            if(result.status){
                return helpers.showResponse(true, 'Successfully updated truck color', null, null, 200);
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
                return helpers.showResponse(true, 'Successfully delete truck make', null, null, 200);
            }
            return helpers.showResponse(false, 'Internal Server Error', null, null, 200);

        }else if(type == 'truck_color'){
            let result = await pullAndUpdateMany(CommonContent, { truck_colors : color }, {});
            if(result.status){
                return helpers.showResponse(true, 'Successfully delete truck color', null, null, 200);
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
                        yearly : item.monthly != '' ? Number(item.monthly * 11) : 0
                    }
                    let query = { _id : ObjectId(item._id), status : { $ne : 2 } }
                    response = await updateSingleData(VehicleType, query, { price : price }, { new: true });
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
                    response = await updateSingleData(VehicleType, query, { slots : item.slot_data }, { new: true });
                }
                if(response.status){
                    return helpers.showResponse(true, 'Successfully updated slots', null, null, 200);
                }
                return helpers.showResponse(false, 'Internal server error!!', null, null, 200);

        }else{
            return helpers.showResponse(false, 'Invalid type', null, null, 200);
        }

    },

    customNotification : async(bodyData) => {
        const { text } = bodyData;
        let result = await getDataArray(Users, { status : { $eq : 1 }, notification_status : { $ne : 0 } }, '-notification');
        if(result.status){
            let userData = result.data;
            let fcm_tokens = userData.map(item => item.fcm_token);
            let tokens = fcm_tokens.filter(item => item !== '' && fcm_tokens.indexOf(item) > -1);
            if(tokens?.length > 0){
                const message = {
                    tokens,
                    notification: {
                        title : 'A1 Truck Parking',
                        body : text,
                    },
                    data: {},
                    "apns": {
                    "headers": {
                        "apns-priority": "10"
                    },
                    "payload": {
                        "aps": {
                            "sound": "default"
                        }
                    }
                    },
                    contentAvailable: true,
                    priority: 'high',
                }
                let response = await fireBaseAdmin.messaging().sendMulticast(message);
                console.log(response);
            }
            return helpers.showResponse(true, 'Notification fired successfully', null, null, 200);
        }
        return helpers.showResponse(false, 'User not found', null, null, 200);
    },

    getPricesAndSlots : async() => {
        let query = { status : { $ne : 2 } }
        let result = await getDataArray(VehicleType, query, '');
        if(result.status){
            let vehicleTypeData = result.data;
            return helpers.showResponse(true, 'Vehicle type data fetched!!', vehicleTypeData, null, 200);
        }
        return helpers.showResponse(true, 'Server Error!! failed to fetch', null, null, 200);
    },

    getTruckMakeAndColor : async() => {
        let result = await getDataArray(CommonContent, {}, 'truck_makes truck_colors');
        if(result.status){
            let truckMakesData = result.data;
            return helpers.showResponse(true, 'Truck makes and truck color data fetched!!', truckMakesData, null, 200);
        }
        return helpers.showResponse(true, 'Server Error!! failed to fetch', null, null, 200);
    },

    exportBookingsDocument : async(bodyData) => {
        let { type } = bodyData;
        let bookingsResult = await adminUtils.getAllBookingsAdmin();
        if(!bookingsResult.status){
            return helpers.showResponse(false, 'No bookings Found', null, null, 200);
        }
        let bookingData = bookingsResult.data;
        if(type == 'pdf'){
            let excelResponse = await helpers.generatePdfUsersAndBookings(bookingData, 'bookings');
            if(excelResponse.status){
                return helpers.showResponse(true, 'Successfully generated bookings pdf', excelResponse.data, null, 200);
            }
            return helpers.showResponse(false, 'Error Occured!!, failed to generate pdf', null, null, 200);

        }else if(type == 'word'){
            let wordResponse = await helpers.generateWordUsersAndBookings(bookingData, 'bookings');
            if(wordResponse.status){
                return helpers.showResponse(true, 'Successfully generated bookings word file', wordResponse.data, null, 200);
            }
            return helpers.showResponse(false, 'Error Occured!!, failed to generate word file', null, null, 200);
            

        }else{
            return helpers.showResponse(false, 'Invalid type', null, null, 200);
        }
        
    },

    exportUsersDocument : async(bodyData) => {
        let { type } = bodyData;
        let usersResult = await adminUtils.getAllUsersDetailsAdmin();
        if(!usersResult.status){
            return helpers.showResponse(false, 'No users Found', null, null, 200);
        }
        let userData = usersResult.data;
        if(type == 'pdf'){
            let excelResponse = await helpers.generatePdfUsersAndBookings(userData, 'users');
            if(excelResponse.status){
                return helpers.showResponse(true, 'Successfully generated users pdf', excelResponse.data, null, 200);
            }
            return helpers.showResponse(false, 'Error Occured!!, failed to generate pdf', null, null, 200);

        }else if(type == 'word'){
            let wordResponse = await helpers.generateWordUsersAndBookings(userData, 'users');
            if(wordResponse.status){
                return helpers.showResponse(true, 'Successfully generated users word file', wordResponse.data, null, 200);
            }
            return helpers.showResponse(false, 'Error Occured!!, failed to generate word file', null, null, 200);
            

        }else{
            return helpers.showResponse(false, 'Invalid type', null, null, 200);
        }
        
    }

}

module.exports = {
    ...adminUtils,
};