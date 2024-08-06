const express = require('../node_modules/express');

// INITIALIZE EXPRESS SERVER FOR FE
const app = express();

// Serve static files from the "root" directory
app.use(express.static(__dirname));

// ROOT ROUTE SERVES THE INDEX.HTML FROM THE SERVED FODLER
app.use('/', express.static('index.html'));
// app.get('/', (req, res) => {
// 	res.sendFile(path.join(__dirname, 'index.html'));
// });

module.exports = app;
