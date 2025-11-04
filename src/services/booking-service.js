const axios = require("axios");
const { BookingRepository } = require("../repositories");
const { StatusCodes } = require("http-status-codes");
const { ServerConfig } = require("../config");
const db = require("../models");
const AppError = require("../utils/errors/app-error");

async function createBooking(data) {
  return new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
      // Fetch flight details
      const flightResponse = await axios.get(
        `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
      );

      // Handle both response formats (single object or array)
      let flightData = flightResponse.data.data;
      if (Array.isArray(flightData)) flightData = flightData[0];

      // Handle both naming cases for seat inputs
      const requestedSeats = data.noOfSeats ?? data.noofSeats;
      const availableSeats = flightData.totalSeats ?? flightData.totalseats;

      console.log("DEBUG => Seats requested:", requestedSeats, "Available:", availableSeats);

      // Validation checks
      if (!requestedSeats || isNaN(requestedSeats)) {
        await t.rollback();
        return reject(new AppError("Invalid seat number", StatusCodes.BAD_REQUEST));
      }

      if (requestedSeats > availableSeats) {
        await t.rollback();
        return reject(new AppError("Not enough seats available", StatusCodes.BAD_REQUEST));
      }

      // If valid, proceed (for now just resolving true)
      await t.commit();
      console.log("All good, resolving...");
      resolve(true);

    } catch (error) {
      await t.rollback();
      console.log("Error inside createBooking:", error);
      reject(error);
    }
  });
}

module.exports = {
  createBooking,
};
