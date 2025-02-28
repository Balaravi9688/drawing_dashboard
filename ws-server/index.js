const { WS_EVENT } = require("../constants/events");
const WebSocketServer = require('ws').Server;
const { v4: uuidv4 } = require('uuid');

// Store all the websocket client connections
let connections = [];

// Broadcast function to send messages to all clients
const broadcast = (data, senderId = null) => {
    connections.forEach((socket) => {
        if (socket.uid !== senderId) {
            socket.send(data)
        }
    })
}

const handleNewConnection = (ws) => {

    ws.uid = uuidv4();
    connections.push(ws);

    console.log('New connection established:', ws.uid)

    ws.send(JSON.stringify({
        type: "id",
        data: ws.uid
    }))

    broadcast(JSON.stringify({
        type: WS_EVENT.USER_JOIN,
        id: ws.uid
    }), ws.uid);

    ws.on('message', (data) => {
        const message = JSON.parse(data)
        if (message.type === WS_EVENT.CLEAR) {
            broadcast(data)
        } else {
            broadcast(data, message.id)
        }
    })

    ws.on('close', (data) => {
        console.log("socket connection closed : ", ws.uid)
        connections = connections.filter((socket) => socket.uid !== ws.uid)
        broadcast(JSON.stringify({
            type: WS_EVENT.USER_DISCONNECT,
            id: ws.uid
        }));
    })
}

const initWSSServer = (server) => {
    const wss = new WebSocketServer({ server });
    wss.on('connection', handleNewConnection);
    wss.on('error', (error) => {
        console.log("Error in websocket server : ", error);
    });
}

module.exports = { initWSSServer };