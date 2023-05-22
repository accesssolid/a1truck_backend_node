var mongoose = require("mongoose");
const { constValues } = require("../services/helper/constants");
let moment = require('moment-timezone');

const SlotsSchema = mongoose.Schema(
  {
    
    slot_start_time: {
      type: String,
      default: "",
    },
    slot_end_time: {
      type: String,
      default: 1,
    },
    slot_number: {
      type: String,
      default: 1,
    },

    status: {
      type: Number,
      default: 1, //1:active, 2:delete
    },
    created_at: {
        type: Number,
        default: moment().unix()
    },
    updated_at: {
        type: Number,
        default: moment().unix()
    }
  },
);
module.exports = mongoose.model("Slots", SlotsSchema, "slots");
