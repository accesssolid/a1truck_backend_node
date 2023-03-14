var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');

const VehiclTypeSchema=mongoose.Schema({
    vehicle_Type: {
        type: String,
        default: ''
    },
    vehicle_type_key : {
        type : String,
        default : ''
    },
    price: {
        daily : {
            type: String,
            default: '',
        },
        weekly : {
            type: String,
            default: '',
        },
        monthly : {
            type: String,
            default: '',
        }
    },
    slots : {
        type : Number,
        default : 0
    },
    status: {
        type: Number,
        default: 1
    },
},{ timestamps: true })

module.exports = mongoose.model('VehiclType', VehiclTypeSchema, 'VehiclType');