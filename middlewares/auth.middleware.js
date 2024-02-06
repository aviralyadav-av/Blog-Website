const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

exports.verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        message: "No token found",
      });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      res.status(401).json({
        message: "No user found with this token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
  }
};
