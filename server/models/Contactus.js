var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');

const contactSchema=mongoose.Schema({
    name : {
        type : String,
        default : ''
    },
    email : {
        type : String,
        default : ''
    },
    message : {
        type: String,
        default: ''
    },
    status : {
        type: Number,
        default: 1
    },
},
{ 
    timestamps: true
});

module.exports = mongoose.model('contact', contactSchema, 'contact');