let canvas = document.getElementById("canvas");

// const uri = 'ws://localhost:8080';
const uri = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
let client = null;

const WS_EVENT = {
  DOWN: "down",
  DRAW: "draw",
  CLEAR: "clear",
  USER_JOIN: "user_join",
  USER_DISCONNECT: "user_disconnect"
}

const WebSocketState = {
  CONNECTING: 0,
  CONNECTION_OPEN: 1,
  CONNECTION_CLOSING: 2,
  CONNECTION_CLOSED: 3,
}

const showNotification = (message) => {
  const notificationContainer = document.getElementById("notifications");

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerText = message;

  notificationContainer.appendChild(notification);

  // Remove the notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 500);
  }, 3000);
};


const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
}

const startWebsocketClient = () => {
  if (client?.readyState === WebSocketState.CONNECTION_OPEN) {
    return
  };
  client = new WebSocket(uri);
}

startWebsocketClient();

// Handling the incoming message from the server
if (client) {
  client.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.type === "id") {
      client.uid = message.data
    } else if (message.type === WS_EVENT.DRAW) {
      ctx.lineTo(message.data.x, message.data.y);
      ctx.stroke();
    } else if (message.type === WS_EVENT.DOWN) {
      ctx.moveTo(message.data.x, message.data.y);
    } else if (message.type === WS_EVENT.CLEAR) {
      clearCanvas()
    } else if (message.type === WS_EVENT.USER_JOIN) {
      showNotification(`User ${message.id} has joined.`);
    } else if (message.type === WS_EVENT.USER_DISCONNECT) {
      showNotification(`User ${message.id} has disconnected.`);
    }
  }
}

// Send the message to the server
const sendMessage = (msg) => {
  if (client && client?.readyState === client?.OPEN) {
    client.send(JSON.stringify(msg));
    return WebSocketState.CONNECTION_OPEN;
  } else if (client && client?.readyState === client?.CLOSED || client?.readyState === client?.CLOSING) {
    client.close();
    client = new WebSocket(uri);
    setTimeout(() => sendMessage(msg), 500);
    return WebSocketState.CONNECTION_CLOSED;
  } else {
    setTimeout(() => sendMessage(msg), 500);
    return WebSocketState.CONNECTING;
  }
}

canvas.width = 0.98 * window.innerWidth;
canvas.height = window.innerHeight;

let ctx = canvas.getContext("2d");

let x;
let y;
let mouseDown = false;

const rect = canvas.getBoundingClientRect();

window.onmousedown = (e) => {
  x = e.clientX - rect.left;
  y = e.clientY - rect.top;

  ctx.beginPath();
  ctx.moveTo(x, y);

  sendMessage({
    type: WS_EVENT.DOWN,
    data: { x, y },
    id: client.uid
  });

  mouseDown = true;
};

window.onmouseup = (e) => {
  mouseDown = false;
};

window.onmousemove = (e) => {
  if (!mouseDown) return;

  x = e.clientX - rect.left;
  y = e.clientY - rect.top;

  if (mouseDown) {
    sendMessage({
      type: WS_EVENT.DRAW,
      data: { x, y },
      id: client.uid
    });
    ctx.lineTo(x, y);
    ctx.stroke();
  }
};

// Trigger the clear canvas event on clear button click
document.getElementById("clearCanvas").onclick = () => {
  clearCanvas()
  sendMessage({ type: WS_EVENT.CLEAR });
};
