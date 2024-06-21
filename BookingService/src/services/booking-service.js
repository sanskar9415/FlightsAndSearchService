const { BookingRepository } = require('../repository/index');
const axios = require('axios');
const { FLIGHT_SERVICE_PATH } = require('../config/serverConfig');
const { ServiceError } = require('../utils/errors');

class BookingService {
    constructor() {
        this.bookingrepository = new BookingRepository();
    }

    async createBooking(data) {
        try {
            const flightId = data.flightId;
            const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`; 
            const response = await axios.get(getFlightRequestURL);
            const flightData = response.data.data;
            const flightPrice = flightData.price;
            if(data.noOfSeats > flightData.totalSeats){
                throw new ServiceError('Something went wrong in the booking process' , 'Insufficient Seats in the flight');
            }
            const totalCost = flightPrice * data.noOfSeats;
            const bookingPayload = {...data , totalCost};
            const booking = await this.bookingrepository.create(bookingPayload);
            const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            await axios.patch(updateFlightRequestURL , {totalSeats: flightData.totalSeats - booking.noOfSeats});
            const finalBooking = await this.bookingrepository.update(booking.id , {status: 'Booked'});
            return finalBooking;
        } catch (error) {
            if(error.name == 'Repository Error' || error.name == 'SequelizeValidationError'){
                throw error;
            }
            throw new ServiceError();
        }
    }

}

module.exports = BookingService;