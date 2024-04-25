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

io.on('connection', (socket) => {
	console.log('a user connected @socketID: ', socket.id);
});
