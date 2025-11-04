const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { ServerConfig } = require("../config");
const db = require("../models");
const { BookingRepository } = require("../repositories");
const AppError = require("../utils/errors/app-error");
const { Enums } = require("../utils/common");
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;
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

    console.log(
      "DEBUG => Seats requested:",
      requestedSeats,
      "Available:",
      availableSeats
    );

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
    const booking = await bookingRepository.create(bookingPayload, {
      transaction: t,
    });

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

async function makePayment(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );
    if (bookingDetails.status === CANCELLED) {
      throw new AppError("Booking expired", StatusCodes.BAD_REQUEST);
    }
    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();
    if (currentTime - bookingTime > 300000) {
      await cancelBooking(data.bookingId);

      throw new AppError("Booking expired", StatusCodes.BAD_REQUEST);
    }

    if (bookingDetails.totalCost != data.totalCost) {
      throw new AppError(
        "The amount of the payment does not match",
        StatusCodes.BAD_REQUEST
      );
    }
    if (bookingDetails.userId != data.userId) {
      throw new AppError(
        "The user corresponding to the booking does not match",
        StatusCodes.BAD_REQUEST
      );
    }
    //    we assume that the payment is successful
    const response = await bookingRepository.update(
      data.bookingId,
      { status: BOOKED },
      transaction
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelBooking(bookingId) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      bookingId,
      transaction
    );
    if (bookingDetails.status == CANCELLED) {
      await transaction.commit();
      return true;
    }
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,
      { seats: bookingDetails.noOfSeats, dec: 0 }
    );
    await bookingRepository.update(
      bookingId,
      { status: CANCELLED },
      transaction
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { createBooking, makePayment, cancelBooking };
