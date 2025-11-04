const { BookingService } = require("../services");
const { SuccessResponse, ErrorResponse } = require("../utils/common");
const { StatusCodes } = require("http-status-codes");
const { message } = require("../utils/common/error-response");
const inMemDb = {}
async function createBooking(req, res) {
  try {
    const response = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.body.userId,
      noofSeats: req.body.noofSeats, // this is fine
    });

    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.message = error.message || "Something went wrong";
    ErrorResponse.error = {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };

    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ErrorResponse);
  }
}

async function makePayment(req, res) {
  try {
    const idempotencyKey = req.headers['x-idempotency-key']
    if(!idempotencyKey){
      return res
       .status(StatusCodes.BAD_REQUEST)
      .json({message:'idempotency key missing'});
    }
    if(!idempotencyKey || inMemDb[idempotencyKey]){
      return res
       .status(StatusCodes.BAD_REQUEST)
      .json({message:'cannot retry on a successful pay'});
    }
    const response = await BookingService.makePayment({
      totalCost: req.body.totalCost,
      userId: req.body.userId,
      bookingId: req.body.bookingId, 
    });
inMemDb[idempotencyKey] = idempotencyKey
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.message = error.message || "Something went wrong";
    ErrorResponse.error = {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };

    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(ErrorResponse);
  }
}


module.exports = {
  createBooking, makePayment
};
