var Vehicles = require("../utils/Vehicles");
var helpers = require("../services/helper");
var ControllerMessage = require("./controllerMessages");
// let upload = require('../services/helper/image-upload')
let upload = require("../services/helper/image-uploadAWS");
let sharpfile = require("../services/helper/image_convert");

const singleUploadProfile = upload.fields([
  { name: "vehicle_pic", maxCount: 2 },
]);
const vehicleController = {
  addVehicle: async (req, res) => {
    singleUploadProfile(req, res, async (err) => {
 
      let requiredFields = [
        "license_plate",
        "us_dot",
        "truck_makes",
        "company_name",
        "Truck_color",
        "default_vehicle",
      ];
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(
          res,
          helpers.showResponse(false, validator.message),
          203
        );
      }
      if (req.files) {
        let key = "vehicle_pic";
        let imagesArray = [];
        let arrreq_image = req.files.vehicle_pic;

        for (let index = 0; index < arrreq_image?.length; index++) {
          let mime_type = arrreq_image[index]?.mimetype.split("/");
          mime_type = mime_type[0];
          if (arrreq_image && mime_type == "image") {
            let converted_image = await sharpfile.convertImageToWebp(
              arrreq_image[index]
            );
            if (converted_image.status) {
              imagesArray.push({
                value: converted_image?.data?.key,
              });
            }
          }
        }
        if (await imagesArray) {
          req.body.vehicle_pics = imagesArray;
        }
      }

      
      let result = await Vehicles.addVehicle(req);
      return helpers.showOutput(res, result, result.code);
    });
  },
  deleteVehilclePics: async (req, res) => {
    let requiredFields = ["vehicleId"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      return helpers.showOutput(
        res,
        helpers.showResponse(false, validator.message),
        203
      );
    }
    let result = await Vehicles.deleteVehilclepics(req);
    return helpers.showOutput(res, result, result.code);
  },
  updateVehicle: async (req, res) => {
    singleUploadProfile(req, res, async (err) => {
      let requiredFields = ["vehicleId", "update_picIds"];
      let validator = helpers.validateParams(req, requiredFields);
      if (!validator.status) {
        return helpers.showOutput(
          res,
          helpers.showResponse(false, validator.message),
          203
        );
      }
      if (req.files) {
        let key = "vehicle_pic";
        let imagesArray = [];
        let arrreq_image = req.files.vehicle_pic;
        for (let index = 0; index < arrreq_image?.length; index++) {
          let mime_type = arrreq_image[index]?.mimetype.split("/");
          mime_type = mime_type[0];
          if (arrreq_image && mime_type == "image") {
            let converted_image = await sharpfile.convertImageToWebp(
              arrreq_image[index]
            );
            if (converted_image.status) {
              imagesArray.push({
                value: converted_image?.data?.key,
              });
            }
          }
        }
        if (await imagesArray) {
          req.body.newUpdated_vehicle_pics = imagesArray;
        }
      }

    
      let result = await Vehicles.updateVehilcle(req);

      return helpers.showOutput(res, result, result?.code);
    });
  },

  // get vechile
  getVehicles: async (req, res) => {
    let result = await Vehicles.getVehicle(req);
    return helpers.showOutput(res, result, result.code);
  },
  getVehicleByid: async (req, res) => {
    let result = await Vehicles.getVehicleByid(req);
    return helpers.showOutput(res, result, result.code);
  },
  getDefault_vehicle: async (req, res) => {
    let result = await Vehicles.GetDefault_vehicle(req);
    return helpers.showOutput(res, result, result.code);
  },
  deleteVehilcle: async (req, res) => {
    let result = await Vehicles.DeleteVehilcle(req);
    return helpers.showOutput(res, result, result.code);
  },
};

module.exports = {
  ...vehicleController,
};
