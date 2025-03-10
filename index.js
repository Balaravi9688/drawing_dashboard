const express = require("express");
const http = require("http");

const { PORT } = require("./constants/constant");
const { initWSSServer } = require("./ws-server");

const app = express();

app.use(express.static("public"));

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const server = http.createServer(app);

// Initializing Websocket Server
initWSSServer(server)

// Initializing Express Server
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));