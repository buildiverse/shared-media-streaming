const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
	transports: ["websocket"],
});

socket.on("connect", () => {
	console.log("Connected to server with socket id:", socket.id);

	// Emit join_session
	socket.emit("join_session", {
		sessionId: "CvOjlLWktIVrE4hhAAAF", // <-- Replace with valid sessionId
		userId: "user123",
		username: "Sridhar",
		avatar: null,
	});
});

socket.on("session_joined", (data) => {
	console.log("Session Joined:", data);

	// Send heartbeats after session join
	setInterval(() => {
		console.log("Sending heartbeat...");
		socket.emit("heartbeat");
	}, 5000);
});

socket.on("heartbeat_ack", (data) => {
	console.log("Heartbeat Ack:", data);
});

socket.onAny((event, ...args) => {
	console.log("Received Event:", event, args);
});

socket.on("disconnect", (reason) => {
	console.log("Disconnected:", reason);
});

socket.on("error", (error) => {
	console.error("Socket Error:", error);
});
