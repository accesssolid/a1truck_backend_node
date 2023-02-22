var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');

const VehiclTypeSchema=mongoose.Schema({
    vehicle_Type: {
        type: String,
        default: ''
    },
    price: {
        type: String,
        default: ""
    },
    status: {
        type: Number,
        default: 1
    },
},{ timestamps: true })
module.exports = mongoose.model('VehiclType', VehiclTypeSchema, 'VehiclType');