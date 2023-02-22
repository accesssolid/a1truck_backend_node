var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');

const contactSchema=mongoose.Schema({
    created_by:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"userSchema"
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: 1
    },
},{ timestamps: true })
module.exports = mongoose.model('contact', contactSchema, 'contact');