var mongoose = require('mongoose');
const { constValues } = require('../services/helper/constants');

const vehicleSchema = mongoose.Schema(
  {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userSchema",
    },
    license_plate: {
      type: String,
      default: "",
    },
    us_dot: {
      type: String,
      default: "",
    },
    truck_makes: {
      type: String,
      default: "",
    },
    company_name: {
      type: String,
      default: "",
    },
    Truck_color: {
      type: String,
      default: "",
    },
    default_vehicle: {
      type: Boolean,
      default: false,
    },
    vehicle_pics: [
      {
        index: '',
        value: ""
      }
    ],
    status: {
      type: Number,
      default: constValues.vehicle_active,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('vehicle', vehicleSchema, 'vehicle')