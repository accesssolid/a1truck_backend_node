require("../../db_functions");
let ObjectId = require("mongodb").ObjectId;
let helpers = require("../../services/helper");
let Users = require("../../models/Users");
let Bookings = require("../../models/Bookings");
const moment = require("moment-timezone");
const stripe = require("stripe")(process.env.Stripe_Secret_Key);
const VehicleType = require("../../models/VehicleType");

let BookingsUtils = {

  getEmptySlotCount: async (data, user_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let { startTime, endTime, vehicle_type, time_zone } = data;
        let startTimeZone = moment(startTime).tz(time_zone).format();
        let endTimeZone = moment(endTime).tz(time_zone).format();
        let vehicleTypeResponse = await getSingleData(VehicleType, { _id: ObjectId(vehicle_type), status: { $ne: 2 } }, "");
        if (!vehicleTypeResponse?.status) {
          resolve(helpers.showResponse(false, "Invalid vehicle type", null, null, 200));
        }
        let total_slots = vehicleTypeResponse?.data?.slots;
        let conflictingBookingsQuery = {
          vehicle_type,
          status: { $ne: 2 },
          $or: [
            { start_time: { $lt: endTimeZone },end_time: { $gt: startTimeZone } }, // booking overlaps with another booking
            { start_time: { $gte: startTimeZone, $lt: endTimeZone } }, // booking starts during another booking
            { end_time: { $gt: startTimeZone, $lte: endTimeZone } }, // booking ends during another booking
          ],
        };
        let total_booked_slot = 0;
        let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, "");
        if (conflictingBookingsResponse?.status) {
          total_booked_slot = conflictingBookingsResponse?.data?.length;
        }
        let total_available_slot = total_slots - total_booked_slot;
        resolve(helpers.showResponse(true, "Here is a count of available slots", total_available_slot < 0 ? 0 : total_available_slot, null, 200));
      } catch (err) {
        console.log("in catch err", err);
        resolve(helpers.showResponse(true, "Here is a count of available slots", 0, null, 200));
      }
    });
  },

  checkSlotAvailabilty: async (data, user_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let { startTime, endTime, slot_type, vehicle_type, card_id, vehicle_id, time_zone, total_amount, type } = data;
        startTime = new Date(startTime);
        endTime = new Date(endTime);
        let userResponse = await getSingleData(Users, { _id: ObjectId(user_id), status: { $ne: 2 } }, "");
        if (!userResponse?.status) {
          return resolve(helpers.showResponse(false, 'Invalid User', null, null, 200));
        }
        let userData = userResponse?.data;
        let oldBookinData = null;
        if (type == "renew") {
          // get old booking_data
          let { old_booking_id } = data;
          let oldBookingResponse = await getSingleData(Bookings, { _id: ObjectId(old_booking_id), status: { $eq: 1 } }, "");
          if (!oldBookingResponse?.status) {
            return resolve(helpers.showResponse(false, 'Sorry !!! Invalid Booking Reference', null, null, 200));
          }
          oldBookinData = oldBookingResponse?.data;
        }
        let where = {
          vehicle_id: ObjectId(vehicle_id),
          $or: [
            { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
            { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
            { end_time: { $gt: startTime, $lte: endTime } }, // booking ends during another booking
          ],
          user_id: ObjectId(user_id),
        };
        let selectedVehicleBookingResponse = await getDataArray(Bookings, where, "");
        if (selectedVehicleBookingResponse?.status) {
          resolve(helpers.showResponse(false, "You have already booked a parking lot for selected time and selected vehicle", null, null, 200));
          return false;
        }
        let vehicleTypeResponse = await getSingleData(VehicleType, { _id: ObjectId(vehicle_type), status: { $ne: 2 } }, "");
        if (!vehicleTypeResponse?.status) {
          return resolve(helpers.showResponse(false, 'Invalid vehicle type', null, null, 200));
        }
        let vehicleTypeData = vehicleTypeResponse.data;
        let total_slots = vehicleTypeData?.slots;
        let conflictingBookingsQuery = {
          vehicle_type,
          status: { $ne: 2 },
          $or: [
            { start_time: { $lt: endTime },end_time: { $gt: startTime } }, // booking overlaps with another booking
            { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
            { end_time: { $gt: startTime, $lte: endTime } }, // booking ends during another booking
          ],
        };
        let total_booked_slot = 0;
        let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, "");
        if (conflictingBookingsResponse?.status) {
          total_booked_slot = conflictingBookingsResponse?.data?.length;
        }
        let total_available_slot = total_slots - total_booked_slot;
        if(total_available_slot <= 0){
          return resolve(helpers.showResponse(false, 'Sorry !!! No empty space for parking', null, null, 200))
        }

        // make payment
        let payObj = {
          amount: Number(total_amount) * 100, // amount received from appside
          currency: "usd",
          source: card_id,
          description: `Book ${slot_type} slot for my ${vehicleTypeData.vehicle_Type}`,
          customer: userData.stripe_id,
        };
        
        const charge = await stripe.charges.create(payObj);
        if (charge.status === "succeeded") {
          // payment done
          let newObj = {
            user_id: ObjectId(user_id),
            vehicle_id: ObjectId(vehicle_id),
            start_time: startTime,
            end_time: endTime,
            slot_type,
            vehicle_type: ObjectId(vehicle_type),
            vehicle_type_key: vehicleTypeData.vehicle_type_key,
            payment_object: charge,
            time_zone,
            booking_ref: oldBookinData ? oldBookinData?.booking_ref : helpers.randomStr(4, "0123498765"),
            booking_status: 1,
          };
          let bookingRef = new Bookings(newObj);
          let response = await postData(bookingRef);
          if (response.status) {
            let bookingResponseData = response.data;
            let timeData = await helpers.changeTimeZoneSettings(time_zone, bookingResponseData.createdAt, bookingResponseData.start_time, bookingResponseData.end_time);
            let bookingData = {
              user_name: userData.username,
              email: userData.email,
              phone_number : userData.phone_number,
              booking_creation_time : timeData.data.booking_creation_time,
              booking_start_time : timeData.data.booking_start_time,
              booking_end_time : timeData.data.booking_end_time,
              slot_type : response.data.slot_type,
              total_cost : response.data.payment_object.amount / 100,
              booking_reference_no : response.data.booking_ref,
              vehicle_type : vehicleTypeData.vehicle_Type
            }
            let pdfResponse = await helpers.createBookingInvoicePDF(bookingData);
            pdfResponse.status == true ? (bookingData.pdf_fileName = pdfResponse.data) : (bookingData.pdf_fileName = null);
            await helpers.sendBookingMailToUserAws(bookingData);
            await helpers.sendBookingMailToAdminAws(bookingData);
            resolve(helpers.showResponse(true, "Parking Lot has been assigned", response?.data, null, 200));
          }
          resolve(helpers.showResponse(false, "Booking Error !!! Please Try Again Later", null, null, 200));
        }
        resolve(helpers.showResponse(false, "Stripe Error !!! Please Try Again Later", null, null, 200));
      } catch (err) {
        console.log(err)
        resolve(helpers.showResponse(false, err.message, err, null, 200));
      }
    });
  },

  getAllBookings: async (data, user_id) => {
    const { time_zone } = data;
    const currentTimeZone = moment().tz(time_zone).format();
    let populate = [{
        path: "vehicle_id",
      },
    ];
    const inputTime = moment(currentTimeZone).utc().format();
    const toUtcDate = moment(inputTime).toDate();
    let response_data = {
      upcoming: [],
      completed: [],
      active: [],
    };
    let upcomingQuery = {
      user_id: ObjectId(user_id),
      start_time: { $gte: toUtcDate },
    };
    let upcoming_data = await getDataArray(Bookings, upcomingQuery, "", null, null, populate);
    response_data.upcoming = upcoming_data?.status ? upcoming_data?.data : [];
    let completedQuery = {
      user_id: ObjectId(user_id),
      end_time: { $lte: toUtcDate },
    };
    let completed_data = await getDataArray(Bookings, completedQuery, "", null, null, populate);
    response_data.completed = completed_data?.status ? completed_data?.data : [];
    let activeQuery = {
      user_id: ObjectId(user_id),
      $and: [
        { start_time: { $lte: toUtcDate } },
        { end_time: { $gte: toUtcDate } }
      ],
    };
    let active_data = await getDataArray(Bookings, activeQuery, "", null, null, populate);
    response_data.active = active_data?.status ? active_data?.data : [];
    return helpers.showResponse(true, "Successfully fetched bookings", response_data, null, 200);
  },

  autoUpdateBooking: async () => {
    let queryObject = { booking_status: { $ne: 2 }, end_time: { $lte: new Date() } };
    let response = await updateByQuery(Bookings, { booking_status: 2 }, queryObject);
    if (response) {
      return helpers.showResponse(true, "successfully updated", null, null, 200);
    }
    return helpers.showResponse(false, "Failed to update", null, null, 200);
  },

  addBookingSpaceNumber : async(data) => {
    let { slot_number, booking_id } = data;
    let allBookingsResult = await getDataArray(Bookings, { booking_status : { $eq : 1 } });
    if(!allBookingsResult.status){
      return helpers.showResponse(false, "No bookings found yet", null, null, 200);
    }
    let allBookingsData = allBookingsResult.data;
    let isExsit = false;
    for (let i = 0; i < allBookingsData.length; i++) {
      if (allBookingsData[i].slot_number == slot_number) {
        isExsit = true;
      }
    }
    if(isExsit){
      return helpers.showResponse(false, "This slot is already is use, please choose other space for parking your truck", null, null, 200);
    }
    let query = { _id : ObjectId(booking_id), booking_status : { $ne : 2 } }
    let bookingResult = await getSingleData(Bookings, query, '');
    if(!bookingResult.status){
      return helpers.showResponse(false, "No active booking found", null, null, 200);
    }
    let vehicle_type = bookingResult.data.vehicle_type;
    let vehicleResult = await getSingleData(VehicleType, { _id : ObjectId(vehicle_type), status : { $ne : 0 } }, '');
    if(!vehicleResult.status){
      return helpers.showResponse(false, "Invalid Vehicle", null, null, 200);
    }
    let vehicleTotalSlots = vehicleResult.data.slots;
    if(slot_number == 0 ||  slot_number > vehicleTotalSlots){
      return helpers.showResponse(false, "Entered slot is unavailable!!", null, null, 200);
    }
    let result = await updateData(Bookings, { slot_number : slot_number }, ObjectId(booking_id));
    if(result.status){
      return helpers.showResponse(true, "successfully updated slot number", null, null, 200);
    }
    return helpers.showResponse(false, "Server Error!! Failed to update slot number", null, null, 200);
  }
  
}

module.exports = {
  ...BookingsUtils,
};