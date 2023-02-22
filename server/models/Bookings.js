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
  slot_type: {
    type: String,
    default: ""
  },
  vehicle_type: {
    type: String,
    default: ""
  },
  payment_object: {
    type: String,
    default: ""
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
    default: 1 // 1-> active, 2->expired
  }
}, 
{ 
  timestamps: true 
});

module.exports = mongoose.model('Bookings', Bookings, 'bookings');