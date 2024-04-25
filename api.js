const path = require('path');
const express = require('express');

const api = express();

// Serve website static content
api.use(express.static(path.join(__dirname, 'public')));

// Serve index.html @ root endpoint
api.use('/', express.static('index.html'));

// VERY IMPORTANT OMITTED LISTENING EXPRESS SERVER - REASON: WE DO NOT SERVE EXPRESS SERVER HERE ANYMORE. WE WANT NODE.JS SERVER HTTP HANDLER SERVE WRAP THIS AROUND FOR SHADOW SERVING
// const PORT = 4000;
// api.listen(PORT, () =>
// 	console.log(`Listening XPRESS server on port ${PORT}...`)
// );

// NOTE Export express server to pass onto nodejs http server to bridge with socket.io
module.exports = api;
