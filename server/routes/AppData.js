const express = require("express");
const router = express();
const ContactControllers = require("../controllers/Contact");
const ratingAppController = require("../controllers/RatingApp");
const middleware = require("../controllers/middleware");


// contact us
router.post(
  "/contact_us",
  middleware.checkToken,
  ContactControllers.addcontact
);
// App Rating
router.post(
  "/rating",
  middleware.checkToken,
  ratingAppController.addrating
);
router.get(
  "/rating",
  middleware.checkToken,
  ratingAppController.getrating
);

// Common Routes
router.get("*", (req, res) => {
  res.status(405).json({ status: false, message: "Invalid Get Request" });
});
router.post("*", (req, res) => {
  res.status(405).json({ status: false, message: "Invalid Post Request" });
});
module.exports = router;


