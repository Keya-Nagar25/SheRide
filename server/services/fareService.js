// services/fareService.js
// Calculates ride fares for auto and car

// Rate cards (in Indian Rupees)
const rateCard = {
  auto: {
    baseFare: 20,      // Starting charge
    perKm:    8,       // Per kilometre
    perMin:   0.5,     // Per minute
    minFare:  30,      // Minimum you pay even for very short trips
  },
  car: {
    baseFare: 50,
    perKm:    14,
    perMin:   1.5,
    minFare:  80,
  },
};

/**
 * Calculate fare
 * @param {string} vehicleType - 'auto' or 'car'
 * @param {number} distanceKm  - distance in kilometres
 * @param {number} durationMin - estimated time in minutes
 * @returns {number} fare in rupees
 */
const calcFare = (vehicleType, distanceKm, durationMin) => {
  const rate = rateCard[vehicleType];
  if (!rate) throw new Error('Invalid vehicle type');

  const fare = rate.baseFare + rate.perKm * distanceKm + rate.perMin * durationMin;
  return Math.max(Math.round(fare), rate.minFare);
};

/**
 * Get fare estimates for both vehicle types (shown on booking screen)
 */
const getFareEstimates = (distanceKm, durationMin) => {
  return {
    auto: calcFare('auto', distanceKm, durationMin),
    car:  calcFare('car',  distanceKm, durationMin),
  };
};

module.exports = { calcFare, getFareEstimates };
