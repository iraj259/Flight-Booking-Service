const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { ServerConfig } = require("../config");
const db = require("../models");
const { BookingRepository } = require("../repositories");
const AppError = require("../utils/errors/app-error");

const bookingRepository = new BookingRepository();

async function createBooking(data) {
  const t = await db.sequelize.transaction();
  try {
    // Fetch flight details
    const flightResponse = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
    );

    let flightData = flightResponse.data.data;
    if (Array.isArray(flightData)) flightData = flightData[0];

    const requestedSeats = data.noOfSeats ?? data.noofSeats;
    const availableSeats = flightData.totalSeats ?? flightData.totalseats;

    console.log("DEBUG => Seats requested:", requestedSeats, "Available:", availableSeats);

    if (!requestedSeats || isNaN(requestedSeats)) {
      throw new AppError("Invalid seat number", StatusCodes.BAD_REQUEST);
    }

    if (requestedSeats > availableSeats) {
      throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
    }

    // Calculate total cost
    const totalBillingAmount = requestedSeats * flightData.price;

    // Create booking in DB
    const bookingPayload = { ...data, totalCost: totalBillingAmount };
    const booking = await bookingRepository.create(bookingPayload, { transaction: t });

    // Update flight seats
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
      { seats: requestedSeats }
    );

    await t.commit();
    console.log("Booking successful ✅");
    return booking;

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Error inside createBooking:", error);
    throw error;
  }
}

module.exports = { createBooking };
