const http = require('http');
const { Server } = require('socket.io');

const app = require('./public/app');
const sockets = require('./sockets');

// > #1.CREATE HTTP/HTTPS SERVER
// WRAP EXPRESS SERVER WITHIN HTTP SERVER WHICH IS USED WITH THE SOCKETIO
const httpServer = http.createServer(app);

// > #2.ASSIGN SOCKETIO UNDER NODE HTTP/HTTPS SERVER
const ioServer = new Server(httpServer, {
	cors: {
		origin: 'http://localhost:3000',
	},
});

// > BROADCAST SOCKET.IO VIA HTTPSERVER
// Listen is just a made-up function to mimic how we listen httpServer. We simply declare the code that is inside the function here!
sockets.listen(ioServer);

// > START HTTPSERVER
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
