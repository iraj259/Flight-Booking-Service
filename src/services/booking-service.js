const axios = require('axios')
const {BookingRepository} = require('../repositories')
const {StatusCodes} = require('http-status-codes')
const {ServerConfig} = require('../config')
const db = require('../models')
async function createBooking(data){
    try {
        const result = db.sequelize.transaction(async function bookingImpl(t){
            const flight= await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`)
            if(data.noofSeats > flight.totalSeats){
            throw new AppError("Not enough seats available",StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return true
        })
    } catch (error) {
console.log(error)
    }
}


module.exports={
    createBooking
}