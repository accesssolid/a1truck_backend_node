var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userSchema'
    },
    notification_type : {
        type : String,
        default : ''
    },
    title : {
        type : String
    },
    message : {
        type : String
    },
    is_read : {
        type : Number,
        default : 0
    },
    status : {
        type : Number,
        default : 0
    },
    booking_no : {
        type : String,
        default : ''
    },
    notification_data : {}
},
    { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema, 'Notification');