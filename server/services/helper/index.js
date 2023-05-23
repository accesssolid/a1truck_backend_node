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
const Notification = require('../../models/notification');
const pdfkit = require('pdfkit');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const officeGen = require('officegen');
const docx = officeGen('docx');
const AWS = require('aws-sdk');

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

  const localNotificationBooking = async (role, bookingData, data) => {
    let { title, message, status, notification_data } = data;
    if(bookingData.length > 0){
      let usersNotification = [];
      for(let i = 0; i < bookingData.length; i++){
        let _id = ObjectId(bookingData[i].user_id);
        let booking_ref = bookingData[i].booking_ref;
        let notiObject = {
          user_id : _id,
          title,
          message : message + ' ' + `booking ref : #${booking_ref}` ,
          notification_type : "normal",
          status,
          is_read : 0,
          booking_no : '#'+booking_ref,
          notification_data : notification_data ? notification_data : {}
        }
        usersNotification.push(notiObject);
      }
      let insertResult = await insertMany(Notification, usersNotification);
      if(insertResult.status){
        return showResponse(true, 'Notification send successfully', null, null, 200);
      }
      return showResponse(false, 'Internal server error', null, null, 200);
    }
    return showResponse(false, 'No bookings found!!', null, null, 200);
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

const sendContactEmail = async (bodyData) => {
  let { name, email, message } = bodyData;
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
          subject: 'A1 Truck Booking',
          html: `
          <h4>Dear ${name}, </br></h4>
          <p>${message}</p></br>
          <label>Thanks & Regards</label><br/><label>A1 Truck Parking.</label>
          `,
      });
      return showResponse(true, "Email send successfully", null, null, 200);

  } catch (err) {
      console.log(err)
      return showResponse(false, "Error Occured, try again", null, null, 200);
  }
}

// const sendBookingMailToUser = async (bookingData) => {
//   let { user_name, email, booking_creation_time, total_cost, slot_type, pdf_fileName } = bookingData;
//   try {
//     let transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//         port: 587,
//         secure: false,
//         auth: {
//           user: process.env.APP_EMAIL,
//             pass: process.env.APP_PASSWORD
//           },
//       });
//       await transporter.sendMail({
//         from : process.env.APP_EMAIL,
//         to : email,
//         subject: 'A1 Truck Booking',
//         html: `
//         <h4>Dear ${user_name},</h4>
//         <p>Thank you for booking a truck parking slot with us. We are pleased to confirm your reservation for the following :</p>
//         <p>Booking Details:</p>
//         <table cellspacing="25">
//           <tr>
//             <th style="text-align: left">Booking Date</th> <td>${booking_creation_time}</td>
//           </tr>
//           <tr>
//             <th style="text-align: left">Parking Duration</th> <td>${slot_type}</td>
//           </tr>
//           <tr>
//             <th style="text-align: left">Total Cost</th> <td>${total_cost}</td>
//           </tr>
//         </table>
//         <br/>
//         <p>Please find attached the invoice for your reference.</p> <br/>
//         <h3>Parking Rules :</h3> <br/>
//         <p>Please note that your parking slot is reserved for the specified duration only. Additional charges will apply for overstaying.
//         <p>All vehicles must comply with our parking rules and regulations.</p> <br/>
//         <p>We are not responsible for any loss or damage to vehicles or their contents while parked on our premises.</p> </br>
//         <p>Please notify us if you need to cancel or change your booking at least 24 hours before the booking start time to avoid cancellation charges.</p> </br></br>
//         <p>Thank you for choosing our truck parking services. We look forward to serving you again.</p>
//         </p> </br> </br>
//         <p>Sincerely,</p>
//         <br/><label>A1 Truck Parking.</label>
//         `,
//         attachments: [
//           {
//             filename : 'invoice.pdf',
//             path : `${path.resolve('./server/uploads/booking_invoice/'+pdf_fileName)}`,
//             contentType: 'application/pdf'
//           }
//         ]
//       });
//     return showResponse(true, "Booking invoices send successfully thorugh mail", null, null, 200);

//   } catch (err) {
//     console.log(err)
//     return showResponse(false, "Error Occured, try again", null, null, 200);
//   }
// }

