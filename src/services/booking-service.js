const axios = require('axios')
const {BookingRepository} = require('../repositories')
const {ServerConfig} = require('../config')
const db = require('../models')
async function createBooking(data){
    try {
        const result = db.sequelize.transaction(async function bookingImpl(t){
            const flight= await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`)
            console.log(flight.data)
            return true
        })
    } catch (error) {
        
    }
}


module.exports={
    createBooking
}