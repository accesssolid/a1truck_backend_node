const express = require("express");
const router = express();
const ContactControllers = require("../controllers/Contact");
const ratingAppController = require("../controllers/RatingApp");
const middleware = require("../controllers/middleware");

// contact us
router.post("/contact_us", ContactControllers.addcontact);
router.post('/about_us', ContactControllers.aboutUs);
router.get('/services_and_amenities', ContactControllers.servicesAndAmenities);
router.get('/get_landing_page_video', ContactControllers.getLandingPageVideo);
router.get('/get_why_a1_truck_parking_data', ContactControllers.getWhyA1TruckParkingData);
router.get('/get_owners_saying_data', ContactControllers.getAboutAndOwnersSayingData);

// Admin panel side.
router.post('/video_upload_admin', middleware.checkAdminToken, ContactControllers.videoUploadAdmin);
router.post('/about_and_owners_saying', middleware.checkAdminToken, ContactControllers.aboutAndOwnersSaying);
router.get('/get_landing_page_data', middleware.checkAdminToken, ContactControllers.getLandingPageData);
router.post('/why_a1_truck_admin', middleware.checkAdminToken, ContactControllers.whyA1TruckAdmin);
router.post('/add_services_amenities_icon_and_content', middleware.checkAdminToken, ContactControllers.addServicesAmenitiesIconAndCaption);
router.post('/update_service_and_amenities', middleware.checkAdminToken, ContactControllers.updateServicesAndAmenities);
router.post('/delete_services_and_amenities', middleware.checkAdminToken, ContactControllers.deleteServicesAndAmenities);

// App Rating
router.post("/rating", middleware.checkToken, ratingAppController.addrating);
router.get("/rating", middleware.checkToken, ratingAppController.getrating);

// Common Routes
router.get("*", (req, res) => {
  res.status(405).json({ status : false, message : "Invalid Get Request" });
});

router.post("*", (req, res) => {
  res.status(405).json({ status : false, message : "Invalid Post Request" });
});

module.exports = router;