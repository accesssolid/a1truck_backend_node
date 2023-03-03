require("../../db_functions");
let Administration = require("../../models/Administration");
let ObjectId = require("mongodb").ObjectID;
var Messages = require("./messages");
let helpers = require("../../services/helper");
let jwt = require("jsonwebtoken");
let nodemailer = require("nodemailer");
let moment = require("moment");
let md5 = require("md5");
let FAQ = require("../../models/FAQ");
const { constValues, statusCodes } = require("../../services/helper/constants");

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
    }

}

module.exports = {
    ...adminUtils,
};
