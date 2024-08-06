// --> START IO SOCKET SERVER
/**
 * ServerIO LISTENS for
 * what: 'connect' API event
 * from: ALL clients
 * payload: registers their socket.id
 * */
function listen(ioServer) {
	// NOTE: WE CAN DECLARE AS MANY NAMESPACES(ENDPOINTS) AS WE WANT AS LONG AS WE GOT CORRESPONDENCE ON THE CLIENT SIDE
	// const tetrisNameSpace = ioServer.of('/tetris');
	const pongNameSpace = ioServer.of('/pong');
	// NOTE: serves the entire io server
	// ioServer.on('connect', (socket) => {
	// NOTE: Only serves to pong name space
	// INITIAL PLAYER COUNT
	let playerIds = [];
	// Initialize server-side room states
	const roomStates = {
		readyPlayerCount: 0,
		removedRooms: [],
		recruitingRooms: [],
		// room1: { },
		// room2: { },
	};

	pongNameSpace.on('connection', (socket) => {
		// LOG EACH USER EMITTING CONNECT EVENT
		console.log('☝️ A socket connected as: ', socket.id);
		// ADD EVENTLISTENER FOR READY EVENT EMITTER SOCKETS
		// DYNAMIC GLOBALSCOPE VARIABLES
		let room;

		// Handle add state event COMING FROM STARTGAME EVENT @ CLIENT SIDE
		socket.on('updateState', ({ room, state }) => {
			if (roomStates[room]) {
				roomStates[room] = state;
			}
		});

		/**
		 * > ACTION THREAD#1.2
		 * LISTEN SOCKETS emitting
		 * what: 'ready' custom event
		 * from: ALL clients
		 * payload: socket.id(auto-generated)
		 * */
		socket.on('ready', (payload) => {
			// -> Increment the player count
			roomStates.readyPlayerCount = roomStates.readyPlayerCount + 1;

			// --> IF THE SOCKET IS NEW && THERE IS RECRUTING ROOM AVAILABLE - JOIN THE EXISTING ROOM
			if (payload === 'newSocket' && roomStates.recruitingRooms.length !== 0) {
				// -> PICK THE FIRST MATCHING RECRUITING ROOM TO ASSIGN THIS SOCKET
				room = roomStates.recruitingRooms[0];
				// -> DROP THE ROOM FROM THE RECRUTING ROOM
				roomStates.recruitingRooms.shift();
				// -> JOIN THE SELECTED ROOM
				socket.join(room);
				// -> REGISTER THE PLAYER TO THE GAME PLAY ARRAY && LAST ALSO AS THE GAME REFEREE
				roomStates[room].players = [...roomStates[room].players, socket.id];
				roomStates[room].hasReferee = [true, socket.id];
				delete roomStates[room].paddleIndex[null];
				roomStates[room].paddleIndex = { [socket.id]: 0, ...roomStates[room].paddleIndex };
				console.log('\n🧑‍🤝‍🧑 Joining an awiting room', roomStates);

				pongNameSpace.in(room).emit('startGame', {
					refereeId: socket.id,
					playerIds: roomStates[room].players,
					room,
					serverState: roomStates,
				});
			}

			// --> IF THE SOCKET IS NEW && THERE IS NO RECRUTING ROOM AVAILABLE - CREATE A BRANDNEW ROOM
			if (payload === 'newSocket' && roomStates.recruitingRooms.length === 0) {
				// --> IF THERE IS REMOVEDROOMS, GRAP A NAME FROM THE LIST
				if (roomStates.removedRooms.length > 0) {
					// -> Identify the player room
					room = roomStates.removedRooms[0];
					// -> Remove the used room from the removedrooms list
					roomStates.removedRooms.shift();

					// -> Initialize room state if it doesn't exist
					if (!roomStates[room]) {
						roomStates[room] = {};
					}

					roomStates.readyPlayerCount % 2 === 1 &&
						(roomStates[room] = {
							players: [socket.id],
							hasReferee: [false, null],
							paddleIndex: { null: 0, [socket.id]: 1 },
						});

					console.log('\n♻️ Recycling an abondoned room', roomStates);
				}
				// --> IF THERE IS NO REMOVEDROOMS, CREATE A NEW ROOM
				else if (roomStates.removedRooms.length === 0) {
					// -> Identify the player room
					room = 'room' + (Math.floor((roomStates.readyPlayerCount - 1) / 2) + 1);

					// -> Initialize room state if it doesn't exist
					if (!roomStates[room]) {
						roomStates[room] = {};
					}

					roomStates.readyPlayerCount % 2 === 1 &&
						(roomStates[room] = {
							players: [socket.id],
							hasReferee: [false, null],
							paddleIndex: { null: 0, [socket.id]: 1 },
						});
				}

				// -> REGISTER THE PLAYER TO THE GAME PLAY ARRAY
				playerIds = [...playerIds, socket.id];
				console.log(`\n👉 Player ${socket.id} joined to ${room}`);
				console.log(`\n⚠️ Current player count is ➕ ${roomStates.readyPlayerCount}`);
				roomStates.readyPlayerCount % 2 === 1 && console.log(`\n👉 CURRENT STATE:\n`, roomStates);

				// -> Join socket to the room
				socket.join(room);

				// GUARD CLAUSE - startgame event prerequsite
				// NOTE: IF 2 PERSON IS NOT FULLFILLED DOESNTG EMIT STARTGAME
				if (playerIds.length === 2) {
					// WHEN WE GOT ENOUGH PEOPLE TO START GAME, SET STARTGAME WITH REFEREE ID PAYLOAD
					roomStates[room].players = playerIds;
					roomStates[room].hasReferee = [true, socket.id];
					for (const key in roomStates[room].paddleIndexx) {
						if (roomStates[room].paddleIndex[key] === 0) {
							delete roomStates[room].paddleIndex[key];
						}
					}
					roomStates[room].paddleIndex = { [socket.id]: 0, ...roomStates[room].paddleIndex };
					console.log(`\n👉 CURRENT STATE:\n`, roomStates);

					/**
					 * > ACTION THREAD#2.1
					 * ServerIO Sends/emits/broadcasts
					 * what: 'startGame' custom event
					 * to: ALL clients
					 * payload: refree id
					 * */
					// NOTE: ONLY VALID FOR A SINGLE ROOM SETUP WITH NO NAMESPACE
					// ioServer.emit('startGame', socket.id);
					// NOTE: ONLY VALID FOR A SINGLE ROOM SETUP WITHIN A NAMESPACE
					// pongNameSpace.emit('startGame', socket.id);
					// NOTE: VALID FOR MULTIPLE ROOMS SETUP WITHIN A NAMESPACE TARGETING A SPECIFIC ROOM
					pongNameSpace
						.in(room)
						.emit('startGame', { refereeId: socket.id, playerIds, room, serverState: roomStates });
					// -> CLEAR THE GAME ARRAY
					playerIds = [];
				}
			}
		});

		/**
		 * LISTEN for SOCKETS emitting
		 * what: 'paddleMove' custom event
		 * from: ALL clients
		 * payload: paddle x-position
		 * */
		socket.on('paddleMove', ({ room, paddleData }) => {
			// BROADCAST/FORWARDING THE PADDLE MOVE DATA TO OTHER PLAYERS EXCLUDING THE ORIGIN CLIENT SOCKET
			// NOTE: SERVER.IO CHEETSHEET SELECTIVE BROADCASTING
			/**
			 * > ACTION THREAD#3.2
			 * ServerIO Sends/emits/broadcasts
			 * what: 'paddleMove' custom event
			 * from: ALL clients excluding the originating client
			 * payload: paddle x-position
			 * */
			// NOTE: SEND TO ALL CLIENTS WITHIN A SINGLE ROOM
			// socket.broadcast.emit('paddleMove', paddleData);
			// NOTE: SEND TO ALL CLIENTS WITHIN A SPECIFIC ROOM
			socket.to(room).emit('paddleMove', { room, paddleData });
		});

		/**
		 * LISTEN for SOCKETS emitting
		 * what: 'ballMove' custom event
		 * from: ALL clients
		 * payload: ball-pos+score
		 * */
		socket.on('ballMove', ({ room, ballData }) => {
			/**
			 * > ACTION THREAD#4.2
			 * ServerIO Sends/emits/broadcasts
			 * what: 'ballMove' custom event
			 * to: ALL clients excluding the originating client
			 * payload: ball-pos+score
			 * */
			// NOTE: SEND TO ALL CLIENTS WITHIN A SINGLE ROOM
			// socket.broadcast.emit('ballMove', ballData);
			// NOTE: SEND TO ALL CLIENTS WITHIN A SPECIFIC ROOM
			socket.to(room).emit('ballMove', { room, ballData });
		});

		// RESPOND TO SOCKET DISCONNECTS
		let message, disconnectingSocket, totalPlayerCount;
		socket.on('disconnecting', (reason) => {
			// --> GET THE SOCKET ID THAT GOT DISCONNECTED
			disconnectingSocket = Array.from(socket.rooms)[0];
			// Same as : const disconnectingSocket = socket.id;

			// --> GET THE ROOM INDEX OF THE DISCONNECTING CLIENT
			// NOTE: DISCONNECTING EVENT LET US GRAP socket.id disconnecting, IF DISCONNECT EVENT IS USED, WE CAN'T RETRIEVE THIS INFORMATION
			room = Array.from(socket.rooms)[1];
			totalPlayerCount = [...socket.adapter.sids].length;

			// --> DECREMENT THE OVERALL PLAYER COUNT
			roomStates.readyPlayerCount = totalPlayerCount - 1;
			// Update serverside state - room.players array
			roomStates[room].players = roomStates[room].players.filter((player) => player !== disconnectingSocket);
			// -> IF THERE IS NO PLAYER LEFT IN THE ROOM
			if (roomStates[room].players.length === 0) {
				// GUARD CLAUSE - CHECK FOR PENDING RECRUTING ROOM STATUS
				if (roomStates.recruitingRooms.includes(room)) {
					// Find the index of 'room1'
					const index = roomStates.recruitingRooms.indexOf(room);
					// Remove 'room1' from the array if it exists
					if (index !== 1) roomStates.recruitingRooms.splice(index, 1);
				}

				console.log(`\n💀 There is no player left in ${room}. Being removed gracefully`);
				// NOTE: REMOVING USER FROM THE ROOM IS HANDLED BEHIND THE SCENE VIA SOCKET.IO . HERE SPECIFIED FOR BEING EXPLICIT
				// NOTE: socket leave is not necessary. Handled behing the scene
				// socket.leave([...socket.rooms][1]);

				// Update serverside state - remove the room data
				delete roomStates[room];
				// Add to removedRoom List
				roomStates.removedRooms.push(room);
			} else if (
				// -> IF THERE IS STILL A SINGLE PLAYER LEFT IN THE ROOM
				roomStates[room].players.length === 1
			) {
				// Update recruitingRooms state
				roomStates.recruitingRooms.push(room);
				// Update serverside state - room.hasReferee array
				roomStates[room].hasReferee = [false, null];
				// Update serverside state - room.paddleIndex object
				roomStates[room].paddleIndex = { null: 0, [roomStates[room].players[0]]: 1 };

				message = `\n💀 Client ${socket.id} in ${room} disconnected. \n 
            ${roomStates.readyPlayerCount === 0 ? 'No' : `Only ${roomStates.readyPlayerCount}`} player(s)`;
				// EMIT THE REMAINING PLAYER A RESETGAME EVENT
				socket.to(room).emit('resetGame', {
					message,
					room,
					updatedProps: roomStates[room],
					// recruitingRooms: roomStates.recruitingRooms,
					// removedRooms: roomStates.removedRooms,
				});
			}

			// --> DIRECT CLIENT SIDE CHANGES

			console.log('\n⚒️ UPDATED STATE SUMMARY: \n', roomStates);
			console.log(`\n💀 Client ${socket.id} in ${room} disconnected. \n 
            ${roomStates.readyPlayerCount === 0 ? 'No' : `Only ${roomStates.readyPlayerCount}`} player(s)`);
		});
	});
}

module.exports = { listen };
