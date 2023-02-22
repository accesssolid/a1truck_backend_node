require("../../db_functions");
let Vehicle = require("../../models/Vehicles");
let ObjectId = require("mongodb").ObjectID;
let helpers = require("../../services/helper");
let moment = require("moment");
const { constValues, statusCodes } = require("../../services/helper/constants");
const Messages = require("../Users/messages");

const VehicleUtils = {
  addVehicle: async (data) => {
    try {
      let { _id } = data?.decoded;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let {
        license_plate,
        us_dot,
        truck_makes,
        company_name,
        Truck_color,
        vehicle_pics,
      } = data?.body;
      let checkVehicleExistance = await getSingleData(
        Vehicle,
        {
          license_plate,
          created_by: ObjectId(_id),
          status: { $ne: constValues.vehicle_delete },
        },
        ""
      );
      if (checkVehicleExistance.status) {
        return helpers.showResponse(
          false,
          "Vehicle is already added in your profile",
          null,
          null,
          200
        );
      }
      let newObj = {
        license_plate,
        us_dot,
        truck_makes,
        company_name,
        Truck_color,
        created_by: _id,
        vehicle_pics,
      };
    
      if ("default_vehicle" in data.body && Boolean(data.body.default_vehicle) == true) {
        newObj.default_vehicle = true;
        await updateByQuery(
          Vehicle,
          { default_vehicle: false },
          { created_by: ObjectId(_id) }
        );
      }
    
      let vehRef = new Vehicle(newObj);
      let result = await postData(vehRef);
      if (result.status) {
        return helpers.showResponse(
          true,
          "New Vehicle added successfully",
          null,
          null,
          200
        );
      }
      return helpers.showResponse(
        false,
        "Unable to add new vehicle",
        null,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  deleteVehilclepics: async (data) => {
    try {
      let { _id } = data?.decoded;

      let {
        vehicleId,

        deleted_picIds,
      } = data?.body;
      if (!helpers.isValidId(vehicleId)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let Vehicledata = await getSingleData(
        Vehicle,
        {
          _id: ObjectId(vehicleId),
          status: { $ne: constValues.vehicle_delete },
        },
        ""
      );
      if (!Vehicledata?.status) {
        return helpers.showResponse(
          false,
          "Vehicle not found",
          Vehicledata.data,
          null,
          200
        );
      }
      let updateddata = {};

      if (deleted_picIds && deleted_picIds?.length > 0) {
        if (Vehicledata?.status) {
          let newvehicle_pics = Vehicledata.data.vehicle_pics.filter(
            (vehiclePic) => !deleted_picIds.includes(vehiclePic._id.toString())
          );

          updateddata.vehicle_pics = [...newvehicle_pics];
        }
        let response = await updateData(
          Vehicle,
          updateddata,
          ObjectId(vehicleId)
        );
        if (response.status) {
          return helpers.showResponse(
            true,
            Messages.VEHICLE_IMAGE_DLETED,
            response.data,
            null,
            200
          );
        }
        return helpers.showResponse(
          false,
          Messages.VEHICLE_IMAGE_DLETED_UNABLE,
          null,
          null,
          200
        );
      }

      return helpers.showResponse(
        false,
        Messages.VEHICLE_IMAGE_DLETED_UNABLE ,
        null,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  updateVehilcle: async (data) => {
    try {
      let { _id } = data?.decoded;

      let {
        vehicleId,
        default_vehicle,
        license_plate,
        update_picIds,

        newUpdated_vehicle_pics,
      } = data?.body;
      let update_picId = JSON.parse(update_picIds);

      if (!helpers.isValidId(vehicleId)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }

      if ("license_plate" in data.body && data.body.license_plate != "") {
        let checkVehicleExistance = await getSingleData(
          Vehicle,
          {
            license_plate,
            _id: { $ne: ObjectId(vehicleId) },
            status: { $ne: constValues.vehicle_delete },
          },
          ""
        );
        if (checkVehicleExistance.status) {
          return helpers.showResponse(
            false,
            "Vehicle is already added in you profile",
            null,
            null,
            200
          );
        }
      }
      if ("default_vehicle" in data.body && Boolean(default_vehicle) == true) {
        await updateByQuery(
          Vehicle,
          { default_vehicle: false },
          { created_by: ObjectId(_id) }
        );
        data.default_vehicle = true;
      }
      let updateddata = { ...data.body };
      delete updateddata?.vehicleId;
      delete updateddata?.update_picId;
      delete updateddata?.newUpdated_vehicle_pics;

      if (update_picId && update_picId?.length > 0) {
        let Vehicledata = await getSingleData(
          Vehicle,
          {
            _id: ObjectId(vehicleId),
            status: { $ne: constValues.vehicle_delete },
          },
          ""
        );
        let picsinDb = Vehicledata.data.vehicle_pics;

        let allIdsPresent = update_picId
          .map(function (id) {
            return picsinDb.find(function (obj) {
              return obj._id.toString() === id;
            });
          })
          .every(function (obj) {
            return obj !== undefined;
          });

        if (!allIdsPresent) {
          return helpers.showResponse(
            false,
            "Not all ids in update_picId are found in vehicle",
            null,
            null,
            200
          );
        }
        if (Vehicledata?.status) {
          let newvehicle_pics = Vehicledata.data.vehicle_pics.filter(
            (vehiclePic) => !update_picId.includes(vehiclePic._id.toString())
          );

          updateddata.vehicle_pics = [
            ...newvehicle_pics,
            ...newUpdated_vehicle_pics,
          ];
        }
      }
      if (update_picId && update_picId?.length == 0) {
        let Vehicledata = await getSingleData(
          Vehicle,
          {
            _id: ObjectId(vehicleId),
            status: { $ne: constValues.vehicle_delete },
          },
          ""
        );
        let picsinDb = Vehicledata.data.vehicle_pics;

        updateddata.vehicle_pics = [...picsinDb, ...newUpdated_vehicle_pics];
      }

      let response = await updateData(
        Vehicle,
        updateddata,
        ObjectId(vehicleId)
      );
      if (response.status) {
        return helpers.showResponse(
          true,
          "Vehicle Updated",
          response.data,
          null,
          200
        );
      }
      return helpers.showResponse(
        false,
        "Unable to update vehicle at the moment",
        null,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  DeleteVehilcle: async (data) => {
    try {
      let { vehicleId } = data?.params;
      if (!helpers.isValidId(vehicleId)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let findvehicle = await Vehicle.aggregate([
        {
          $match: {
            _id: ObjectId(vehicleId),
            status: { $ne: constValues.vehicle_delete },
          },
        },
      ]);
      if (findvehicle.length < 1) {
        return helpers.showResponse(
          true,
          Messages.NOT_FOUND,
          null,
          null,
          statusCodes.success
        );
      }
      let updateddata = { status: constValues.vehicle_delete };
      let response = await updateData(
        Vehicle,
        updateddata,
        ObjectId(vehicleId)
      );
      if (response.status) {
        return helpers.showResponse(
          true,
          Messages.VEHICLE_DLETED,
          response.data,
          null,
          200
        );
      }
      return helpers.showResponse(
        false,
        Messages.SOMETHING_WRONG,
        null,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },

  getVehicle: async (data) => {
    try {
      let { _id } = data?.decoded;

      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }

      let result = await getDataArray(
        Vehicle,
        {
          created_by: ObjectId(_id),
          status: { $ne: constValues.vehicle_delete },
        },
        "",
        null,
        { default_vehicle: -1, createdAt: -1 }
      );
      if (!result.status) {
        return helpers.showResponse(
          false,
          "No Vehicles available",
          null,
          null,
          200
        );
      }
      return helpers.showResponse(
        true,
        "Here is a list of my vehicles",
        result.data,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  getVehicleByid: async (data) => {
    try {
      let { vehicleId } = data?.params;

      if (!helpers.isValidId(vehicleId)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }

      let result = await getSingleData(
        Vehicle,
        {
          _id: ObjectId(vehicleId),
          status: { $ne: constValues.vehicle_delete },
        },
        ""
      );
      if (!result.status) {
        return helpers.showResponse(
          false,
          "No Vehicles available",
          null,
          null,
          200
        );
      }
      return helpers.showResponse(
        true,
        Messages.DATA_FOUND_SUCCESS,
        result.data,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  GetDefault_vehicle: async (data) => {
    try {
      let { _id } = data?.decoded;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }

      let result = await getSingleData(
        Vehicle,
        {
          created_by: ObjectId(_id),
          default_vehicle: true,
          status: { $ne: constValues.vehicle_delete },
        },
        ""
      );
      if (!result.status) {
        return helpers.showResponse(false, Messages.NOT_FOUND, null, null, 200);
      }
      return helpers.showResponse(
        true,
        Messages.DATA_FOUND_SUCCESS,
        result.data,
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
};

module.exports = {
  ...VehicleUtils,
};
