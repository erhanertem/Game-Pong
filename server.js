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
const api = require('./api');
// IMPORTANT HAVE NODEJS HTTP SERVER USE EXPRESS API SERVER UNDER THE HOOD WHILE NODEJS HTTP SERVER ACTS AS A BRIDGE BETWEEN SOCKET.IO & EXPRESS.JS
const server = require('http').createServer(api);
const io = require('socket.io')(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
});

const sockets = require('./sockets');

const PORT = 4000;
server.listen(PORT, () =>
	console.log(`Listening NODE server on port ${PORT}...`)
);

sockets.listen(io);
