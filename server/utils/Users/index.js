require("../../db_functions");
let md5 = require("md5");
let Users = require("../../models/Users");
let Bookings = require("../../models/Bookings");
let ObjectId = require("mongodb").ObjectID;
var Messages = require("./messages");
let jwt = require("jsonwebtoken");
let helpers = require("../../services/helper");
let moment = require("moment-timezone");
let nodemailer = require("nodemailer");
let { constValues, statusCodes } = require("../../services/helper/constants");
const stripe = require("stripe")(process.env.Stripe_Secret_Key);

let UserUtils = {
  login: async (data) => {
    try {
      let { email, password, fcm_token } = data;
      let query1 = [
        {
          $match: {
            email: email,
            password: md5(password),
            user_status: { $ne: constValues.user_delete },
            is_verified: { $ne: constValues.User_unverified },
          },
        },
        { $project: { otp: 0, __v: 0 } },
      ];
      let result = await UserUtils.getUserDetail(query1);
      if (!result.status) {
        return helpers.showResponse(
          false,
          Messages.INVALID_CERD,
          null,
          null,
          result?.code
        );
      }
      let updatefcm = await updateData(
        Users,
        { fcm_token: fcm_token },
        ObjectId(result?.data?._id)
      );
      if (!updatefcm.status) {
        return helpers.showResponse(
          false,
          Messages.FAIL_FCMUPDATE,
          null,
          null,
          statusCodes.success
        );
      }
      // generate token
      let token = jwt.sign(
        { email: result?.data?.email, _id: result?.data?._id },
        process.env.PRIVATE_KEY,
        { expiresIn: process.env.TOKEN_EXPIRE }
      );
      if (!token) {
        return helpers.showResponse(
          false,
          err.message,
          null,
          null,
          statusCodes.success
        );
      }
      //Get updated data
      let query = {
        _id: ObjectId(result?.data?._id),
        user_status: { $ne: constValues.user_delete },
      };
      let feilds = "-otp -__v";
      let newupdateddata = await getSingleData(Users, query, feilds);
      return helpers.showResponse(
        true,
        Messages.LOGIN_SUCCESS,
        newupdateddata?.data,
        { token: token },
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  otp_verification: async (data) => {
    try {
      let { UserId, otp } = data;
      if (!helpers.isValidId(UserId)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let query = [
        {
          $match: {
            _id: ObjectId(UserId),
            user_status: { $ne: constValues.user_delete },
          },
        },
        { $project: { otp: 1, user_status: 1 } },
      ];
      let result = await UserUtils.getUserDetail(query);
      if (!result.status) {
        return helpers.showResponse(
          false,
          result.message,
          null,
          null,
          result?.code
        );
      }
      if (result?.data?.otp != otp) {
        return helpers.showResponse(
          false,
          Messages.INVALID_OTP,
          null,
          null,
          statusCodes.success
        );
      }
      let updatefcm = await updateData(
        Users,
        { is_verified: constValues.User_verified },
        ObjectId(UserId)
      );
      if (!updatefcm.status) {
        return helpers.showResponse(
          false,
          Messages.FAIL_FCMUPDATE,
          null,
          null,
          statusCodes.success
        );
      }
      await UserUtils.createAccount(UserId);
      return helpers.showResponse(
        true,
        Messages.OTP_VERIFY,
        updatefcm?.data,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  register: async (data) => {
    try {
      let { username, email, phone_number, country_code, password, fcm_token, login_source, google_id, auth_token } = data;
      // email signup
      if (login_source == "email") {
        let otp = helpers.randomStr(4, "1234567890");
        let finduser = await Users.aggregate([
          {
            $match: {
              $or: [
                { username: username },
                { email: email },
                { phone_number: phone_number },
              ],
              user_status: { $ne: constValues.user_delete },
            },
          },
        ]);
        if ( finduser.length > 0 && finduser[0]?.is_verified == constValues.User_verified) {
          let resmessage;
          if (finduser[0]?.username == username) {
            resmessage = Messages.USER_NAME_EXISTS;
          } else if (finduser[0]?.email == email) {
            resmessage = Messages.ALREADY_EXISTS;
          } else if (finduser[0]?.phone_number == phone_number) {
            resmessage = Messages.PHONE_NUMBER_EXISTS;
          }
          return helpers.showResponse(
            false,
            resmessage,
            null,
            null,
            statusCodes.success
          );
        }
        //Delete all similar unverified users
        if (
          finduser.length > 0 &&
          finduser[0]?.is_verified == constValues.User_unverified
        ) {
          let allids = finduser.map((i) => i?._id);
          let query = { _id: { $in: allids } };
          await deleteData(Users, query);
        }
        //Fresh new user
        let obj = {
          username,
          email: email?.toLocaleLowerCase()?.replace(/ /g, ""),
          phone_number,
          country_code,
          password: md5(password),
          fcm_token,
          login_source,
          otp,
        };
        let user = new Users(obj);
        let result = await postData(user);
        // await helpers.sendSMSService(phone_number, `Here is your 4 digit verification code : ${otp}`);
        let html = "<b>Greetings, </b><br /><br />Here is your 4 Digits registration Code<br />" +
          "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code for Authorization." +
          "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>A1 Truck" +
          "Community</label>"
        await helpers.sendEmailService(process.env.APP_EMAIL, email, 'User Registration', html);
        let token = jwt.sign( { email: result?.data?.email, _id: result?.data?._id }, process.env.PRIVATE_KEY, { expiresIn: process.env.TOKEN_EXPIRE });
        if (!token) {
          return helpers.showResponse(false, "Token not generated", null, null, statusCodes.success);
        }
        if (result?.status) {
          return helpers.showResponse(true, Messages.SEND_OTP, result?.data, { token: token }, statusCodes.createdsuccess);
        }
      }
      // apple signup
      if (login_source == "apple") {
        let finduser = await Users.aggregate([
          {
            $match: {
              auth_token: auth_token,
              user_status: { $ne: constValues.user_delete },
            },
          },
        ]);
        if (finduser.length > 0) {
          // user already exits
          let updatefcm = await updateData(
            Users,
            { fcm_token: fcm_token },
            ObjectId(finduser[0]?._id)
          );
          if (!updatefcm.status) {
            return helpers.showResponse(
              false,
              Messages.FAIL_FCMUPDATE,
              null,
              null,
              statusCodes.success
            );
          }
          //generate Token
          await UserUtils.createAccount(finduser[0]?._id);
          let token = jwt.sign(
            { email: finduser[0]?.email, _id: finduser[0]?._id },
            process.env.PRIVATE_KEY,
            { expiresIn: process.env.TOKEN_EXPIRE }
          );
          if (!token) {
            return helpers.showResponse(
              false,
              "Token not generated",
              null,
              null,
              statusCodes.success
            );
          }
          let query = {
            _id: ObjectId(finduser[0]?._id),
            user_status: { $ne: constValues.user_delete },
          };
          let feilds = "-otp -__v";
          let newupdateddata = await getSingleData(Users, query, feilds);
          return helpers.showResponse(
            true,
            Messages.LOGIN_SUCCESS,
            newupdateddata?.data,
            { token: token },
            statusCodes.success
          );
        } else {
          // new apple user
          let obj = {
            fcm_token: fcm_token,
            login_source: login_source,
            auth_token: auth_token,
            is_verified: constValues.User_verified,
          };
          if (username) {
            obj.username = username;
          }
          if (email) {
            obj.email = email?.toLocaleLowerCase()?.replace(/ /g, "");
          }
          let user = new Users(obj);
          let result = await postData(user);
          if (!result.status) {
            return helpers.showResponse(
              false,
              result.message,
              null,
              null,
              statusCodes.success
            );
          }
          let updatefcm = await updateData(
            Users,
            { fcm_token: fcm_token },
            ObjectId(result?.data?._id)
          );
          if (!updatefcm.status) {
            return helpers.showResponse(
              false,
              Messages.FAIL_FCMUPDATE,
              null,
              null,
              statusCodes.success
            );
          }
          await UserUtils.createAccount(result?.data?._id);
          // generate token
          let token = jwt.sign(
            { email: result?.data?.email, _id: result?.data?._id },
            process.env.PRIVATE_KEY,
            { expiresIn: process.env.TOKEN_EXPIRE }
          );
          if (!token) {
            return helpers.showResponse(
              false,
              err.message,
              null,
              null,
              statusCodes.success
            );
          }
          //Get updated data
          let query = {
            _id: ObjectId(result?.data?._id),
            user_status: { $ne: constValues.user_delete },
          };
          let feilds = "-otp -__v";
          let newupdateddata = await getSingleData(Users, query, feilds);
          return helpers.showResponse(
            true,
            Messages.REGESTERED_SUCCESS,
            newupdateddata?.data,
            { token: token },
            statusCodes.success
          );
        }
      }
      // google login/signup
      if (login_source == "google") {
        let finduser = await Users.aggregate([
          {
            $match: {
              $or: [{ username: username }, { email: email }],
              user_status: { $ne: constValues.user_delete },
            },
          },
        ]);
        if (finduser.length > 0) {
          // user already exits
          let updatefcm = await updateData(
            Users,
            { fcm_token: fcm_token },
            ObjectId(finduser[0]?._id)
          );
          if (!updatefcm.status) {
            return helpers.showResponse(
              false,
              Messages.FAIL_FCMUPDATE,
              null,
              null,
              statusCodes.success
            );
          }
          //generate Token
          await UserUtils.createAccount(finduser[0]?._id);
          let token = jwt.sign(
            { email: finduser[0]?.email, _id: finduser[0]?._id },
            process.env.PRIVATE_KEY,
            { expiresIn: process.env.TOKEN_EXPIRE }
          );
          if (!token) {
            return helpers.showResponse(
              false,
              "Token not generated",
              null,
              null,
              statusCodes.success
            );
          }
          let query = {
            _id: ObjectId(finduser[0]?._id),
            user_status: { $ne: constValues.user_delete },
          };
          let feilds = "-otp -__v";
          //Get updated data
          let newupdateddata = await getSingleData(Users, query, feilds);
          return helpers.showResponse(
            true,
            Messages.LOGIN_SUCCESS,
            newupdateddata?.data,
            { token: token },
            statusCodes.success
          );
        } else {
          // new google user
          let obj = {
            username,
            email: email?.toLocaleLowerCase()?.replace(/ /g, ""),
            fcm_token,
            login_source,
            google_id,
            is_verified: constValues.User_verified,
          };
          let user = new Users(obj);

          let result = await postData(user);
          if (!result.status) {
            return helpers.showResponse(
              false,
              result.message,
              null,
              null,
              statusCodes.success
            );
          }
          let updatefcm = await updateData(
            Users,
            { fcm_token: fcm_token },
            ObjectId(result?.data?._id)
          );

          if (!updatefcm.status) {
            return helpers.showResponse(
              false,
              Messages.FAIL_FCMUPDATE,
              null,
              null,
              statusCodes.success
            );
          }
          // generate token
          await UserUtils.createAccount(result?.data?._id);
          let token = jwt.sign(
            { email: result?.data?.email, _id: result?.data?._id },
            process.env.PRIVATE_KEY,
            { expiresIn: process.env.TOKEN_EXPIRE }
          );
          if (!token) {
            return helpers.showResponse(
              false,
              err.message,
              null,
              null,
              statusCodes.success
            );
          }
          //Get updated data
          let query = {
            _id: ObjectId(result?.data?._id),
            user_status: { $ne: constValues.user_delete },
          };
          let feilds = "-otp -__v";
          let newupdateddata = await getSingleData(Users, query, feilds);
          return helpers.showResponse(
            true,
            Messages.REGESTERED_SUCCESS,
            newupdateddata?.data,
            { token: token },
            statusCodes.success
          );
        }
      }
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  forgot_pass: async (data) => {
    try {
      // let { country_code, phone_number } = data;
      let { country_code, email } = data;
      let otp = helpers.randomStr(4, "1234567890");
      let query = [
        {
          $match: {
            email : email,
            country_code: country_code,
            is_verified: { $ne: constValues.User_unverified },
            user_status: { $ne: constValues.user_delete },
          },
        },
        { $project: { otp: 0, __v: 0 } },
      ];
      {
      }

      let result = await UserUtils.getUserDetail(query);
      if (!result.status) {
        return helpers.showResponse(
          false,
          result.message,
          null,
          null,
          result?.code
        );
      }
      // await helpers.sendSMSService(phone_number, `here is your 4 digit forget password instruction : ${otp}`);
      let html = "<b>Greetings, </b><br /><br />Here is your 4 Digits Reset Password Instructions<br />" +
          "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code to reset your password." +
          "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>A1 Truck" +
          "Community</label>"
      await helpers.sendEmailService(process.env.APP_EMAIL, email, 'Forget Password', html);
      return helpers.showResponse(
        true,
        Messages.SEND_OTP_EMAIL,
        result.data,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  new_password: async (data) => {
    try {
      let { new_password, UserId } = data;

      if (!helpers.isValidId(UserId)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let query = [
        {
          $match: {
            _id: ObjectId(UserId),
            user_status: { $ne: constValues.user_delete },
          },
        },
        { $project: { otp: 1, user_status: 1 } },
      ];

      let result = await UserUtils.getUserDetail(query);
      if (!result.status) {
        return helpers.showResponse(
          false,
          result.message,
          null,
          null,
          result?.code
        );
      }

      let userdataresult = await updateData(
        Users,
        { password: md5(new_password) },
        ObjectId(UserId)
      );

      if (!userdataresult.status) {
        return helpers.showResponse(
          false,
          userdataresult?.message,
          null,
          null,
          statusCodes.success
        );
      }
      return helpers.showResponse(
        true,
        Messages?.UPDATED_SUCCESS,
        null,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  user_profile: async (data) => {
    try {
      let { _id } = data?.decoded;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let query = [
        {
          $match: {
            _id: ObjectId(_id),
            user_status: { $ne: constValues.user_delete },
            is_verified: { $ne: constValues.User_unverified },
          },
        },
        { $project: { otp: 0, __v: 0 } },
      ];
      let result = await UserUtils.getUserDetail(query);
      if (!result.status) {
        return helpers.showResponse(
          false,
          result.message,
          null,
          null,
          result?.code
        );
      }
      return helpers.showResponse(
        true,
        Messages.DATA_FOUND_SUCCESS,
        result?.data,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  getUserDetail: async (query) => {
    try {
      let result = await Users.aggregate(query);
      if (result.length < 1) {
        return helpers.showResponse(
          false,
          Messages.NOT_FOUND,
          null,
          null,
          statusCodes.notfound
        );
      }
      if (
        result.length > 0 &&
        result[0]?.user_status == constValues.user_block
      ) {
        return helpers.showResponse(
          false,
          Messages.BLOCKED,
          null,
          null,
          statusCodes.notfound
        );
      }
      return helpers.showResponse(
        true,
        Messages.DATA_FOUND_SUCCESS,
        result[0],
        null,
        statusCodes.success
      );
    } catch (err) {
      console.log(err);
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  profile_update: async (data) => {
    try {
      let { _id } = data?.decoded;
      let { username, phone_no } = data?.body;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      if (username || phone_no) {
        let result = await Users.aggregate([
          {
            $match: {
              _id: { $ne: ObjectId(_id) },
              username: username,
              user_status: { $ne: constValues.user_delete },
            },
          },
          { $project: { otp: 0, __v: 0 } },
        ]);
        if (result.length > 0) {
          return helpers.showResponse(
            false,
            Messages.USER_NAME_EXISTS,
            null,
            null,
            statusCodes.success
          );
        }
        let updateObj = {
          username: username,
        };
        if (phone_no && phone_no != "" && phone_no != undefined) {
          updateObj.phone_number = phone_no;
        }
        let userdataresult = await updateData(Users, updateObj, ObjectId(_id));
        if (!userdataresult.status) {
          return helpers.showResponse(
            false,
            userdataresult?.message,
            null,
            null,
            statusCodes.success
          );
        }
        return helpers.showResponse(
          true,
          Messages.UPDATED_SUCCESS,
          userdataresult.data,
          null,
          statusCodes.success
        );
      } else {
        let query = [
          {
            $match: {
              _id: ObjectId(_id),
              user_status: { $ne: constValues.user_delete },
            },
          },
          { $project: { otp: 0, __v: 0 } },
        ];
        let userdataresult = await UserUtils.getUserDetail(query);
        if (!userdataresult.status) {
          return helpers.showResponse(
            false,
            result.message,
            null,
            null,
            result?.code
          );
        }
        return helpers.showResponse(
          true,
          Messages.UPDATED_SUCCESS,
          userdataresult?.data,
          null,
          statusCodes.success
        );
      }
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  logout: async (bodyData) => {
    let { user_id } = bodyData;
    let editObj = {
      fcm_token: "",
      updated_on: moment().unix(),
    };
    let response = await updateData(Users, editObj, ObjectId(user_id));
    if (response.status) {
      return helpers.showResponse(true, "Logout Success", null, null, 200);
    }
    return helpers.showResponse(false, "Logout Error", null, null, 200);
  },

  Delete_account: async (data) => {
    try {
      let { _id } = data?.decoded;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let userdataresult = await updateData(
        Users,
        { user_status: constValues.user_delete },
        ObjectId(_id)
      );

      if (!userdataresult.status) {
        return helpers.showResponse(
          false,
          userdataresult?.message,
          null,
          null,
          statusCodes.success
        );
      }
      return helpers.showResponse(
        true,
        Messages.DELETED_ACCOUNT,
        null,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  Change_pass: async (data) => {
    try {
      let { _id } = data?.decoded;
      let { current_password, new_password } = data?.body;
      let query = [
        {
          $match: {
            _id: ObjectId(_id),
            user_status: { $ne: constValues.user_delete },
          },
        },
        { $project: { otp: 0, user_status: 0 } },
      ];
      let result = await UserUtils.getUserDetail(query);
      if (!result.status) {
        return helpers.showResponse(
          false,
          result.message,
          null,
          null,
          result?.code
        );
      }
      if (result?.data?.password !== md5(current_password)) {
        return helpers.showResponse(
          false,
          Messages.NOT_MATCH_PASSWORD,
          null,
          null,
          statusCodes.success
        );
      }
      let userdataresult = await updateData(
        Users,
        { password: md5(new_password) },
        ObjectId(_id)
      );

      if (!userdataresult.status) {
        return helpers.showResponse(
          false,
          userdataresult?.message,
          null,
          null,
          statusCodes.success
        );
      }
      return helpers.showResponse(
        true,
        Messages.UPDATED_SUCCESS,
        null,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  resend_otp: async (data) => {
    try {
      // let { country_code, phone_number, userid } = data;
      let { country_code, email } = data;
      let otp = helpers.randomStr(4, "1234567890");
      let query = [
        {
          $match: {
            // phone_number: phone_number,
            email : email,
            country_code: country_code,
            user_status: { $ne: constValues.user_delete },
            is_verified: { $ne: constValues.User_unverified },
          },
        },
        { $project: { otp: 0, __v: 0 } },
      ];
      let result = await UserUtils.getUserDetail(query);
      if (!result.status) {
        return helpers.showResponse(
          false,
          result.message,
          null,
          null,
          result?.code
        );
      }
      let userdataresult = await updateData(
        Users,
        { otp: otp },
        ObjectId(result?.data?._id)
      );

      if (!userdataresult.status) {
        return helpers.showResponse(
          false,
          userdataresult?.message,
          null,
          null,
          statusCodes.success
        );
      }
      // await helpers.sendSMSService(phone_number, 'here is your 4 digit verification code');
      let html = "<b>Greetings, </b><br /><br />Here is your 4 Digits Reset Password Instructions<br />" +
          "<h2>" + otp + "</h2><br /><br /><label><small>Please use this code to reset your password." +
          "</small></label><br /><br /><label>Thanks & Regards</label><br /><label>A1 Truck" +
          "Community</label>"
      await helpers.sendEmailService(process.env.APP_EMAIL, email, 'Forget Password', html);
      return helpers.showResponse(
        true,
        Messages.SEND_OTP_EMAIL,
        null,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  createAccount: async (user_id) => {
    let res = await Users.findOne(
      {
        _id: ObjectId(user_id),
        user_status: { $ne: constValues.user_delete },
        is_verified: { $ne: constValues.User_unverified },
      },
      ""
    );
    if (res?.stripe_id === "") {
      const customer = await stripe.customers.create({
        description: "My First Test Customer (created for API docs)",
        email: res.email,
      });

      if (customer) {
        let response = await Users.findOneAndUpdate(
          {
            _id: ObjectId(user_id),
            user_status: { $ne: constValues.user_delete },
            is_verified: { $ne: constValues.User_unverified },
          },
          { $set: { stripe_id: customer.id } }
        );
        if (response) {
          return helpers.showResponse(
            true,
            Messages.UPDATED_SUCCESS,
            response,
            null,
            200
          );
        }
        return helpers.showResponse(
          false,
          Messages.USER_UPDATE_FAILED,
          null,
          null,
          304
        );
      }
      return helpers.showResponse(
        false,
        Messages.STRIPE_FAILED,
        null,
        null,
        304
      );
    } else {
      return helpers.showResponse(
        false,
        Messages.ALREADY_EXISTS_STRIP,
        res,
        null,
        304
      );
    }
  },
  deleteStripAccount: async (user_id) => {
    let res = await Users.findOne(
      {
        _id: ObjectId(user_id),
        user_status: { $ne: constValues.user_delete },
      },
      ""
    );
    if (res.stripe_id === "") {
      const deleted = await stripe.customers.del(res.stripe_id);
      if (deleted) {
        return helpers.showResponse(
          true,
          "Strip account deleted",
          null,
          null,
          200
        );
      }
      return helpers.showResponse(
        false,
        "Unable to delete strip account",
        null,
        null,
        304
      );
    } else {
      return helpers.showResponse(
        false,
        "Strip account not found",
        res,
        null,
        304
      );
    }
  },
};

module.exports = {
  ...UserUtils,
};
