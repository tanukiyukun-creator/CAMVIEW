const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("CAMVIEW server is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "CAMVIEW" });
});

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    socket.to(room).emit("peer-joined");
  });

  socket.on("offer", (data) => {
    socket.to(data.room).emit("offer", data.offer);
  });

  socket.on("answer", (data) => {
    socket.to(data.room).emit("answer", data.answer);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.room).emit("ice-candidate", data.candidate);
  });

  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`CAMVIEW running on port ${PORT}`);
});
