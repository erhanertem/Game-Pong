let readyPlayerCount = 0;

function listen(io) {
	// Hosting multiple io sockets within the same pipeline
	// const tetrisNamespace = io.of('/tetris');
	const pongNamespace = io.of('/pong');

	// Seperation of concern for different namespaces
	pongNamespace.on('connection', (socket) => {
		console.log('a user connected @socketID: ', socket.id);

		socket.on('ready', () => {
			// PLAYER1 (READYPLAYER COUNT 0) AND PLAYER 2 (READYPLAYER COUNT 1)
			let room = 'room' + Math.floor(readyPlayerCount / 2);
			socket.join(room);

			console.log(
				'Player ready',
				socket.id,
				'Belongs to namespace @ ',
				pongNamespace.name,
				' room @ ',
				room
			);
			readyPlayerCount++;

			// Broadcast to all clients - sending the second opponent as refree id
			// IMPORTANT Modula operator guarantees to start a game even if one re-connects after a disconnect
			if (readyPlayerCount % 2) {
				pongNamespace.emit('startGame', socket.id);
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
			// Discharge the socket upon leave
			socket.leave(room);
		});
	});
}

module.exports = { listen };
