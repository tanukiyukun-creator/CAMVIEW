const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "CAMVIEW"
  });
});

io.on("connection", (socket) => {

  console.log("connected:", socket.id);


  socket.on("join", (room) => {

    socket.join(room);
    socket.data.room = room;

    socket.to(room).emit("peer-joined");

  });


  socket.on("request-offer", (data) => {

    socket.to(data.room).emit("request-offer");

  });


  socket.on("offer", (data) => {

    socket.to(data.room).emit(
      "offer",
      data.offer
    );

  });


  socket.on("answer", (data) => {

    socket.to(data.room).emit(
      "answer",
      data.answer
    );

  });


  socket.on("ice-candidate", (data) => {

    socket.to(data.room).emit(
      "ice-candidate",
      data.candidate
    );

  });


  // =====================================
  // カメラ切替
  // =====================================

  socket.on("switch-camera", (data) => {

    console.log(
      "switch-camera:",
      data.camera
    );

    socket.to(data.room).emit(
      "switch-camera",
      {
        camera: data.camera
      }
    );

  });


  socket.on("disconnect", () => {

    console.log(
      "disconnected:",
      socket.id
    );

  });

});


const PORT =
  process.env.PORT || 10000;


server.listen(PORT, () => {

  console.log(
    `CAMVIEW running on port ${PORT}`
  );

});
