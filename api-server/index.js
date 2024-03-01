const express = require('express');
const { generateSlugName } = require('./models/project-generation');
const { runBuildServer } = require('./models/aws-handler');
const { Redis } = require('ioredis');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app); // Create an HTTP server and integrate it with Express
const io = new Server(server, { cors: { origin: '*' } }); // Pass the server instance to Socket.IO

const PORT = 9000;
const SOCKET_PORT = 9002;

const subscriber = new Redis(process.env.REDIS_URL);

io.on('connection', (socket) => {
    try {
        console.log("Socket connected");
        socket.on('subscribe', (channel) => {
            console.log("Subscribing to channel");
            socket.join(channel);
            socket.emit('message', `Subscribed to ${channel}`);
        });
    } catch (error) {
        console.log("Error in socket connection", "api-server/index.js", "io.on", error);
    }
});

app.use(express.json());

app.post('/project', async (req, res) => {
    const { gitURL } = req.body;
    const slug = await generateSlugName(gitURL);

    // Start the container
    const response = await runBuildServer(gitURL, slug, slug);
    res.json({ slug, response });
});

async function initRedisSubscribe() {
    console.log("Subscribing to redis channels", "api-server/index.js", "initRedisSubscribe");
    subscriber.psubscribe('logs:*');
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message);
    });
}

initRedisSubscribe();

server.listen(PORT, () => {
    console.log(`API Server is running on port ${PORT}`, "api-server/index.js", "server.listen");
    io.listen(SOCKET_PORT, () => console.log(`Socket Server is running on port ${SOCKET_PORT}`));
});
