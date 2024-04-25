// // Alternative #1
// const { createServer } = require('http');
// const { Server } = require('socket.io');
// const PORT = 3000;
// const httpServer = createServer();
// const io = new Server(httpServer, {
// 	cors: {
// 		origin: '*',
// 		methods: ['GET', 'POST'],
// 	},
// });
// io.listen(PORT);
// console.log(`Listening socket.io server on port ${PORT}...`);

// Alternative #2
const http = require('http');
const io = require('socket.io');

const apiServer = require('./api');
// IMPORTANT HAVE NODEJS HTTP SERVER USE EXPRESS API SERVER UNDER THE HOOD WHILE NODEJS HTTP SERVER ACTS AS A BRIDGE BETWEEN SOCKET.IO & EXPRESS.JS
const httpServer = http.createServer(apiServer);
const socketServer = io(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
});

const sockets = require('./sockets');

const PORT = 4000;
httpServer.listen(PORT, () =>
	console.log(`Listening NODE server on port ${PORT}...`)
);

sockets.listen(socketServer);
