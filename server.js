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

// ================================
// TURN設定
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
        urls:
          "stun:stun.relay.metered.ca:80"
      },
      {
        urls:
          "turn:global.relay.metered.ca:80",
        username,
        credential
      },
      {
        urls:
          "turn:global.relay.metered.ca:80?transport=tcp",
        username,
        credential
      },
      {
        urls:
          "turn:global.relay.metered.ca:443",
        username,
        credential
      },
      {
        urls:
          "turns:global.relay.metered.ca:443?transport=tcp",
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
    "connected:",
    socket.id
  );

  socket.on("join", (room) => {

    if (!room) return;

    socket.join(room);

    socket.data.room = room;

    console.log(
      socket.id +
      " joined room: " +
      room
    );

    socket.to(room).emit(
      "peer-joined"
    );

  });

  socket.on(
    "request-offer",
    (data) => {

      if (!data || !data.room) {
        return;
      }

      socket
        .to(data.room)
        .emit("request-offer");

    }
  );

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

  // ================================
  // カメラ切替
  // ================================

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

  // ================================
  // 画質・FPS変更
  // ================================

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

  socket.on(
    "disconnect",
    () => {

      console.log(
        "disconnected:",
        socket.id
      );

    }
  );

});

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