const createBookingInvoicePDF = async(bookingData) => {
  try{
    let pdfDoc = new pdfkit;
    let pdfFileName = `Booking_${Date.now()}_invoice.pdf`;
    pdfDoc.pipe(fs.createWriteStream(path.resolve(`./server/uploads/booking_invoice/${pdfFileName}`)));
    pdfDoc.image(path.resolve('./server/uploads/textlogo3.png'), 25, 20, { width: 140 });
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Invoice :", 35, 90);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Entry Code", 35, 105);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(bookingData.booking_reference_no, 160, 105);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Invoice Date", 35, 120);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(bookingData.booking_creation_time, 160, 120);
  
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Billing To :", 35, 150);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Customer Name", 35, 165);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(bookingData.user_name, 160, 165);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Email", 35, 180);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(bookingData.email, 160, 180);
  
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Description", 35, 225);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Booking Start Time", 200, 225);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Booking End Time", 340, 225);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Total Amount", 475, 225);
    pdfDoc.lineJoin('round').rect(35, 240, 560, 0).lineWidth(0.1).stroke("#aaa");
  
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Truck Parking Slot Booking", 35, 250);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(bookingData.booking_start_time, 200, 250);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(bookingData.booking_end_time, 340, 250);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text('$'+bookingData.total_cost + '.00', 485, 250);
  
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Tax :", 400, 301);
    pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Total :", 400, 317);
  
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text('$0.00', 485, 301);
    pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text('$'+bookingData.total_cost + '.00', 485, 316);
  
    pdfDoc.fontSize(8).font('Helvetica').fillColor('black').text(`This is a computer generated statement hence no signature is required.`, 35, 330);
    
    pdfDoc.end();

    return showResponse(true, 'successfully created pdf', pdfFileName, null, 200);

  }catch(err){
    return showResponse(false, 'Server Error, Pdf file did not created..', null, null, 200);
  }
}

const generatePdfUsersAndBookings = async(dataObject, type) => {
  if(dataObject.length > 0){
    try{
      let pdfDoc = new pdfkit;
      let height = 125;
      if(type == 'bookings'){
        let pdfFileName = `pdf_doc/${Date.now()}_booking_doc.pdf`;
        pdfDoc.pipe(fs.createWriteStream(path.resolve(`./server/uploads/${pdfFileName}`)));
        let filePath = `https://api.a1truckpark.com/files/${pdfFileName}`;
        pdfDoc.image(path.resolve('./server/uploads/textlogo3.png'), 25, 20, { width: 140 });
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("S.No", 35, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("License No", 70, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Vehicle", 130, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("US Dot", 190, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Start", 255, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("End", 375, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Space", 500, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Code", 560, height);
        pdfDoc.lineJoin('round').rect(35, 136, 560, 0).lineWidth(0.1).stroke("#aaa");
        for(let i = 0; i < dataObject.length; i++){
          height += 15;
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(i + 1, 35, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].vehicle_id.license_plate, 70, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].vehicle_id.truck_makes, 130, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].vehicle_id.us_dot, 190, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].start_time, 255, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].end_time, 375, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].slot_number, 510, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].booking_ref, 560, height);
        }
        pdfDoc.end();
        return showResponse(true, 'successfully created pdf', filePath, null, 200);
      }

      if(type == 'users'){
        let pdfFileName = `pdf_doc/${Date.now()}_users_doc.pdf`;
        pdfDoc.pipe(fs.createWriteStream(path.resolve(`./server/uploads/${pdfFileName}`)));
        let filePath = `https://api.a1truckpark.com/files/${pdfFileName}`;
        pdfDoc.image(path.resolve('./server/uploads/textlogo3.png'), 25, 20, { width: 140 });
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("S.No", 35, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Name", 100, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Email", 250, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Phone No", 400, height);
        pdfDoc.lineJoin('round').rect(35, 136, 500, 0).lineWidth(0.1).stroke("#aaa");
        for(let i = 0; i < dataObject.length; i++){
          height += 15;
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(i + 1, 35, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].username, 100, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].email, 250, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].phone_number, 400, height);
        }
        pdfDoc.end();
        return showResponse(true, 'successfully created pdf', filePath, null, 200);
      }

    }catch(err){
      return showResponse(false, 'Server Error, Pdf file did not created..', null, null, 200);
    }

  }else{
    return showResponse(false, 'No users found', null, null, 200);
  }
}
const generateWordSlots = async(dataObject, type) => {
  if(dataObject.length > 0){
    try{
      docx.createP({ align : 'center' }).addImage(path.resolve('./server/uploads/textlogo3.png'), { cx: 300, cy: 80 });
      let pdfFileName;
      if(type == 'slots'){
        const table = [
          [
            { val: "S. NO", opts: { b: true, sz: '15', cellColWidth: 700, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } },
            { val: "Start Time", opts: { b: true, sz: '15', cellColWidth: 2500, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } }, 
            { val: "End Time", opts: { b: true, sz: '15', align: "center", cellColWidth: 4000, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } }, 
            { val: "Slot Number", opts: { b: true, sz: '15', align: "center", cellColWidth: 2500, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }}
          ]
        ];
        for (let i = 0; i < dataObject.length; i++ ) {
          const row = [];
          row.push(i + 1);
          row.push(dataObject[i].slot_start_time);
          row.push(dataObject[i].slot_end_time);
          row.push(dataObject[i].slot_number);
          table.push(row);
        }
        const tableStyle = {
          tableColWidth: 4290,
          tableSize: 12,
          tableColor: "auto",
          tableAlign: "left",
          borderSize: 2,
          borderColor: "000000",
          cellMargin: 20,
          marginTop : 1000,
          marginBottom : 100,
          marginLeft : 100,
          marginRight : 100,
          width : 12240,
          height : 840
        };
        docx.createTable(table, tableStyle);
        pdfFileName = `word_doc/${Date.now()}_slots_doc.docx`;

      }
      
      let filePath = `https://api.a1truckpark.com/files/${pdfFileName}`;
      const outputStream = fs.createWriteStream(path.resolve(`./server/uploads/${pdfFileName}`));
      docx.generate(outputStream);
      return showResponse(true, 'Successfully generated word file', filePath, null, 200);
      
    }catch(err){
      console.log(err)
      return showResponse(false, 'Server Error, word file did not created..', null, null, 200);
    }

  }else{
    return showResponse(false, 'No users found', null, null, 200);
  }
}

