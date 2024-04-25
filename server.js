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
// console.log(`Listening on port ${PORT}...`);

// Alternative #2
const server = require('http').createServer();
const io = require('socket.io')(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
});
const PORT = 3000;
server.listen(PORT);
console.log(`Listening on port ${PORT}...`);

let readyPlayerCount = 0;

io.on('connection', (socket) => {
	console.log('a user connected @socketID: ', socket.id);

	socket.on('ready', () => {
		console.log('Player ready', socket.id);

		readyPlayerCount++;

		// Broadcast to all clients - sending the second opponent as refree id
		// IMPORTANT Modula operator guarantees to start a game even if one re-connects after a disconnect
		if (readyPlayerCount % 2) {
			io.emit('startGame', socket.id);
		}
	});

	// When recieved 'paddleMove' event from FE, broadcasts to other opponent only - exclusivce of the FE emitter opponent
	socket.on('paddleMove', (paddleData) => {
		socket.broadcast.emit('paddleMove', paddleData);
	});

	// When received 'ballMove' event from FE, broadcast to other opponent only - exclusivce of the FE emitter opponent
	socket.on('ballMove', (ballData) => {
		socket.broadcast.emit('ballMove', ballData);
	});

	// Listen for Client Socket Disconnects
	socket.on('disconnect', (reason) => {
		console.log(`Client ${socket.id} disconnected: ${reason}`);
	});
});
