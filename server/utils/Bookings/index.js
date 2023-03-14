require("../../db_functions");
let ObjectId = require("mongodb").ObjectId;
let helpers = require("../../services/helper");
let Users = require("../../models/Users")
let Bookings = require("../../models/Bookings")
const moment = require('moment-timezone');
const stripe = require("stripe")(process.env.Stripe_Secret_Key);
const VehicleType = require('../../models/VehicleType');
// let nodemailer = require("nodemailer");

let slots = {
  truck: 21,
  bobtail: 10
}
let prices = [
  {
    truck: {
      daily: 50,
      weekly: 100,
      monthly: 200,
    }
  }, 
  {
    bobtail: {
      daily: 70,
      weekly: 120,
      monthly: 220,
    }
  }
]


let BookingsUtils = {

  getEmptySlotCount: async (data, user_id) => {

    return new Promise(async (resolve, reject) => {
      try {
        let availableSlots = []
        let { startTime, endTime, vehicle_type, time_zone } = data;
        let  startTimeZone = moment(startTime).tz(time_zone).format();
        let  endTimeZone = moment(endTime).tz(time_zone).format();

        let vehicleTypeResponse = await getSingleData(VehicleType, { _id: ObjectId(vehicle_type), status: { $ne: 2 } }, '');
        if (!vehicleTypeResponse?.status) {
          return helpers.showResponse(false, "Invalid vehicle type", null, null, 200);
        }
        let total_slots = vehicleTypeResponse?.data?.slots;
        let vehicleTypeData = vehicleTypeResponse?.data;
        let conflictingBookingsQuery = {
          vehicle_type,
          status: { $ne: 2 },
          $or: [
            { start_time: { $lt: endTimeZone }, end_time: { $gt: startTimeZone } }, // booking overlaps with another booking
            { start_time: { $gte: startTimeZone, $lt: endTimeZone} }, // booking starts during another booking
            { end_time: { $gt: startTimeZone, $lte: endTimeZone} } // booking ends during another booking
          ]
        }      
        let total_booked_slot = 0;
        let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, '');
          if (conflictingBookingsResponse?.status) {
            total_booked_slot = conflictingBookingsResponse?.data?.length;
          }
        // for (let i = 1; i <= vehicleTypeData.slots; i++) {
        //   // check conflicts of slot
        //   let conflictingBookingsQuery = {
        //     vehicle_type,
        //     status: { $ne: 2 },
        //     slot_number: i,
        //     $or: [
        //       { start_time: { $lt: endTime.toISOString() }, end_time: { $gt: startTime.toISOString() } }, // booking overlaps with another booking
        //       { start_time: { $gte: startTime.toISOString(), $lt: endTime.toISOString() } }, // booking starts during another booking
        //       { end_time: { $gt: startTime.toISOString(), $lte: endTime.toISOString() } } // booking ends during another booking
        //     ]
        //   }
        //   console.log("conflictingBookingsQuery", conflictingBookingsQuery);
        //   let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, '');
        //   if (conflictingBookingsResponse?.status) {
        //      console.log("total_stots", conflictingBookingsResponse?.data);
        //     // availableSlots.push(i)
        //   }
        // }

        let total_available_slot = total_slots - total_booked_slot;
        resolve(helpers.showResponse(true, "Here is a count of available slots", total_available_slot < 0 ? 0 : total_available_slot, null, 200));

      } catch (err) {
        console.log("in catch err", err)
        resolve(helpers.showResponse(true, "Here is a count of available slots", 0, null, 200));
      }
    });
  },

  checkSlotAvailabilty: async (data, user_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let { startTime, endTime, slot_type, vehicle_type, card_id, vehicle_id, time_zone, total_amount } = data;
        startTime = new Date(startTime)
        endTime = new Date(endTime)
        let userResponse = await getSingleData(Users, { _id: ObjectId(user_id), status: { $ne: 2 } }, '');
        if (!userResponse?.status) {
          return helpers.showResponse(false, "Invalid User", null, null, 200);
        }
        let userData = userResponse?.data;
        let slot_number = 0
        // checkSlot already booked for particular time for this vehicle
        // let where = { vehicle_id: ObjectId(vehicle_id), start_time: startTime, end_time: endTime, user_id: ObjectId(user_id) }
        let where = {
          vehicle_id : ObjectId(vehicle_id),
          $or: [
            { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
            { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
            { end_time: { $gt: startTime, $lte: endTime } } // booking ends during another booking
          ],
          user_id: ObjectId(user_id)
        }
        let selectedVehicleBookingResponse = await getDataArray(Bookings, where, '');
        if(selectedVehicleBookingResponse?.status) {
          resolve(helpers.showResponse(false, "You have already booked a parking lot for selected time and selected vehicle", null, null, 200));
          return false;
        }
        console.log(selectedVehicleBookingResponse)
        let vehicleTypeResponse = await getSingleData(VehicleType, { _id: ObjectId(vehicle_type), status: { $ne: 2 } }, '');
        if (!vehicleTypeResponse?.status) {
          return helpers.showResponse(false, "Invalid vehicle type", null, null, 200);
        }
        let vehicleTypeData = vehicleTypeResponse.data;
        for (let i = 1; i <= vehicleTypeData.slots; i++) {
          // check conflicts of slot
          let conflictingBookingsQuery = { vehicle_type : ObjectId(vehicle_type), status : { $ne: 2 }, slot_number: i,
            $or: [
              { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
              { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
              { end_time: { $gt: startTime, $lte: endTime } } // booking ends during another booking
            ]
          }
          let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, '');
          if (!conflictingBookingsResponse?.status) {
            slot_number = i;
            break
          }
        }
        if(slot_number == 0){
          return helpers.showResponse(false, "No slots found", null, null, 200);
        }
        // make payment
        let payObj = {
          amount: Number(total_amount) * 100, // amount received from appside
          currency: 'usd',
          source: card_id,
          description: `Book ${slot_type} slot for my ${vehicleTypeData.vehicle_Type}`,
          customer: userData.stripe_id
        }
        const charge = await stripe.charges.create(payObj);
        if (charge.status === "succeeded") {
        // payment done
          let newObj = {
            user_id: ObjectId(user_id),
            vehicle_id: ObjectId(vehicle_id),
            start_time: startTime,
            end_time: endTime,
            slot_type,
            vehicle_type : ObjectId(vehicle_type),
            vehicle_type_key : vehicleTypeData.vehicle_type_key,
            payment_object: charge,
            slot_number,
            time_zone,
            booking_ref: helpers.randomStr(4, "0123498765"),
            booking_status: 1
          }
          let bookingRef = new Bookings(newObj)
          let response = await postData(bookingRef)
          if (response.status) {
            resolve(helpers.showResponse(true, "Parking Lot has been assigned", response?.data, null, 200));
          }
          resolve(helpers.showResponse(false, "Booking Error !!! Please Try Again Later", null, null, 200));
        }
        resolve(helpers.showResponse(false, "Stripe Error !!! Please Try Again Later", null, null, 200));
      } catch (err) {
        resolve(helpers.showResponse(false, "Slot Error !!! Please Try Again Later", err, null, 200));
      }
    })
  },

  getAllBookings: async (data, user_id) => {
    const { time_zone } = data;
    const currentTimeZone = moment().tz(time_zone).format();
    let populate = [{
      path: 'vehicle_id'
    }];

    let response_data = {
      upcoming : [],
      completed : [],
      active : []
    }

    let upcomingQuery = { user_id: ObjectId(user_id) , start_time : { $gte: new Date(currentTimeZone).toISOString() } }
    let upcoming_data = await getDataArray(Bookings, upcomingQuery, '', null, null, populate);
    response_data.upcoming = upcoming_data?.status ? upcoming_data?.data : [];

    let completedQuery = { user_id: ObjectId(user_id) , end_time : { $lte: new Date(currentTimeZone).toISOString() } }
    let completed_data = await getDataArray(Bookings, completedQuery, '', null, null, populate);
    response_data.completed = completed_data?.status ? completed_data?.data : [];

    let activeQuery = { user_id: ObjectId(user_id) ,$and:[{ end_time : { $gte: new Date(currentTimeZone).toISOString() } } , { start_time : { $lte: new Date(currentTimeZone).toISOString() }}]}
    let active_data = await getDataArray(Bookings, activeQuery, '', null, null, populate);
    response_data.active  = active_data?.status ? active_data?.data : [];
    return helpers.showResponse(true, 'Successfully fetched bookings', response_data, null, 200);
    // if (result.status) {
      // let newData = result.data;
      // let parsedData = newData.map(item => {
      //   return {
      //     _id: item._id,
      //     user_id: item.user_id,
      //     vehicle_id: item.vehicle_id,
      //     start_time: moment.utc(item.start_time).local().format('YYYY-MM-DDTHH:mm:ssZ'), // moment.utc(isoDate).local()  localDate.format('YYYY-MM-DDTHH:mm:ssZ');  ------> convert 2023-03-09T12:07:59.716+00:00 to 2023-03-09T18:34:45+05:30 using moment js
      //     end_time: moment.utc(item.end_time).local().format('YYYY-MM-DDTHH:mm:ssZ'),
      //     booking_type: item.slot_type,
      //     vehicle_type: item.vehicle_type,
          // payment_object: {
          //   amount: JSON.parse(item.payment_object).amount / 100,
          //   brand: JSON.parse(item.payment_object).payment_method_details.card.brand,
          //   last4: JSON.parse(item.payment_object).payment_method_details.card.last4
          // },
      //     slot_number: item.slot_number,
      //     booking_ref: item.booking_ref,
      //     booking_status: item.booking_status,
      //     createdAt: item.createdAt,
      //     updatedAt: item.updatedAt
      //   };
      // });
      // let upcoming_bookings = parsedData.filter(item => currentTimeZone < item.start_time);
      // let active_bookings = parsedData.filter(item => (currentTimeZone >= item.start_time && currentTimeZone <= item.end_time));
      // let completed_bookings = parsedData.filter(item => currentTimeZone > item.end_time);
      // let bookings = {
      //   upcoming_bookings,
      //   active_bookings,
      //   completed_bookings
      // }
  },

  autoUpdateBooking : async() => {
    let result = await getDataArray(Bookings, { booking_status : { $ne : 2 }, end_time : { $lte : new Date() } }, '' );
    if(result.status){
      let responseData = result.data;
      let response = null;
      for(let i = 0; i < responseData.length; i++){
        response = await updateData(Bookings, { booking_status : 2 }, ObjectId(responseData[i]._id));
      }
      if(response){
        return helpers.showResponse(true, 'successfully updated', null, null, 200);
      }
      return helpers.showResponse(true, 'Failed to update', null, null, 200);
    }
    return helpers.showResponse(false, 'No data found', null, null, 200);
  }
  
};

module.exports = {
  ...BookingsUtils,
};