// sockets/index.js
// All real-time events live here
// Think of this like a phone switchboard - messages come in and get routed

const initSocket = (io) => {
  // Store which socket belongs to which user
  // { userId: socketId }
  const onlineUsers = {};

  io.on('connection', (socket) => {
    console.log('🔌 New socket connected:', socket.id);

    // ============================================
    // User identifies themselves after connecting
    // Client sends: { userId, role }
    // ============================================
    socket.on('user:identify', ({ userId, role }) => {
      onlineUsers[userId] = socket.id;
      socket.userId = userId;
      socket.role = role;
      console.log(`👤 ${role} ${userId} is online`);
    });

    // ============================================
    // Join a ride room (both passenger and driver join this)
    // Client sends: { rideId }
    // ============================================
    socket.on('ride:join', ({ rideId }) => {
      socket.join(`ride:${rideId}`);
      console.log(`🚗 Socket ${socket.id} joined ride room: ${rideId}`);
    });

    // ============================================
    // Passenger requests a ride → notify nearby drivers
    // Client sends: { rideId, pickupLat, pickupLng, vehicleType, passengerName }
    // ============================================
    socket.on('ride:request', (data) => {
      console.log('🚕 New ride request:', data.rideId);
      // Broadcast to ALL connected drivers (they filter by vehicleType on their end)
      socket.broadcast.emit('ride:new', data);
    });

    // ============================================
    // Driver accepts a ride → notify the specific passenger
    // Client sends: { rideId, driverId, driverName, vehicleNumber, eta }
    // ============================================
    socket.on('ride:accept', (data) => {
      console.log('✅ Ride accepted:', data.rideId);
      // Notify everyone in the ride room (passenger will be there)
      io.to(`ride:${data.rideId}`).emit('ride:accepted', data);
      // Also notify via userId if we have their socket
      if (data.passengerId && onlineUsers[data.passengerId]) {
        io.to(onlineUsers[data.passengerId]).emit('ride:accepted', data);
      }
    });

    // ============================================
    // Driver sends their GPS location every 3 seconds
    // Client sends: { rideId, lat, lng }
    // ============================================
    socket.on('location:update', ({ rideId, lat, lng }) => {
      // Broadcast to everyone in this ride's room (i.e., the passenger)
      socket.to(`ride:${rideId}`).emit('driver:location', { lat, lng, timestamp: Date.now() });
    });

    // ============================================
    // Driver starts the trip
    // ============================================
    socket.on('ride:start', ({ rideId }) => {
      io.to(`ride:${rideId}`).emit('ride:started', { rideId, startedAt: Date.now() });
    });

    // ============================================
    // Driver completes the trip
    // ============================================
    socket.on('ride:complete', ({ rideId, fare }) => {
      io.to(`ride:${rideId}`).emit('ride:completed', { rideId, fare, completedAt: Date.now() });
    });

    // ============================================
    // Passenger cancels the ride
    // ============================================
    socket.on('ride:cancel', ({ rideId, reason }) => {
      io.to(`ride:${rideId}`).emit('ride:cancelled', { rideId, reason });
    });

    // ============================================
    // Disconnect
    // ============================================
    socket.on('disconnect', () => {
      if (socket.userId) {
        delete onlineUsers[socket.userId];
        console.log(`👋 ${socket.role || 'User'} ${socket.userId} disconnected`);
      }
    });
  });
};

module.exports = initSocket;
