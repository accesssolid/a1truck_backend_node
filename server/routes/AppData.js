const express = require("express");
const router = express();
const ContactControllers = require("../controllers/Contact");
const ratingAppController = require("../controllers/RatingApp");
const middleware = require("../controllers/middleware");

// contact us
router.post("/contact_us", ContactControllers.addcontact);
router.post('/about_us', ContactControllers.aboutUs);
router.post('/why_a1_truck', ContactControllers.whyA1Truck);
router.post('/services_and_amenities', ContactControllers.servicesAndAmenities);

// App Rating
router.post("/rating", middleware.checkToken, ratingAppController.addrating);
router.get("/rating", middleware.checkToken, ratingAppController.getrating);

// Common Routes
router.get("*", (req, res) => {
  res.status(405).json({ status: false, message: "Invalid Get Request" });
});

router.post("*", (req, res) => {
  res.status(405).json({ status: false, message: "Invalid Post Request" });
});

module.exports = router;