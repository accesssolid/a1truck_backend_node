var express = require('express');
var router = express.Router();
var AdministratorController = require('../controllers/Administrator');
var commonController = require('../controllers/Common');
var middleware = require("../controllers/middleware");

// without token


// Admin Routes with Token
router.post('/faq',  commonController.Addfaq);
router.patch('/faq',  commonController.updatefaq);
router.get('/faq',  commonController.getAllfaq);
router.delete('/faq/:_id',  commonController.deletefaq);

// Vehicle Type
router.post('/add_vehicleType',  commonController.Add_VehicleType);
router.patch('/update_vehicleType',  commonController.Update_VehicleType);
router.get('/all_vehicleType',  commonController.all_vehicleType);
router.get('/vehicleType/:_id',  commonController.vehicleTypeId);

// Booking Type
router.patch('/bookingType',  commonController.addBookingType);
router.get('/bookingType',  commonController.getBookingType);

// Terms & Privacy & how its work
router.patch('/terms', commonController.AddTermsContent);
router.get('/terms',commonController.getTermsContent);
// Common Routes
router.get('*',(req, res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req, res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});
module.exports = router;