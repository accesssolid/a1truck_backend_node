var express = require('express');
var router = express.Router();
var BookingsController = require('../controllers/Bookings');
var middleware = require("../controllers/middleware");

// Users Routes with token
router.post('/check_slot_availability',middleware.checkToken, BookingsController.checkSlotAvailabilty);

// Common Routes
router.get('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});

module.exports = router;