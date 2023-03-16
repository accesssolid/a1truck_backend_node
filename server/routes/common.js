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
router.post('/get_vehicle_price_data', middleware.checkToken, commonController.getVehicleData);

 /** booking type */
router.get('/bookingType', middleware.checkToken,  commonController.getBookingType);

 /** FAQ */
router.get('/faq', middleware.checkToken, commonController.getAllfaq);

// Fire notifications.
router.post('/fire_notification_on_daily_event', commonController.fireNotificationOnDailyEvents);
router.post('/fire_notification_on_upcoming_event', commonController.fireNotificationOnUpcomingEvent);
router.post('/fire_notification_on_weekly_and_monthly_event', commonController.fireNotificationOnWeeklyAndMonthlyEvent);

// get user notification.
router.post('/get_user_notifications', middleware.checkToken, commonController.getUserNotifications);
router.post('/is_read_notification', middleware.checkToken, commonController.isReadNotification);
router.post('/enable_disable_notification', middleware.checkToken, commonController.enableDisableNotification);

// Common Routes
router.get('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});

module.exports = router;