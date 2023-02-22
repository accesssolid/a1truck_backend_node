var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');
var Schema = mongoose.Schema;
const faqSchema=mongoose.Schema({
    question:{
        type:String,
        dafault:""
    },
    answer: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: constValues.faq_active
    },
},{ timestamps: true })
module.exports = mongoose.model('FAQ', faqSchema, 'faq');