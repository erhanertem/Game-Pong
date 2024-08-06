// Canvas
// CREATE A CANVAS HTML ELEMENT
const canvas = document.createElement('canvas');
// DEFINE CONTEXT THAT THE CANVAS IS USED IN
const context = canvas.getContext('2d');

// // NOTE WE COULD HAVE NOT ADD CDN VERSION OF SOCKET.IO-CLIENT @ HTML AND INSTALL HERE WITHIN A FE FOLDER WITH ITS OWN PACKAGE.JSON FILE. npm i socket.io-client AND THE CODE WOULD HAVE BEEN:
// import { io } from 'socket.io-client';

// @FRONTEND DECLARE THE MAIN IO NAMESPACE. THIS IS ALSO THE 1ST MANAGER - WE CAN CREATE AS MANY MANAGERS AS WE WANT
// const socket = io('http://localhost:3000');
// NOTE Since soket.io is hosted on the backend, we do not need to hardcode the server address
// const socket = io();
// NOTE By default, io() defaults to io('/') root namespace. Same as const socket = io();
// const socket = io('/');
// --> CREATE FRONTEND SOCKET CLIENT WITH A CUSTOM NAMESPACE
const socket = io('/pong');
// Canvas
const width = 500;
const height = 700;
// Paddle
const paddleHeight = 10;
const paddleWidth = 50;
const paddleDiff = 25;
// Ball
const ballRadius = 5;

// Initialize client-side room states
const roomStates = {
	// DUMMY DATA
	// readyPlayerCount: 0,
	// removedRoomList: [],
	// room1: {
	// 	eventHadlers: {},
	// 	players: [...playerIds],
	// 	hasReferee: [true, refereeId],
	// 	paddleIndex: {
	// 		[refereeId]: 0,
	// 		[opponent]: 1,
	// 	},
	// 	paddleX: [225, 225],
	// 	trajectoryX: [0, 0],
	// 	playerMoved: false,
	// 	ballX: 250,
	// 	ballY: 350,
	// 	ballDirection: 1,
	// 	// SPEED
	// 	speedY: 2,
	// 	speedX: 0,
	// 	// PLAYER SCORES
	// 	score: [0, 0],
	// },
	// room2: {},
};

// Create Canvas Element
function createCanvas() {
	canvas.id = 'canvas';
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
}
// Initial Game View
function renderIntro() {
	// Canvas Background
	context.fillStyle = 'black';
	context.fillRect(0, 0, width, height);

	// Intro Text
	context.fillStyle = 'white';
	context.font = '32px Courier New';
	context.fillText('Waiting for opponent...', 20, canvas.height / 2 - 30);
}

// Render Everything on Canvas
function renderCanvas(room) {
	const state = roomStates[room];
	if (state.eventHadlers.mouseMove) {
		// Canvas Background
		context.fillStyle = 'black';
		context.fillRect(0, 0, width, height);

		// Paddle Color
		context.fillStyle = 'white';

		// Bottom Paddle
		context.fillRect(state.paddleX[0], height - 20, paddleWidth, paddleHeight);

		// Top Paddle
		context.fillRect(state.paddleX[1], 10, paddleWidth, paddleHeight);

		// Dashed Center Line
		context.beginPath();
		context.setLineDash([4]);
		context.moveTo(0, 350);
		context.lineTo(500, 350);
		context.strokeStyle = 'grey';
		context.stroke();

		// Ball
		context.beginPath();
		context.arc(state.ballX, state.ballY, ballRadius, 2 * Math.PI, false);
		context.fillStyle = 'white';
		context.fill();

		// Score
		context.font = '32px JetBrains Mono';
		context.fillText(state.score[0], 20, canvas.height / 2 + 50);
		context.fillText(state.score[1], 20, canvas.height / 2 - 30);
	}
}

// Reset Ball to Center
function ballReset(room) {
	const state = roomStates[room];

	state.ballX = width / 2;
	state.ballY = height / 2;
	state.speedY = 3;

	// Let the referee emit BallMove event with x/y payload
	/**
	 * > ACTION THREAD#4.1.a
	 * Client socket Send/emit/broadcast
	 * what: 'ballMove' custom event
	 * to: ALL clients
	 * payload: ballCoords+score
	 * */
	socket.emit('ballMove', {
		room,
		ballData: {
			ballX: state.ballX,
			ballY: state.ballY,
			score: state.score,
		},
	});
}

