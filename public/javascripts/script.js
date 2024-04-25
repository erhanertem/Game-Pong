// Canvas
const { body } = document;

// CREATE A CANVAS HTML ELEMENT
const canvas = document.createElement('canvas');
// DEFINE CONTEXT THAT THE CANVAS IS USED IN
const context = canvas.getContext('2d');
// CREATE FE SOCKET CONNECTION TO BE SOCKET.IO SERVER @ http://localhost:3000
// const socket = io('http://localhost:3000');
// NOTE Since soket.io is hosted on the backend so we do not need to hardcode the server address
const socket = io();

let isReferee = false;
let paddleIndex = 0;
let width = 500;
let height = 700;

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [225, 225];
let trajectoryX = [0, 0];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;

// Score for Both Players
let score = [0, 0];

// Create Canvas Element
function createCanvas() {
	canvas.id = 'canvas';
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	renderCanvas();
}

// Wait for Opponents
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
function renderCanvas() {
	// Canvas Background
	context.fillStyle = 'black';
	context.fillRect(0, 0, width, height);

	// Paddle Color
	context.fillStyle = 'white';

	// Bottom Paddle
	context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

	// Top Paddle
	context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

	// Dashed Center Line
	context.beginPath();
	context.setLineDash([4]);
	context.moveTo(0, 350);
	context.lineTo(500, 350);
	context.strokeStyle = 'grey';
	context.stroke();

	// Ball
	context.beginPath();
	context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
	context.fillStyle = 'white';
	context.fill();

	// Score
	context.font = '32px JetBrains Mono';
	context.fillText(score[0], 20, canvas.height / 2 + 50);
	context.fillText(score[1], 20, canvas.height / 2 - 30);
}

// Reset Ball to Center
function ballReset() {
	ballX = width / 2;
	ballY = height / 2;
	speedY = 3;

	// Let the referee emit BallMove event with x/y payload
	socket.emit('ballMove', { ballX, ballY, score });
}

// Adjust Ball Movement
function ballMove() {
	// Vertical Speed
	ballY += speedY * ballDirection;
	// Horizontal Speed
	if (playerMoved) {
		ballX += speedX;
	}

	// Let the referee emit BallMove event with x/y payload
	socket.emit('ballMove', { ballX, ballY, score });
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
	// Bounce off Left Wall
	if (ballX < 0 && speedX < 0) {
		speedX = -speedX;
	}
	// Bounce off Right Wall
	if (ballX > width && speedX > 0) {
		speedX = -speedX;
	}
	// Bounce off player paddle (bottom)
	if (ballY > height - paddleDiff) {
		if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
			// Add Speed on Hit
			if (playerMoved) {
				speedY += 1;
				// Max Speed
				if (speedY > 5) {
					speedY = 5;
				}
			}
			ballDirection = -ballDirection;
			trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
			speedX = trajectoryX[0] * 0.3;
		} else {
			// Reset Ball, add to Computer Score
			ballReset();
			score[1]++;
		}
	}
	// Bounce off computer paddle (top)
	if (ballY < paddleDiff) {
		if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
			// Add Speed on Hit
			if (playerMoved) {
				speedY += 1;
				// Max Speed
				if (speedY > 5) {
					speedY = 5;
				}
			}
			ballDirection = -ballDirection;
			trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
			speedX = trajectoryX[1] * 0.3;
		} else {
			ballReset();
			score[0]++;
		}
	}
}

// Called Every Frame
function animate() {
	// Ball move pos(x,y) in the game is handled only via emitter from the referee
	if (isReferee) {
		ballMove();
		ballBoundaries();
	}

	renderCanvas();
	window.requestAnimationFrame(animate);
}

// Load Game
(function loadGame() {
	createCanvas();
	renderIntro();
	// socket.emit('ready', {...payload goes here - a unique identifier for the socket holder});
	// NOTE we excluded {payload} via socket.id upon connect event...Not necessary to pass a payload anymore
	socket.emit('ready');
})();

// Start Game, Reset Everything
function startGame() {
	paddleIndex = isReferee ? 0 : 1;
	window.requestAnimationFrame(animate);
	canvas.addEventListener('mousemove', (e) => {
		playerMoved = true;
		paddleX[paddleIndex] = e.offsetX;
		if (paddleX[paddleIndex] < 0) {
			paddleX[paddleIndex] = 0;
		}
		if (paddleX[paddleIndex] > width - paddleWidth) {
			paddleX[paddleIndex] = width - paddleWidth;
		}

		// Sync paddleX location data with the other opponent
		// NOTE: Emitter payload carries out this information
		socket.emit('paddleMove', { xPosition: paddleX[paddleIndex] });

		// Hide Cursor
		canvas.style.cursor = 'none';
	});
}

// -> Socket.io Built-in Event Listeners
// Client-event Listeners:
// Listen for 'connect' event broadcast @start
socket.on('connect', () => {
	console.log('Connected as...', socket.id);
});
// Listen for socker server disconnect
socket.on('disconnect', (reason) => {
	if (reason === 'io server disconnect') {
		// the disconnection was initiated by the server, you need to reconnect
		socket.connect();
	}
	// else the socket will automatically try to reconnect
});

// NOTE 👇 Other custom event handlers should be located outside the connect event handler.
// -> Custom Event Listeners
// Listen for 'startGame' event broadcast
socket.on('startGame', (refereeId) => {
	console.log('Referee is', refereeId);

	isReferee = socket.id === refereeId;
	startGame();
});

// Listen for 'paddleMove' event broadcast - Broadcasting referee player do not receive this!!!
socket.on('paddleMove', (paddleData) => {
	// Get the opponents' boradcasted poddleIndex via toggling opponent index  Toggle 1 into 0, 0 into 1
	const opponentPaddleIndex = 1 - paddleIndex;
	paddleX[opponentPaddleIndex] = paddleData.xPosition;
});

// Listen for 'paddleMove' event broadcast - Broadcasting referee player do not receive this!!!
socket.on('ballMove', (ballData) => {
	({ ballX, ballY, score } = ballData);
});
