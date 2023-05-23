var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AdministratorSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        default : ''
    },
    password : {
        type : String,
        default : ''
    },
    type : {
        type : String,
        default : ''
    },
    profile_pic : {
        type : String,
        default : ''
    },
    otp: {
        type : String,
        default : ''
    },
    status : {
        type : Number,
        default : 1
    },
    created_on : {
        type : Number,
        default:0
    },
    updated_on : {
        type : Number,
        default:0
    }
});
module.exports = mongoose.model('Administrator', AdministratorSchema, 'administrator');