require("../../db_functions");
let Rating = require("../../models/RatingApp");
let ObjectId = require("mongodb").ObjectID;
let helpers = require("../../services/helper");
let moment = require('moment-timezone');
const { constValues, statusCodes } = require("../../services/helper/constants");
const Messages = require("../Users/messages");

const RatingAppUtils = {
  add_ratingApp: async (data) => {
    try {
      let { _id } = data?.decoded;
      const { message, rating } = data?.body;
      if (!helpers.isValidId(_id)) {
        return helpers.showResponse(
          false,
          Messages.NOT_VALIDID,
          null,
          null,
          statusCodes.success
        );
      }
      let checkratingExistance = await getSingleData(
        Rating,
        { created_by: ObjectId(_id), status: { $eq: 1 } },
        ""
      );
      if (checkratingExistance.status) {
        return helpers.showResponse(
          false,
          Messages.ALREADY_RATING,
          null,
          null,
          200
        );
      }
      let newObj = { message: message, created_by: _id, rating: rating };

      let vehRef = new Rating(newObj);
      let result = await postData(vehRef);
      if (result.status) {
        return helpers.showResponse(
          true,
          Messages.RATING_SUCCESS,
          null,
          null,
          statusCodes.success
        );
      }
      return helpers.showResponse(
        false,
        Messages.RATING_FAIL,
        null,
        null,
        statusCodes.success
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
  getallrating: async () => {
    try {
      let populate = [
        {
          path: "created_by",
          select: "_id username",
        },
      ];
      let result = await getDataArray(
        Rating,
        { status: { $eq: 1 } },
        null,
        null,
        { createdAt: -1 },
        populate
      );
      if (!result.status) {
        return helpers.showResponse(false, Messages.NOT_FOUND, null, null, 200);
      }
      let Avgdata = await Rating.aggregate([
        {
          $group: {
            _id: null,
            average_rating: { $avg: "$rating" },
            total_ratings: { $sum: 1 },
          },
        },
      ]);

      return helpers.showResponse(
        true,
        Messages.DATA_FOUND_SUCCESS,
        {
          data: result.data,
          avg_rating: Avgdata[0]?.average_rating,
          total_users: Avgdata[0]?.total_ratings,
        },
        null,
        200
      );
    } catch (err) {
      return helpers.showResponse(false, err.message, null, null, 200);
    }
  },
};

module.exports = {
  ...RatingAppUtils,
};
