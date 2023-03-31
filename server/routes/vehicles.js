const express = require("express");
const router = express();
const vehicleControllers = require("../controllers/Vehicles");
const middleware = require("../controllers/middleware");

router.post( "/add_vehicle", middleware.checkToken, vehicleControllers.addVehicle);
router.post( "/delete_vehiclePics", middleware.checkToken, vehicleControllers.deleteVehilclePics);
router.get( "/get_vehicles", middleware.checkToken, vehicleControllers.getVehicles);
router.get( "/vehicle_byid/:vehicleId", middleware.checkToken, vehicleControllers.getVehicleByid);
router.patch( "/update_vehicle", middleware.checkToken, vehicleControllers.updateVehicle);
router.get( "/vehicle_default", middleware.checkToken, vehicleControllers.getDefault_vehicle);
router.delete( "/deleted_vehicle/:vehicleId", middleware.checkToken, vehicleControllers.deleteVehilcle);

// Common Routes
router.get("*", (req, res) => {
  res.status(405).json({ status: false, message: "Invalid Get Request" });
});
router.post("*", (req, res) => {
  res.status(405).json({ status: false, message: "Invalid Post Request" });
});
module.exports = router;