const generatePdfSlots = async(dataObject, type) => {
  if(dataObject.length > 0){
    try{
      let pdfDoc = new pdfkit;
      let height = 125;
      if(type == 'slots'){
        let pdfFileName = `pdf_doc/${Date.now()}_slots_doc.pdf`;
        pdfDoc.pipe(fs.createWriteStream(path.resolve(`./server/uploads/${pdfFileName}`)));
        let filePath = `https://api.a1truckpark.com/files/${pdfFileName}`;
        pdfDoc.image(path.resolve('./server/uploads/textlogo3.png'), 25, 20, { width: 140 });
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("S.No", 35, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Start Time", 100, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("End Time", 250, height);
        pdfDoc.fontSize(10).font('Helvetica-Bold').fillColor('black').text("Slot Number", 400, height);
        pdfDoc.lineJoin('round').rect(35, 136, 500, 0).lineWidth(0.1).stroke("#aaa");
        for(let i = 0; i < dataObject.length; i++){
          height += 15;
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(i + 1, 35, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].slot_start_time, 100, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].slot_end_time, 250, height);
          pdfDoc.fontSize(10).font('Helvetica').fillColor('black').text(dataObject[i].slot_number, 400, height);
        }
        pdfDoc.end();
        return showResponse(true, 'successfully created pdf', filePath, null, 200);
      }

    }catch(err){
      return showResponse(false, 'Server Error, Pdf file did not created..', null, null, 200);
    }

  }else{
    return showResponse(false, 'No users found', null, null, 200);
  }
}


