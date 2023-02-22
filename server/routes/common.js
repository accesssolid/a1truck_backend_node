var express = require('express');
var commonController = require('../controllers/Common');
var router = express.Router();
var middleware = require("../controllers/middleware");

// without Token routes
router.patch('/terms', commonController.AddTermsContent);
router.get('/terms',middleware.checkToken, commonController.getTermsContent);



// with admin token routes

// with user token routes
 /** vehicle type */
router.get('/all_vehicleType',middleware.checkToken,  commonController.all_vehicleType);
router.get('/vehicleType/:_id',middleware.checkToken,  commonController.vehicleTypeId);
 /** booking type */
router.get('/bookingType', middleware.checkToken,  commonController.getBookingType);
 /** FAQ */
router.get('/faq',middleware.checkToken,   commonController.getAllfaq);
// Common Routes
router.get('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});
module.exports = router;