// Adjust Ball Movement
function ballMove(room) {
	const state = roomStates[room];
	// Vertical Speed
	state.ballY += state.speedY * state.ballDirection;
	// Horizontal Speed
	if (state.playerMoved) {
		state.ballX += state.speedX;
	}

	// Let the referee emit BallMove event with x/y payload
	/**
	 * > ACTION THREAD#4.1.b
	 * Client socket Send/emit/broadcast
	 * what: 'ballMove' custom event
	 * to: ALL clients
	 * payload: ballCoords+score
	 * */
	socket.emit('ballMove', {
		room,
		ballData: {
			ballX: state.ballX,
			ballY: state.ballY,
			score: state.score,
		},
	});
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries(room) {
	const state = roomStates[room];
	// Bounce off Left Wall
	if (state.ballX < 0 && state.speedX < 0) {
		state.speedX = -state.speedX;
	}
	// Bounce off Right Wall
	if (state.ballX > width && state.speedX > 0) {
		state.speedX = -state.speedX;
	}
	// Bounce off player paddle (bottom)
	if (state.ballY > height - paddleDiff) {
		if (state.ballX >= state.paddleX[0] && state.ballX <= state.paddleX[0] + paddleWidth) {
			// Add Speed on Hit
			if (state.playerMoved) {
				state.speedY += 1;
				// Max Speed
				if (state.speedY > 5) {
					state.speedY = 5;
				}
			}
			state.ballDirection = -state.ballDirection;
			state.trajectoryX[0] = state.ballX - (state.paddleX[0] + paddleDiff);
			state.speedX = state.trajectoryX[0] * 0.3;
		} else {
			// Reset Ball, add to Computer Score
			ballReset(room);
			state.score[1]++;
		}
	}
	// Bounce off computer paddle (top)
	if (state.ballY < paddleDiff) {
		if (state.ballX >= state.paddleX[1] && state.ballX <= state.paddleX[1] + paddleWidth) {
			// Add Speed on Hit
			if (state.playerMoved) {
				state.speedY += 1;
				// Max Speed
				if (state.speedY > 5) {
					state.speedY = 5;
				}
			}
			state.ballDirection = -state.ballDirection;
			state.trajectoryX[1] = state.ballX - (state.paddleX[1] + paddleDiff);
			state.speedX = state.trajectoryX[1] * 0.3;
		} else {
			ballReset(room);
			state.score[0]++;
		}
	}
}

function animate(room, socketId, timeStamp) {
	// GUARD CLAUSE - Only refree is able to calc the ballMove and Boundaries to sync data in one origin
	if (roomStates[room].hasReferee[0] && roomStates[room].hasReferee[1] === socketId) {
		ballMove(room);
		ballBoundaries(room);
	}

	renderCanvas(room);
	window.requestAnimationFrame((timeStamp) => animate(room, socketId, timeStamp));
}

function onMouseMove(room, socketId, event) {
	const state = roomStates[room];
	// Update the player's paddle position based on the mouse's x-coordinate
	state.playerMoved = true;
	state.paddleX[state.paddleIndex[socketId]] = event.offsetX;
	if (state.paddleX[state.paddleIndex[socketId]] < 0) {
		state.paddleX[state.paddleIndex[socketId]] = 0;
	}
	if (state.paddleX[state.paddleIndex[socketId]] > width - paddleWidth) {
		state.paddleX[state.paddleIndex[socketId]] = width - paddleWidth;
	}

	// Sync updated paddleX position data with the other opponent by emitting this information to server form which the server will emit this back to other player. therefore, we need on server side to kick it back to other.
	/**
	 * > ACTION THREAD#3.1
	 * Client socket Send/emit/broadcast
	 * what: 'paddleMove' custom event
	 * to: ALL clients
	 * payload: refree id
	 * */

	socket.emit('paddleMove', {
		room,
		paddleData: { xPosition: state.paddleX[state.paddleIndex[socketId]] },
	});

	// Hide Cursor
	canvas.style.cursor = 'none';
}

function startGame(room, socketId) {
	// Add the mouse move event listener if it hasn't been added yet
	if (roomStates[room].eventHadlers.mouseMove === undefined) {
		// Store the eventhandler reference
		roomStates[room].eventHadlers.mouseMove = onMouseMove;
		// Add the event listener
		canvas.addEventListener('mousemove', (event) => onMouseMove(room, socketId, event));
	}
	// ANIMATE THE GAME
	window.requestAnimationFrame((timeStamp) => animate(room, socketId, timeStamp));
}

// ---> Game initializer
(function loadGame() {
	createCanvas();
	renderIntro();

	// EACH PLAYER INSTANCE SENDS TO BACKEND SERVER A 'READY' EVENT
	// socket.emit('ready', {...payload goes here - a unique identifier for the socket holder});
	// NOTE HOW DO WE MAINTAIN THE UNIQUE IDENTIFIER: Front-end has to either create an event an id and emit within the ready socket event as a {payload} object or have backend produce one and send it to FE to use it. However, client-side socket.io has already got session.id built-in which is a unique identifier. Therefore, disclosing a unique identifier {payload} by ourselves is not a necessity.
	/**
	 * > ACTION THREAD#1.1
	 * Client socket Send/emit/broadcast
	 * what: 'ready' custom event
	 * to: ALL clients
	 * payload: socket.id(auto-generated) + newSocket to distinguish between resets versus new sockets
	 * */
	socket.emit('ready', 'newSocket');
})();

// --> IO SOCKET RESPONSE TO SERVER
socket.on(
	'resetGame',
	({
		message,
		room,
		updatedProps,
		// recruitingRooms,
		// removedRooms
	}) => {
		// --> INFORM CLIENT SIDE
		console.log(message);
		// --> IF THERE IS STILL A SINGLE PLAYER LEFT IN THE ROOM
		// -> Remove the mouse move event listener to prevent fiddling with the paddle
		if (roomStates[room].eventHadlers.mouseMove) {
			// Remove the event listener
			canvas.removeEventListener(
				'mousemove',
				roomStates[room].eventHadlers.mouseMove.bind(null, roomStates[room], socket.id)
			);
			// Remove the listener handler reference from memory
			delete roomStates[room].eventHadlers.mouseMove;
		}

		// -> REMAINDER RESET STATES
		newState = {
			trajectoryX: [0, 0],
			playerMoved: false,
			ballX: 250,
			ballY: 350,
			ballDirection: 1,
			speedY: 2,
			speedX: 0,
			score: [0, 0],
		};

		// -> UPDATE THE PLAYER FROM THE SERVERSIDE PLAYER LIST
		roomStates[room] = { ...roomStates[room], ...updatedProps, ...newState };

		renderIntro();
		// EACH PLAYER INSTANCE SENDS TO BACKEND SERVER A 'READY' EVENT
		// socket.emit('ready', {...payload goes here - a unique identifier for the socket holder});
		// NOTE HOW DO WE MAINTAIN THE UNIQUE IDENTIFIER: Front-end has to either create an event an id and emit within the ready socket event as a {payload} object or have backend produce one and send it to FE to use it. However, client-side socket.io has already got session.id built-in which is a unique identifier. Therefore, disclosing a unique identifier {payload} by ourselves is not a necessity.
		// -> SEND READY SIGNAL TO PLAYERS JOINING TO THIS EXISTING ROOM
		/**
		 * > ACTION THREAD#1.1
		 * Client socket Send/emit/broadcast
		 * what: 'ready' custom event
		 * to: ALL clients in the room
		 * payload: socket.id(auto-generated)
		 * */
		// socket.emit('ready', {
		// 	players: roomStates[room].players,
		// 	// recruitingRooms,
		// 	// removedRooms,
		// });
	}
);

/**
 * > ACTION THREAD#2.2
 * Client socket Listens for
 * what: 'startGame' custom event
 * from: ServerIO
 * payload: refree id as socket.id
 * */
socket.on('startGame', ({ refereeId, playerIds, room, serverState }) => {
	// Identify opponent's playerId
	let opponent = playerIds.filter((id) => id !== refereeId)[0];
	// Create the game state
	let newState = {
		eventHadlers: {},
		players: [...playerIds],
		hasReferee: [true, refereeId],
		paddleIndex: {
			[refereeId]: 0,
			[opponent]: 1,
		},
		paddleX: [225, 225],
		trajectoryX: [0, 0],
		playerMoved: false,
		ballX: 250,
		ballY: 350,
		ballDirection: 1,
		speedY: 2,
		speedX: 0,
		score: [0, 0],
	};
	// Update the client side state
	roomStates[room] = newState;
	// Add the game state on the backend server via referee
	if (socket.id === refereeId && playerIds.length === 2) {
		socket.emit('updateState', {
			room,
			state: {
				players: [...playerIds],
				hasReferee: [true, refereeId],
				paddleIndex: {
					[refereeId]: 0,
					[opponent]: 1,
				},
			},
		});
	}
	console.log(`✅ A new game started on ${room} with referee ${refereeId}`);
	startGame(room, socket.id);
});

/**
 * > ACTION THREAD#3.3
 * Client socket Listens for
 * what: 'paddleMove' custom event
 * from: ALL clients
 * payload: paddle x-position
 * */
socket.on('paddleMove', ({ room, paddleData }) => {
	// Update other opponents xPos state
	roomStates[room].paddleX[1 - roomStates[room].paddleIndex[socket.id]] = paddleData.xPosition;
});
/**
 * > ACTION THREAD#4.3
 * Client socket Listens for
 * what: 'paddleMove' custom event
 * from: ALL clients
 * payload: paddle x-position
 * */
socket.on('ballMove', ({ room, ballData }) => {
	// Update other opponents ball-pos + score
	roomStates[room].ballX = ballData.ballX;
	roomStates[room].ballY = ballData.ballY;
	roomStates[room].score = ballData.score;
});

// // We also register a catch-all listener, which is very useful during development: So that any event received by the client will be printed in the console.
// socket.onAny((event, ...args) => {
// 	console.log(event, args);
// });