const generateWordUsersAndBookings = async(dataObject, type) => {
  if(dataObject.length > 0){
    try{
      docx.createP({ align : 'center' }).addImage(path.resolve('./server/uploads/textlogo3.png'), { cx: 300, cy: 80 });
      let pdfFileName;
      if(type == 'users'){
        const table = [
          [
            { val: "S. NO", opts: { b: true, sz: '15', cellColWidth: 700, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } },
            { val: "Name", opts: { b: true, sz: '15', cellColWidth: 2500, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } }, 
            { val: "Email", opts: { b: true, sz: '15', align: "center", cellColWidth: 4000, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } }, 
            { val: "Phone Number", opts: { b: true, sz: '15', align: "center", cellColWidth: 2500, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }}
          ]
        ];
        for (let i = 0; i < dataObject.length; i++ ) {
          const row = [];
          row.push(i + 1);
          row.push(dataObject[i].username);
          row.push(dataObject[i].email);
          row.push(dataObject[i].phone_number);
          table.push(row);
        }
        const tableStyle = {
          tableColWidth: 4290,
          tableSize: 12,
          tableColor: "auto",
          tableAlign: "left",
          borderSize: 2,
          borderColor: "000000",
          cellMargin: 20,
          marginTop : 1000,
          marginBottom : 100,
          marginLeft : 100,
          marginRight : 100,
          width : 12240,
          height : 840
        };
        docx.createTable(table, tableStyle);
        pdfFileName = `word_doc/${Date.now()}_users_doc.docx`;

      }
      if(type == 'bookings'){
        const table = [
          [
            { val: "S. NO", opts: { b: true, sz: '15', cellColWidth: 700, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } },
            { val: "License No", opts: { b: true, sz: '15', cellColWidth: 1200, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } },
            { val: "Vehicle", opts: { b: true, sz: '15', align: "center", cellColWidth: 1800, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" } },
            { val: "US Dot", opts: { b: true, sz: '15', align: "center", cellColWidth: 1400, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }},
            { val: "Start", opts: { b: true, sz: '15', align: "center", cellColWidth: 1800, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }},
            { val: "End", opts: { b: true, sz: '15', align: "center", cellColWidth: 1800, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }},
            { val: "Space", opts: { b: true, sz: '15', align: "center", cellColWidth: 700, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }},
            { val: "Code", opts: { b: true, sz: '15', align: "center", cellColWidth: 800, shd: { fill: "7F7F7F", themeFill: "text1", "themeFillTint": "80" }, fontFamily: "Arial" }}
          ]
        ];
        for (let i = 0; i < dataObject.length; i++ ) {
          const row = [];
          row.push(i + 1);
          row.push(dataObject[i].vehicle_id.license_plate);
          row.push(dataObject[i].vehicle_id.truck_makes);
          row.push(dataObject[i].vehicle_id.us_dot);
          row.push(dataObject[i].start_time);
          row.push(dataObject[i].end_time);
          row.push((dataObject[i].slot_number).toString());
          row.push(dataObject[i].booking_ref);
          table.push(row);
        }
        const tableStyle = {
          tableColWidth: 4290,
          tableSize: 12,
          tableColor: "auto",
          tableAlign: "left",
          borderSize: 2,
          borderColor: "000000",
          cellMargin: 20,
          width : 12240,
          height : 840
        };
        docx.createTable(table, tableStyle);
        pdfFileName = `word_doc/${Date.now()}_bookings_doc.docx`;
      }
      let filePath = `https://api.a1truckpark.com/files/${pdfFileName}`;
      const outputStream = fs.createWriteStream(path.resolve(`./server/uploads/${pdfFileName}`));
      docx.generate(outputStream);
      return showResponse(true, 'Successfully generated word file', filePath, null, 200);
      
    }catch(err){
      console.log(err)
      return showResponse(false, 'Server Error, word file did not created..', null, null, 200);
    }

  }else{
    return showResponse(false, 'No users found', null, null, 200);
  }
}


const changeTimeZoneSettings = async(time_zone, createdAt, start_time, end_time) => {
  let booking_creation_time = moment(createdAt).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A Z');
  let booking_start_time = moment(start_time).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A Z');
  let booking_end_time = moment(end_time).tz(time_zone).format('YYYY-MM-DD hh:mm:ss A Z');

  if(booking_creation_time.indexOf(' -') >= 0){
    booking_creation_time = booking_creation_time.split(' -')[0];
  }else{
    booking_creation_time = booking_creation_time.split(' +')[0];
  }

  if(booking_start_time.indexOf(' -') >= 0){
    booking_start_time = booking_start_time.split(' -')[0];
  }else{
    booking_start_time = booking_start_time.split(' +')[0];
  }

  if(booking_end_time.indexOf(' -') >= 0){
    booking_end_time = booking_end_time.split(' -')[0];
  }else{
    booking_end_time = booking_end_time.split(' +')[0]
  }

  let timeData =  {
    booking_creation_time,
    booking_start_time,
    booking_end_time
  }
  return showResponse(true, 'successfully change time', timeData, null, 200); 
}

// const sendBookingMailToAdmin = async(bookingData) => {
//   let { user_name, slot_type, vehicle_type, booking_start_time, booking_end_time, phone_number } = bookingData;
//   try {
//     let transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//         port: 587,
//         secure: false,
//         auth: {
//           user: process.env.APP_EMAIL,
//             pass: process.env.APP_PASSWORD
//           },
//       });
//       await transporter.sendMail({
//         from : process.env.APP_EMAIL,
//         to : 'anak@solidappmaker.com',
//         subject : 'A1 Truck Booking',
//         html : `
//         <h4>Hello, Administrator</h4>
//         <p>There is a new ${slot_type} booking of ${vehicle_type} from ${user_name}.</br></p>
//         <table cellspacing="25">
//           <tr>
//             <th style="text-align: left">Booking Start Time</th> <td>${booking_start_time}</td>
//           </tr>
//           <tr>
//             <th style="text-align: left">Booking End Time</th> <td>${booking_end_time}</td>
//           </tr>
//           <tr>
//             <th style="text-align: left">Parking Duration</th> <td>${slot_type}</td>
//           </tr>
//           <tr>
//             <th style="text-align: left">Phone No</th> <td>${phone_number}</td>
//           </tr>
//         </table>
//         </br>
//         <p>So please contact to user if any type of concern.</p>
//         <br/><label>A1 Truck Parking.</label>
//         `
//       });
//     return showResponse(true, "successfully send booking mail to admin", null, null, 200);

//   } catch (err) {
//     console.log(err)
//     return showResponse(false, "Error Occured, try again", null, null, 200);
//   }
// }

const sendRenewedBookingMailToAdmin = async(RenewBookingData) => {
  let { user_name, booking_start_time, booking_end_time, slot_type, vehicle_type, phone_number } = RenewBookingData;
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
        to : 'anak@solidappmaker.com',
        subject : 'A1 Truck Booking',
        html : `
        <h4>Hello, Administrator</h4>
        <p>There is a renewed ${slot_type} booking of ${vehicle_type} from ${user_name}.</br></p>
        <table cellspacing="25">
          <tr>
            <th style="text-align: left">Booking Start Time</th> <td>${booking_start_time}</td>
          </tr>
          <tr>
            <th style="text-align: left">Booking End Time</th> <td>${booking_end_time}</td>
          </tr>
          <tr>
            <th style="text-align: left">Parking Duration</th> <td>${slot_type}</td>
          </tr>
          <tr>
            <th style="text-align: left">Phone No</th> <td>${phone_number}</td>
          </tr>
        </table>
        <p>So please contact to user if any type of concern.</p>
        <br/><label>A1 Truck Parking.</label>
        `
      });
    return showResponse(true, "successfully send booking mail to admin", null, null, 200);

  } catch (err) {
    console.log(err)
    return showResponse(false, "Error Occured, please try again", null, null, 200);
  }
}

