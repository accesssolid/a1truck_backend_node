let ObjectId = require("mongodb").ObjectID;
let moment = require('moment-timezone');
var FCM = require("fcm-node");
var serverKey = process.env.FIREBASE_SERVER_KEY;
var fcm = new FCM(serverKey);
const mongoose = require("mongoose");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twiliophone = process.env.TWILIO_PHONE_NUMBER;
const isValidId = (_id) => mongoose.Types.ObjectId.isValid(_id);
const User = require('../../models/Users');
const Notification = require('../../models/notification');

const showResponse = (
  status,
  message,
  data = null,
  other = null,
  code = null
) => {
  let response = {};
  response.status = status;
  response.message = message;
  if (data !== null) {
    response.data = data;
  }
  if (other !== null) {
    response.other = other;
  }
  if (code !== null) {
    response.code = code;
  }
  return response;
};

const showOutput = (res, response, code) => {
  delete response?.code;
  res.status(code).json(response);
};

const randomStr = (len, arr) => {
  var digits = arr;
  let OTP = "";
  for (let i = 0; i < len; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  if (OTP.length < len || OTP.length > len) {
    randomStr(len, arr);
  }
  return (OTP);
};

const validateParams = (request, feilds) => {
  var postKeys = [];
  var missingFeilds = [];
  for (var key in request.body) {
    postKeys.push(key);
  }
  for (var i = 0; i < feilds.length; i++) {
    if (postKeys.indexOf(feilds[i]) >= 0) {
      if (request.body[feilds[i]] == "") missingFeilds.push(feilds[i]);
    } else {
      missingFeilds.push(feilds[i]);
    }
  }
  if (missingFeilds.length > 0) {
    let response = showResponse(
      false,
      `Following fields are required : ${missingFeilds}`
    );
    return response;
  }
  let response = showResponse(true, ``);
  return response;
};

const validateParamsArray = (data, feilds) => {
  var postKeys = [];
  var missingFeilds = [];
  for (var key in data) {
    postKeys.push(key);
  }
  for (var i = 0; i < feilds.length; i++) {
    if (postKeys.indexOf(feilds[i]) >= 0) {
      if (data[feilds[i]] == "") missingFeilds.push(feilds[i]);
    } else {
      missingFeilds.push(feilds[i]);
    }
  }
  if (missingFeilds.length > 0) {
    let response = showResponse(
      false,
      `Following fields are required : ${missingFeilds}`
    );
    return response;
  }
  let response = showResponse(true, ``);
  return response;
};

const dynamicSort = (property) => {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    if (sortOrder == -1) {
      return b[property].localeCompare(a[property]);
    } else {
      return a[property].localeCompare(b[property]);
    }
  };
};

const arraySort = (arr) => {
  arr.sort((a, b) =>
    a.index > b.index
      ? 1
      : a.index === b.index
      ? a.index > b.index
        ? 1
        : -1
      : -1
  );
  return arr;
};

const validateEmail = (email) => {
  if (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      email
    )
  ) {
    return true;
  }
  return false;
};

const groupArray = (array, key) => {
  let group = array.reduce((r, a) => {
    r[a[key]] = [...(r[a[key]] || []), a];
    return r;
  }, {});
  return [group];
};

const capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const sendFcmNotification = (to, data, show = false, os) => {
  return new Promise((resolve, reject) => {
    data = { ...data, show };
    let notification = {};
    if (os == "ios") {
      if (data.title == "") {
        data.title = "";
        data.show = false;
      }
    }
    if (!(os == "android" && data.title == "" && data.message == "")) {
      notification = data;
    }
    var message = {
      to,
      priority: "high",
      notification: notification,
      data,
    };
    fcm.send(message, (err, response) => {
      if (err) {
        console.log(err);
        resolve(err);
      }
      resolve(JSON.parse(response));
    });
  });
};

const localNotification = async (role, _id, data) => {
  let { type, text, notification_data } = data;
  let queryObject = { _id: ObjectId(_id), status: { $ne: 2 } };
  let result = null;
  switch (role) {
    case "coach":
      result = await getSingleData(Coach, queryObject, "");
      break;
    case "father":
      result = await getSingleData(Father, queryObject, "");
      break;
    case "mother":
      result = await getSingleData(Mother, queryObject, "");
      break;
    case "student":
      result = await getSingleData(Student, queryObject, "");
      break;
  }
  if (result && result.status) {
    let user_data = result.data;
    let notifications = user_data.notifications;
    let notiObject = {
      notification_type: type,
      is_read: 0,
      text,
      notification_data: notification_data ? notification_data : {},
      created_on: moment().unix(),
    };
    notifications.push(notiObject);
    let editObj = {
      notifications,
      updated_on: moment().unix(),
    };
    let response = null;
    switch (role) {
      case "coach":
        response = await updateData(Coach, editObj, ObjectId(_id));
        break;
      case "father":
        response = await updateData(Father, editObj, ObjectId(_id));
        break;
      case "mother":
        response = await updateData(Mother, editObj, ObjectId(_id));
        break;
      case "student":
        response = await updateData(Student, editObj, ObjectId(_id));
        break;
    }
    if (response && response.status) {
      return true;
    }
    return false;
  }
  return helpers.showResponse(false, "Invalid Identifier", null, null, 200);
};

  const localNotificationBooking = async (role, userData, data) => {
    let { title, message, status, notification_data } = data;
    if(userData.length > 0){
      let usersNotification = [];
      for(let i = 0; i < userData.length; i++){
        let _id = ObjectId(userData[i]._id);
        let notiObject = {
          user_id : _id,
          title,
          message,
          notification_type : "normal",
          status,
          is_read : 0,
          notification_data : notification_data ? notification_data : {}
        }
        usersNotification.push(notiObject);
      }
      let insertResult = await insertMany(Notification, usersNotification);
      if(insertResult.status){
        return showResponse(true, 'notification send', null, null, 200);
      }
      return showResponse(false, 'Internal server error', null, null, 200);
    }
    return showResponse(false, 'No users has booking notification yet', null, null, 200);
  }

const sendFcmNotificationMultiple = (to, data, show) => {
  return new Promise((resolve, reject) => {
    data = { ...data, show: show ? show : false };
    var message = {
      registration_ids: to,
      priority: "high",
      notification: data,
      data,
    };
    fcm.send(message, (err, response) => {
      if (err) {
        resolve(JSON.parse(err));
      }
      resolve(JSON.parse(response));
    });
  });
};

const sendTwilioSMS = async (to, body) => {
  try {
    const client = new twilio(accountSid, authToken);
    let response = await client.messages.create({
      body,
      from: twiliophone,
      to,
    });
    return response.sid;
  } catch (e) {
    return e;
  }
};

module.exports = {
  showResponse,
  showOutput,
  randomStr,
  validateParams,
  validateParamsArray,
  dynamicSort,
  validateEmail,
  arraySort,
  groupArray,
  sendFcmNotification,
  sendFcmNotificationMultiple,
  capitalize,
  getDistanceFromLatLonInKm,
  localNotification,
  localNotificationBooking,
  // sendTwilioSMS,
  isValidId,
};
