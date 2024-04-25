const express = require('express');
const path = require('path');

const api = express();

const PORT = 3000;

// Serve website static content
api.use(express.static(path.join(__dirname, 'public')));

// Serve index.html @ root endpoint
api.use('/', express.static('index.html'));

api.listen(PORT, () => console.log(`Listening xpress on ${PORT}...`));

// NOTE Export express server to pass onto nodejs http server to bridge with socket.io
module.exports = { api };
