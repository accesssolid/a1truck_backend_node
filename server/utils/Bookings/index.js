require("../../db_functions");
let ObjectId = require("mongodb").ObjectId;
let helpers = require("../../services/helper");
let Users = require("../../models/Users");
let Bookings = require("../../models/Bookings");
const moment = require("moment-timezone");
const stripe = require("stripe")(process.env.Stripe_Secret_Key);
const VehicleType = require("../../models/VehicleType");
const RenewedBookings = require('../../models/RenewedBookings');

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
        let vehicleTypeData = vehicleTypeResponse?.data;
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
        let { startTime, endTime, slot_type, vehicle_type, card_id, vehicle_id, time_zone, total_amount, type, slot_required } = data;
        startTime = new Date(startTime);
        endTime = new Date(endTime);
        let userResponse = await getSingleData(Users, { _id: ObjectId(user_id), status: { $ne: 2 } }, "");
        if (!userResponse?.status) {
          return helpers.showResponse(false, "Invalid User", null, null, 200);
        }
        let userData = userResponse?.data;
        let slot_number = 0;
        let oldBookinData = null;
        if (type == "renew") {
          // get old booking_data
          let { old_booking_id } = data;
          let oldBookingResponse = await getSingleData(Bookings, { _id: ObjectId(old_booking_id), status: { $eq: 1 } }, "");
          if (!oldBookingResponse?.status) {
            return helpers.showResponse(false, "Sorry !!! Invalid Booking Reference", null, null, 200);
          }
          oldBookinData = oldBookingResponse?.data;
          slot_number = oldBookinData?.slot_number;
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
          return helpers.showResponse(false, "Invalid vehicle type", null, null, 200);
        }
        let vehicleTypeData = vehicleTypeResponse.data;
        if (oldBookinData && slot_required == '1') {
          let conflictingBookingsQuery = {
            vehicle_type: ObjectId(vehicle_type),
            booking_status : { $ne: 2 },
            slot_number,
            $or: [
              { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
              { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
              { end_time: { $gt: startTime, $lte: endTime } }, // booking ends during another booking
            ],
          };
          let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, '');
          if (!conflictingBookingsResponse?.status) {
            slot_number;
          } else {
            // request to Admin if booking already available to requested slot.
            let newObj =  {
              user_id : ObjectId(user_id),
              old_booking_id : ObjectId(old_booking_id),
              start_time : startTime,
              end_time : endTime
            }
            let RenewedBookingRef = new RenewedBookings(newObj);
            let RenewedBookingResult = await postData(RenewedBookingRef);
            if(RenewedBookingResult.status){
              let RenewedData = RenewedBookingResult.data;
              let timeData = await helpers.changeTimeZoneSettings(time_zone, RenewedData.createdAt, RenewedData.start_time, RenewedData.end_time);
              let renewedBookingData = {
                user_name : userData.username,
                booking_creation_time : timeData.booking_creation_time,
                booking_start_time : timeData.booking_start_time,
                booking_end_time : timeData.booking_end_time,
                slot_type : oldBookinData.slot_type,
                booking_reference_no : oldBookinData.booking_ref,
                slot_number : oldBookinData.slot_number,
                vehicle_type : vehicleTypeData.vehicle_Type,
              }
              await helpers.sendRenewedBookingMailToAdmin(renewedBookingData);
              return helpers.showResponse(true, "Renewed booking request has sent to admin", null, null, 200);
            }
            return helpers.showResponse(false, "Server Error, Failed to renew booking.", null, null, 200);
          }

        } else {
          for (let i = 1; i <= vehicleTypeData.slots; i++) {
            // check conflicts of slot
            let conflictingBookingsQuery = {
              vehicle_type: ObjectId(vehicle_type),
              booking_status : { $ne: 2 },
              slot_number: i,
              $or: [
                { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
                { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
                { end_time: { $gt: startTime, $lte: endTime } }, // booking ends during another booking
              ],
            };
            let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, "");
            if (!conflictingBookingsResponse?.status) {
              slot_number = i;
              break;
            }
          }
        }

        if (slot_number == 0) {
          return helpers.showResponse(false, "No slots found", null, null, 200);
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
            slot_number,
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
              slot_number : response.data.slot_number,
              vehicle_type : vehicleTypeData.vehicle_Type
            }
            let pdfResponse = await helpers.createBookingInvoicePDF(bookingData);
            pdfResponse.status == true ? (bookingData.pdf_fileName = pdfResponse.data) : (bookingData.pdf_fileName = null);
            await helpers.sendBookingMailToUser(bookingData);
            await helpers.sendBookingMailToAdmin(bookingData);
            resolve(helpers.showResponse(true, "Parking Lot has been assigned", response?.data, null, 200));
          }
          resolve(helpers.showResponse(false, "Booking Error !!! Please Try Again Later", null, null, 200));
        }
        resolve(helpers.showResponse(false, "Stripe Error !!! Please Try Again Later", null, null, 200));
      } catch (err) {
        resolve(helpers.showResponse(false, "Slot Error !!! Please Try Again Later", err, null, 200));
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
    let response_data = {
      upcoming: [],
      completed: [],
      active: [],
    };
    let upcomingQuery = {
      user_id: ObjectId(user_id),
      start_time: { $gte: new Date(currentTimeZone).toISOString() },
    };
    let upcoming_data = await getDataArray(Bookings, upcomingQuery, "", null, null, populate);
    response_data.upcoming = upcoming_data?.status ? upcoming_data?.data : [];
    let completedQuery = {
      user_id: ObjectId(user_id),
      end_time: { $lte: new Date(currentTimeZone).toISOString() },
    };
    let completed_data = await getDataArray(Bookings, completedQuery, "", null, null, populate);
    response_data.completed = completed_data?.status ? completed_data?.data : [];
    let activeQuery = {
      user_id: ObjectId(user_id),
      $and: [
        { end_time: { $gte: new Date(currentTimeZone).toISOString() } },
        { start_time: { $lte: new Date(currentTimeZone).toISOString() } },
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
  }
  
}

module.exports = {
  ...BookingsUtils,
};
