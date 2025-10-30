const {BookingService} = require('../services')
const { SuccessResponse, ErrorResponse } = require("../utils/common");
const { StatusCodes } = require('http-status-codes');

async function createBooking(req,res){
  try {
    const response = await BookingService.createBooking({
      flightId:req.body.flightId,
      userId:req.body.userId,
      noOfSeats: req.body.noOfSeats
    })
    SuccessResponse.data = response
    return res
        .status(StatusCodes.OK)
        .json(SuccessResponse)
  } catch (error) {
    ErrorResponse.message = error.message || "Something went wrong";
  ErrorResponse.error = {
    name: error.name || "Error",
    message: error.message || "Unknown error",
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  };

  return res
    .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
    .json(ErrorResponse);
  }
}
module.exports = {
    createBooking
}