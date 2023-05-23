var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RenewedBookings = new Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userSchema'
    },
    old_booking_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bookings'
    },
    start_time : {
        type: Date,
        required: true
    },
    end_time : {
        type: Date,
        required: true
    },
    renewed_booking_status : {
        type: Number,
        default: 0 // 0 -> pending renewed booking, 1 -> accepted renewed booking, 2 -> cancelled renewed booking.
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('RenewedBookings', RenewedBookings, 'RenewedBookings');