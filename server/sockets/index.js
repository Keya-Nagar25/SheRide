const initSocket = (io) => {
  const onlineUsers = {};

  io.on('connection', (socket) => {
    console.log('🔌 New socket connected:', socket.id);
    socket.on('user:identify', ({ userId, role }) => {
      onlineUsers[userId] = socket.id;
      socket.userId = userId;
      socket.role = role;
      console.log(`👤 ${role} ${userId} is online`);
    });

    socket.on('ride:join', ({ rideId }) => {
      socket.join(`ride:${rideId}`);
      console.log(`🚗 Socket ${socket.id} joined ride room: ${rideId}`);
    });

    socket.on('ride:request', (data) => {
      console.log('🚕 New ride request:', data.rideId);
      socket.broadcast.emit('ride:new', data);
    });

    socket.on('ride:accept', (data) => {
      console.log('✅ Ride accepted:', data.rideId);
      io.to(`ride:${data.rideId}`).emit('ride:accepted', data);
      if (data.passengerId && onlineUsers[data.passengerId]) {
        io.to(onlineUsers[data.passengerId]).emit('ride:accepted', data);
      }
    });

    socket.on('location:update', ({ rideId, lat, lng }) => {
      socket.to(`ride:${rideId}`).emit('driver:location', { lat, lng, timestamp: Date.now() });
    });

    socket.on('ride:start', ({ rideId }) => {
      io.to(`ride:${rideId}`).emit('ride:started', { rideId, startedAt: Date.now() });
    });

    socket.on('ride:complete', ({ rideId, fare }) => {
      io.to(`ride:${rideId}`).emit('ride:completed', { rideId, fare, completedAt: Date.now() });
    });

    socket.on('ride:cancel', ({ rideId, reason }) => {
      io.to(`ride:${rideId}`).emit('ride:cancelled', { rideId, reason });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        delete onlineUsers[socket.userId];
        console.log(`👋 ${socket.role || 'User'} ${socket.userId} disconnected`);
      }
    });
  });
};

module.exports = initSocket;
