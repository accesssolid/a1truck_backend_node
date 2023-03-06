require("../../db_functions");
let ObjectId = require("mongodb").ObjectID;
let helpers = require("../../services/helper");
let Users = require("../../models/Users")
let Bookings = require("../../models/Bookings")
// let nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.Stripe_Secret_Key);
let slots = {
  truck: 21,
  bobtail: 10
}
let prices = [{
  truck: {
    daily: 50,
    weekly: 100,
    monthly: 200,
  }
}, {
  bobtail: {
    daily: 70,
    weekly: 120,
    monthly: 220,
  }
}]

let BookingsUtils = {

  getEmptySlotCount: async (data, user_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let availableSlots = []
        let { startTime, endTime, vehicle_type } = data
        startTime = new Date(startTime)
        endTime = new Date(endTime)
        for (let i = 1; i <= slots[vehicle_type]; i++) {
          // check conflicts of slot
          let conflictingBookingsQuery = {
            vehicle_type,
            status: { $ne: 2 },
            slot_number: i,
            $or: [
              { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
              { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
              { end_time: { $gt: startTime, $lte: endTime } } // booking ends during another booking
            ]
          }
          let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, '')
          if (!conflictingBookingsResponse?.status) {
            availableSlots.push(i)
          }
        }
        resolve(helpers.showResponse(true, "Here is a count of available slots", availableSlots.length, null, 200));
      } catch (err) {
        console.log("in catch err", err)
        resolve(helpers.showResponse(true, "Here is a count of available slots", 0, null, 200));
      }
    })
  },

  checkSlotAvailabilty: async (data, user_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let { startTime, endTime, slot_type, vehicle_type, card_id, vehicle_id } = data
        startTime = new Date(startTime)
        endTime = new Date(endTime)
        let userResponse = await getSingleData(Users, { _id: ObjectId(user_id), status: { $ne: 2 } }, '')
        if (!userResponse?.status) {
          return helpers.showResponse(false, "Invalid User", null, null, 200);
        }
        let userData = userResponse?.data
        let slot_number = 1
         // checkSlot already booked for particular time for this vehicle
         let where = {
          vehicle_id: ObjectId(vehicle_id),
          start_time: startTime,
          end_time: endTime,
          user_id: ObjectId(user_id)
        }
        let selectedVehicleBookingResponse = await getDataArray(Bookings, where, '')
        if(selectedVehicleBookingResponse?.status) {
          resolve(helpers.showResponse(false, "You have already booked a parking lot for selected time and selected vehicle", null, null, 200));
          return false
        }
        for (let i = 1; i <= slots[vehicle_type]; i++) {
          // check conflicts of slot
          let conflictingBookingsQuery = {
            vehicle_type,
            status: { $ne: 2 },
            slot_number: i,
            $or: [
              { start_time: { $lt: endTime }, end_time: { $gt: startTime } }, // booking overlaps with another booking
              { start_time: { $gte: startTime, $lt: endTime } }, // booking starts during another booking
              { end_time: { $gt: startTime, $lte: endTime } } // booking ends during another booking
            ]
          }
          let conflictingBookingsResponse = await getDataArray(Bookings, conflictingBookingsQuery, '')
          if (!conflictingBookingsResponse?.status) {
            slot_number = i
            break
          }
        }
        let amount = 0
        let priceFilter = prices.filter(p => p[vehicle_type])
        if (priceFilter.length > 0) {
          amount = priceFilter[0][vehicle_type][slot_type]
        }
        // make payment
        let payObj = {
          amount: parseFloat(amount * 100),
          currency: 'usd',
          source: card_id,
          description: `Book ${slot_type} slot for my ${vehicle_type}`,
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
            vehicle_type,
            payment_object: JSON.stringify(charge),
            slot_number,
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

  getAllBookings : async(user_id) => {
    let populate = [{
      path: 'vehicle_id'
    }]
    let result = await getDataArray(Bookings, { user_id : ObjectId(user_id) }, '', null, null, populate);
    if(result.status){
      let newData = result.data;
      let parsedData = newData.map(item => {
          return {
            _id : item._id,
            user_id : item.user_id,
            vehicle_id : item.vehicle_id,
            start_time : item.start_time,
            end_time : item.end_time,
            end_time : item.end_time,
            booking_type : item.slot_type,
            vehicle_type : item.vehicle_type,
            payment_object : {
              amount : JSON.parse(item.payment_object).amount / 100,
              brand : JSON.parse(item.payment_object).payment_method_details.card.brand,
              last4 : JSON.parse(item.payment_object).payment_method_details.card.last4
            },
            slot_number : item.slot_number,
            booking_ref : item.booking_ref,
            booking_status : item.booking_status,
            createdAt : item.createdAt,
            updatedAt : item.updatedAt
          }
      });
      let completed_bookings = parsedData.filter(item => item.booking_status === 2);
      let other_bookings = parsedData.filter(item => item.booking_status === 1 );
      let bookings = {
        completed_bookings,
        other_bookings
      }
      return helpers.showResponse(true, 'Successfully fetched bookings', bookings, null, 200);
    }
    return helpers.showResponse(false, 'Bookings not found', null, null, 200);
  }
  
};

module.exports = {
  ...BookingsUtils,
};
