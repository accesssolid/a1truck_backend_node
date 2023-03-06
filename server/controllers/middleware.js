const PRIVATE_KEY = process.env.PRIVATE_KEY;
let jwt = require("jsonwebtoken");
var helpers = require("../services/helper");
let Administration = require("../utils/Administration");
const { getUserDetail } = require("../utils/Users");
let Users = require("../utils/Users");
const mongoose = require("mongoose");
const { constValues } = require("../services/helper/constants");
const ObjectId = mongoose.Types.ObjectId;

const middleware = {
  checkToken: async (req, res, next) => {
    let token = req.headers["access_token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "Something went wrong with token" });
    }
    token = token.split(" ")[1];
    if (token) {
      jwt.verify(token, PRIVATE_KEY, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            status: false,
            message: "Something went wrong with token",
          });
        }
        let _id = decoded._id;
        let query = [
          {
            $match: {
              _id: ObjectId(_id),
            },
          },
          { $project: { otp: 0, __v: 0 } },
        ];
        let response = await getUserDetail(query);
        if (response?.data?.user_status == constValues.user_delete) {
          return res.status(451).json({
            status: false,
            message:
              "Your Account has been deleted by Super Admin !!! Please Contact Administrator",
          });
        }
        if (!response?.status) {
          return res.status(423).json({
            status: false,
            message: response?.message,
          });
        }
        req.decoded = decoded;
        req.token = token;
        next();
      });
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Something went wrong with token" });
    }
  },

  checkAdminToken: async (req, res, next) => {
    let token = req.headers["access_token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "Something went wrong with token" });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }
    if (token) {
      jwt.verify(token, PRIVATE_KEY, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            status: false,
            message: "Something went wrong with token",
          });
        }
        let admin_id = decoded.admin_id;
        let response = await Administration.getAdminDetail(admin_id);
        if (!response.status) {
          return res.status(451).json({
            status: false,
            message:
              "Your Account has been deleted by Super Admin !!! Please Contact Administrator",
          });
        }
        if (!response.data.status) {
          return res.status(423).json({
            status: false,
            message:
              "Your account login has been disabled by Super Admin !!! Please contact Administrator",
          });
        }
        req.decoded = decoded;
        req.token = token;
        next();
      });
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Something went wrong with token" });
    }
  },

  refreshToken: async (req, res) => {
    let requiredFields = ["type", "_id"];
    let validator = helpers.validateParams(req, requiredFields);
    if (!validator.status) {
      response = helpers.showResponse(false, validator.message);
      return res.status(203).json(response);
    }
    let { type, _id } = req.body;
    if (type === "Users") {
      let query = [{
        $match: {
          _id: ObjectId(_id)
        },
      },
      { $project: { otp: 0, __v: 0 } }];
      let result = await Users.getUserDetail(query);
      if (!result.status) {
        return res
          .status(403)
          .json(helpers.showResponse(false, "Invalid User"));
      }
      let userData = result.data;
      if (userData.status == 0) {
        return res
          .status(451)
          .json(
            helpers.showResponse(
              false,
              "Your account login has been disabled by admin !!! Please contact administrator"
            )
          );
      }
      if (userData.status == 2) {
        return res
          .status(423)
          .json(
            helpers.showResponse(
              false,
              "Your Account has been deleted by admin !!! Please register again"
            )
          );
      }
      let token = jwt.sign({_id, email: userData?.email }, PRIVATE_KEY, {
        expiresIn: process.env.TOKEN_EXPIRE,
      });
      data = { token: token, time: process.env.TOKEN_EXPIRE };
      return res
        .status(200)
        .json(helpers.showResponse(true, "New Token", data));
    } else if (type === "admin") {
      let result = await Administration.getDetails(_id);
      if (!result.status) {
        return res
          .status(403)
          .json(helpers.showResponse(false, "Invalid Administrator"));
      }
      let AdminData = result.data;
      if (AdminData.status == 0) {
        return res
          .status(451)
          .json(
            helpers.showResponse(
              false,
              "Your account login has been disabled by super admin !!! Please contact super administrator"
            )
          );
      }
      if (AdminData.status == 2) {
        return res
          .status(423)
          .json(
            helpers.showResponse(
              false,
              "Your Account has been deleted by super admin !!! Please register again"
            )
          );
      }
      let token = jwt.sign({ admin_id: _id }, PRIVATE_KEY, {
        expiresIn: process.env.TOKEN_EXPIRE,
      });
      data = { token: token, time: process.env.TOKEN_EXPIRE };
      return res
        .status(200)
        .json(helpers.showResponse(true, "New Token", data));
    } else {
      return res
        .status(401)
        .json(helpers.showResponse(false, "Invalid User Type"));
    }
  },
}

module.exports = {
  ...middleware,
};
