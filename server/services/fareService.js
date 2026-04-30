const rateCard = {
  auto: {
    baseFare: 25,      
    perKm:    17,       
    perMin:   1.5,     
    minFare:  30,      
  },
  car: {
    baseFare: 50,
    perKm:    25,
    perMin:   2.5,
    minFare:  80,
  },
};

const calcFare = (vehicleType, distanceKm, durationMin) => {
  const rate = rateCard[vehicleType];
  if (!rate) throw new Error('Invalid vehicle type');

  const fare = rate.baseFare + rate.perKm * distanceKm + rate.perMin * durationMin;
  return Math.max(Math.round(fare), rate.minFare);
};

const getFareEstimates = (distanceKm, durationMin) => {
  return {
    auto: calcFare('auto', distanceKm, durationMin),
    car:  calcFare('car',  distanceKm, durationMin),
  };
};

module.exports = { calcFare, getFareEstimates };