const sendBookingMailToUserAws = async (bookingData) => {
  return new Promise(async (resolve, reject) => {
    let { user_name, email, booking_creation_time, total_cost, slot_type, pdf_fileName } = bookingData;
    try {
    let s3Link = `https://api.a1truckpark.com/files/booking_invoice/${pdf_fileName}`;
      let body = `
        <h4>Dear ${user_name},</h4>
        <p>Thank you for booking a truck parking slot with us. We are pleased to confirm your reservation for the following :</p>
        <p>Booking Details:</p>
        <table cellspacing="25">
          <tr>
            <th style="text-align: left">Booking Date</th> <td>${booking_creation_time}</td>
          </tr>
          <tr>
            <th style="text-align: left">Parking Duration</th> <td>${slot_type}</td>
          </tr>
          <tr>
            <th style="text-align: left">Total Cost</th> <td>${total_cost}</td>
          </tr>
        </table>
        <br/>
        <p>Please find attached the invoice for your reference.</p> <br/>
        <h3>Parking Rules :</h3> <br/>
        <p>Please note that your parking slot is reserved for the specified duration only. Additional charges will apply for overstaying.
        <p>All vehicles must comply with our parking rules and regulations.</p> <br/>
        <p>We are not responsible for any loss or damage to vehicles or their contents while parked on our premises.</p> </br>
        <p>Please notify us if you need to cancel or change your booking at least 24 hours before the booking start time to avoid cancellation charges.</p> </br></br>
        <p>Thank you for choosing our truck parking services. We look forward to serving you again.</p>
        </p> </br> </br>
        <p>Sincerely,</p>
        <br/><label>A1 Truck Parking.</label>
      `
      let transporter = await nodemailer.createTransport({
        SES: new AWS.SES({ accessKeyId: process.env.AccessKeyId, secretAccessKey: process.env.SecretAccessKey, region : process.env.Region, apiVersion: "2010-12-01" })
      });
      let mailOptions = {
        from : process.env.APP_EMAIL,
        to : email,
        subject : 'A1 Truck Booking',
        html : body,
        attachments: [
          {
            filename : 'invoice.pdf',
            path : s3Link,
            contentType : 'application/pdf'
          }
        ]
      }
      transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
          console.log(error)
          return resolve(showResponse(false, "Error Occured, please try again", error, null, 200));
        }
        return resolve(showResponse(true, 'Booking invoices send successfully thorugh mail', null, null, 200));
      })
    } catch (err) {
      console.log(err)
      return showResponse(false, "Error Occured, please try again", null, null, 200);
    }
  });
}

