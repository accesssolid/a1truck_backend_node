var express = require('express');
var router = express.Router();
var AdministratorController = require('../controllers/Administrator');
var commonController = require('../controllers/Common');
var middleware = require("../controllers/middleware");

// without token
router.post('/login', AdministratorController.login);
router.post('/forget_password', AdministratorController.forgotPassword);
router.post('/verify_otp', AdministratorController.verifyOtp);
router.post('/reset_password', AdministratorController.resetPassword);
router.post('/logout', AdministratorController.logout);

router.post('/create_slots', middleware.checkAdminToken, AdministratorController.createSlots);
router.post('/check_slot_exist', middleware.checkAdminToken, AdministratorController.checkSlotExist);
router.get('/get_admin_detail', middleware.checkAdminToken, AdministratorController.getAdminDetail);
router.post('/add_profile_pic', middleware.checkAdminToken, AdministratorController.addProfilePicture);
router.post('/change_password', middleware.checkAdminToken, AdministratorController.changePassword);
router.post('/update_profile', middleware.checkAdminToken, AdministratorController.updateProfile);


// Admin Routes with Token
router.post('/faq',  commonController.Addfaq);
router.patch('/faq',  commonController.updatefaq);
router.get('/faq',  commonController.getAllfaq);
router.delete('/faq/:_id',  commonController.deletefaq);

// Vehicle Type
// router.post('/add_vehicleType',  commonController.Add_VehicleType);
router.patch('/update_vehicleType',  commonController.Update_VehicleType);
router.get('/all_vehicleType',  commonController.all_vehicleType);
router.get('/vehicleType/:_id',  commonController.vehicleTypeId);

// Booking Type
router.patch('/bookingType',  commonController.addBookingType);
router.get('/bookingType',  commonController.getBookingType);

// Terms & Privacy & how its work
router.patch('/terms', commonController.AddTermsContent);
router.get('/terms',commonController.getTermsContent);

// Admin panel apis.
router.post('/get_all_users_details_admin', middleware.checkAdminToken, AdministratorController.getAllUsersDetailsAdmin);
router.post('/delete_user_by_admin', middleware.checkAdminToken, AdministratorController.deleteUserByAdmin);
router.post('/get_admin_dashboard_count', middleware.checkAdminToken, AdministratorController.getAdminDashboardCount);
router.post('/get_all_bookings_admin', middleware.checkAdminToken, AdministratorController.getAllBookingsAdmin);
router.post('/get_contact_us_admin', middleware.checkAdminToken, AdministratorController.getContactUsAdmin);
router.post('/contact_to_user_by_admin', middleware.checkAdminToken, AdministratorController.contactToUserByAdmin);
router.post('/add_truck_make_and_color_admin', middleware.checkAdminToken, AdministratorController.addTruckMakeAndColorAdmin);
router.post('/delete_truck_make_and_color', middleware.checkAdminToken, AdministratorController.deleteTruckMakeAndColor);
router.post('/update_prices_and_slots', middleware.checkAdminToken, AdministratorController.updatePricesAndSlots);
router.post('/fire_custom_notification', middleware.checkAdminToken, AdministratorController.customNotification);
router.get('/get_prices_and_slots_admin', middleware.checkAdminToken, AdministratorController.getPricesAndSlots);
router.get('/get_truck_make_and_color', middleware.checkAdminToken, AdministratorController.getTruckMakeAndColor);
router.post('/get_dashboard_data_by_admin', middleware.checkAdminToken, AdministratorController.getDashBoardData);
router.post('/export_bookings_documents', middleware.checkAdminToken, AdministratorController.exportBookingsDocument);
router.post('/export_users_documents', middleware.checkAdminToken, AdministratorController.exportUsersDocument);

// Common Routes
router.get('*',(req, res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req, res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});

module.exports = router;