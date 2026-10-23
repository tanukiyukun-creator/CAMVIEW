const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

app.use(express.static(path.join(__dirname, "public")));

// ================================
// Health
// ================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "CAMVIEW"
  });
});

// ================================
// TURN
// ================================

app.get("/api/turn-config", (req, res) => {

  const username =
    process.env.METERED_TURN_USERNAME;

  const credential =
    process.env.METERED_TURN_CREDENTIAL;

  if (!username || !credential) {
    return res.status(503).json({
      error: "TURN is not configured"
    });
  }

  res.json({
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80"
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username,
        credential
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username,
        credential
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username,
        credential
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username,
        credential
      }
    ]
  });
});

// ================================
// Socket.IO
// ================================

io.on("connection", (socket) => {

  console.log(
    "[Socket] connected:",
    socket.id
  );

  // ==============================
  // Join
  // ==============================

  socket.on("join", (room) => {

    if (!room) {
      return;
    }

    // 同じ部屋への重複Joinを防止
    if (socket.data.room === room) {

      console.log(
        "[Socket] already joined:",
        socket.id,
        room
      );

      return;
    }

    // 以前の部屋があれば退出
    if (socket.data.room) {

      socket.leave(
        socket.data.room
      );

    }

    socket.join(room);

    socket.data.room = room;

    console.log(
      "[Socket] joined:",
      socket.id,
      room
    );

    // 自分以外にだけ通知
    socket.to(room).emit(
      "peer-joined"
    );

  });

  // ==============================
  // Offer要求
  // ==============================

  socket.on(
    "request-offer",
    (data) => {

      if (
        !data ||
        !data.room
      ) {
        return;
      }

      socket
        .to(data.room)
        .emit(
          "request-offer"
        );

    }
  );

  // ==============================
  // Offer
  // ==============================

  socket.on(
    "offer",
    (data) => {

      if (
        !data ||
        !data.room ||
        !data.offer
      ) {
        return;
      }

      socket
        .to(data.room)
        .emit(
          "offer",
          data.offer
        );

    }
  );

  // ==============================
  // Answer
  // ==============================

  socket.on(
    "answer",
    (data) => {

      if (
        !data ||
        !data.room ||
        !data.answer
      ) {
        return;
      }

      socket
        .to(data.room)
        .emit(
          "answer",
          data.answer
        );

    }
  );

  // ==============================
  // ICE
  // ==============================

  socket.on(
    "ice-candidate",
    (data) => {

      if (
        !data ||
        !data.room ||
        !data.candidate
      ) {
        return;
      }

      socket
        .to(data.room)
        .emit(
          "ice-candidate",
          data.candidate
        );

    }
  );

  // ==============================
  // カメラ切替
  // ==============================

  socket.on(
    "switch-camera",
    (data) => {

      if (
        !data ||
        !data.room ||
        !data.camera
      ) {
        return;
      }

      socket
        .to(data.room)
        .emit(
          "switch-camera",
          {
            camera:
              data.camera
          }
        );

    }
  );

  // ==============================
  // 画質・FPS
  // ==============================

  socket.on(
    "change-quality",
    (data) => {

      if (
        !data ||
        !data.room
      ) {
        return;
      }

      socket
        .to(data.room)
        .emit(
          "change-quality",
          {
            quality:
              data.quality,
            fps:
              data.fps
          }
        );

    }
  );

  // ==============================
  // Disconnect
  // ==============================

  socket.on(
    "disconnect",
    (reason) => {

      console.log(
        "[Socket] disconnected:",
        socket.id,
        reason
      );

    }
  );

});

// ================================
// Start
// ================================

const PORT =
  process.env.PORT || 10000;

server.listen(
  PORT,
  () => {

    console.log(
      "CAMVIEW running on port " +
      PORT
    );

  }
);