const sendBookingMailToAdminAws = async(bookingData) => {
  return new Promise(async (resolve, reject) => {
    let { user_name, slot_type, vehicle_type, booking_start_time, booking_end_time, phone_number } = bookingData;
    try {
      let body = `
      <h4>Hello, Administrator</h4>
      <p>There is a new ${slot_type} booking of ${vehicle_type} from ${user_name}.</br></p>
      <table cellspacing="25">
        <tr>
          <th style="text-align: left">Booking Start Time</th> <td>${booking_start_time}</td>
        </tr>
        <tr>
          <th style="text-align: left">Booking End Time</th> <td>${booking_end_time}</td>
        </tr>
        <tr>
          <th style="text-align: left">Parking Duration</th> <td>${slot_type}</td>
        </tr>
        <tr>
          <th style="text-align: left">Phone No</th> <td>${phone_number}</td>
        </tr>
      </table>
      </br>
      <p>So please contact to user if any type of concern.</p>
      <br/><label>A1 Truck Parking.</label>
      `
      let transporter = nodemailer.createTransport({
        SES: new AWS.SES({ accessKeyId: process.env.AccessKeyId, secretAccessKey: process.env.SecretAccessKey, region : process.env.Region, apiVersion: "2010-12-01" })
      });
      let mailOptions = {
        from : process.env.APP_EMAIL,
        to : 'anak@solidappmaker.com',
        subject : 'A1 Truck Booking',
        html : body
      }
      transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
          console.log(error)
          return resolve(showResponse(false, 'Error Occured, please try again', error, null, 200));
        }
        return resolve(showResponse(true, 'successfully send booking mail to admin', null, null, 200));
      });

      } catch (err) {
        console.log(err)
        return showResponse(false, "Error Occured, please try again", null, null, 200);
      }
  });
}

const sendEmailService = async (from, to, subject, body, attachments = null) => {
  return new Promise(async (resolve, reject) => {
      try {
          let transporter = nodemailer.createTransport({
              SES: new AWS.SES({ accessKeyId: process.env.AccessKeyId, secretAccessKey: process.env.SecretAccessKey, region : process.env.Region, apiVersion: "2010-12-01" })
          });
          let mailOptions = {
              from : from,
              to,
              subject,
              html : body,
              attachments
          }
          transporter.sendMail(mailOptions, (error, data) => {
              if (error) {
                  console.log(error)
                  return resolve(showResponse(false, 'Error Occured, please try again', error, null, 200));
              }
              console.log(data)
              return resolve(showResponse(true, 'Successfully send mail', null, null, 200));
          })
      } catch (err) {
          console.log("in catch err", err)
          return resolve(showResponse(false, 'Error Occured, please try again', err, null, 200));
      }
  })
}

const sendSMSService = async (to, Message) => {
  return new Promise(async (resolve, reject) => {
      try {
          AWS.config.update({
              accessKeyId : process.env.AccessKeyId,
              secretAccessKey : process.env.SecretAccessKey,
              region : process.env.Region
          });
          const sns = new AWS.SNS();
          const params = {
              Message,
              PhoneNumber: to
          };
          // Send the SMS
          sns.publish(params, (err, data) => {
              if (err) {
                console.log(err)
                  return resolve(showResponse(false, 'Error Occured, please try again', err, null, 200));
              } else {
                console.log(data)
                  return resolve(showResponse(true, 'Successfully send sms', data, null, 200));
              }
          });
      } catch (err) {
          console.log("in catch err", err)
          return resolve(showResponse(false, 'Error Occured, please try again', null, 200));
      }
  })
}

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
  isValidId,
  createBookingInvoicePDF,
  // sendTwilioSMS,
  // sendBookingMailToUser,
  // sendBookingMailToAdmin,
  sendRenewedBookingMailToAdmin,
  changeTimeZoneSettings,
  sendContactEmail,
  generatePdfUsersAndBookings,
  generateWordUsersAndBookings,
  sendEmailService,
  sendSMSService,
  sendBookingMailToUserAws,
  sendBookingMailToAdminAws,
  generateWordSlots,
  generatePdfSlots
  
}