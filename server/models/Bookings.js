var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Bookings = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userSchema'
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "vehicle"
  },
  start_time:{
    type: Date,
    required: true
  },
  end_time:{
    type: Date,
    required: true
  },
  slot_type: {  // daily, weekly, monthly, yearly
    type: String,
    default: ""
  },
  vehicle_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehiclType'
  },
  vehicle_type_key : {
    type : String,
    default : ''
  },
  payment_object: {
    type: Object,
    default: {}
  },
  slot_number: {
    type: Number,
    default: 0
  },
  booking_ref: {
    type: String,
    default: ""
  },
  booking_status: {
    type: Number,
    default: 0 // 1-> active, 2 -> expired, 0 -> upcoming
  },
  time_zone : {
    type : String,
    default : ''
  }
}, 
{
  timestamps: true
});

module.exports = mongoose.model('Bookings', Bookings, 'bookings');