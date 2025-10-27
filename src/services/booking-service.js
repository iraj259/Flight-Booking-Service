const axios = require('axios')
const {BookingRepository} = require('../repositories')
const db = require('../models')
async function createBooking(data){
    try {
        const result = db.sequelize.transaction(async function bookingImpl(t){
            const flight= axios.get(`localhost:3000/api/v1/flights/${data.flightId}`)
            console.log(flight)
            return true
        })
    } catch (error) {
        
    }
}


module.exports={
    createBooking
}