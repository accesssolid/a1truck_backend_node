var express = require('express');
var router = express.Router();
var AuthController = require('../controllers/Users');
var middleware = require("../controllers/middleware");
const vehicleControllers = require("../controllers/Vehicles");

// Users Routes without token
router.post('/refresh', middleware.refreshToken);
router.post('/signup', AuthController.register);
router.post('/login', AuthController.login);
router.post('/otp_verification', AuthController.Otp_verification);
router.post('/forgot_password', AuthController.forgot_pass);
router.post('/new_password', AuthController.new_password);
router.post('/resendotp', AuthController.resend_otp);

// Users Routes with token
router.get('/profile',middleware.checkToken, AuthController.user_profile);
router.patch('/update_profile',middleware.checkToken, AuthController.user_Updateprofile);
router.delete('/delete_account',middleware.checkToken, AuthController.delete_account);
router.post('/change_password',middleware.checkToken, AuthController.change_pass);

//Strip
router.post('/add_card',middleware.checkToken, AuthController.addCard);
router.get('/cards',middleware.checkToken, AuthController.listCards);
router.delete('/cards',middleware.checkToken, AuthController.deleteCard);
router.patch('/default_card',middleware.checkToken, AuthController.updateCustomer);

// Common Routes
router.get('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Get Request"})});
router.post('*',(req,res) => {res.status(405).json({status:false, message:"Invalid Post Request"})});

module.exports = router;