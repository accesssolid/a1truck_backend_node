var express = require('express');
var router = express.Router();
var BookingsController = require('../controllers/Bookings');
var middleware = require("../controllers/middleware");

// Users Routes with token
router.post('/get_empty_slots_count',middleware.checkToken, BookingsController.getEmptySlotCount);
router.post('/check_slot_availability',middleware.checkToken, BookingsController.checkSlotAvailabilty);

router.post('/get_all_bookings', middleware.checkToken, BookingsController.getAllBookings);

// Common Routes
router.get('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});

module.exports = router;