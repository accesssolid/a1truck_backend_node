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
            type: Number,
            default: 0,
        },
        weekly : {
            type: Number,
            default: 0,
        },
        monthly : {
            type: Number,
            default: 0,
        },
        // half_yearly : {
        //     type : Number,
        //     default : 0
        // },
        yearly : {
            type : Number,
            default : 0
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