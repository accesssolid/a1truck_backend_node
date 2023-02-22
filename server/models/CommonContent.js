var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const commanSchema=mongoose.Schema({
    terms_condition:{
        type:String,
        dafault:""
    },
    privacy_policy: {
        type: String,
        default: ''
    },
    how_working: {
        type: String,
        default: ''
    },
    truck_makes: {
        type: Array,
        default: []
    },
    truck_colors: {
        type: Array,
        default: []
    },
},{ timestamps: true })
module.exports = mongoose.model('CommonContent', commanSchema, 'common_content');