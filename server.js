const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('✅ متصل:', socket.id);
    
    socket.on('check name', (name, callback) => {
        const exists = Array.from(connectedUsers.values()).some(u => u.name === name);
        callback(exists);
    });
    
    socket.on('user join', (user) => {
        if (Array.from(connectedUsers.values()).some(u => u.name === user.name)) {
            socket.emit('name exists');
            return;
        }
        
        socket.userData = user;
        connectedUsers.set(socket.id, user);
        
        io.emit('user joined', user);
        io.emit('users update', Array.from(connectedUsers.values()));
        console.log(`👋 ${user.name} انضم`);
    });
    
    socket.on('chat message', (data) => {
        console.log(`💬 ${data.userName}: ${data.text || data.type}`);
        io.emit('chat message', data);
    });
    
    socket.on('user leave', () => {
        if (socket.userData) {
            io.emit('user left', socket.userData);
            connectedUsers.delete(socket.id);
            io.emit('users update', Array.from(connectedUsers.values()));
        }
    });
    
    socket.on('disconnect', () => {
        if (socket.userData) {
            io.emit('user left', socket.userData);
            connectedUsers.delete(socket.id);
            io.emit('users update', Array.from(connectedUsers.values()));
            console.log(`👋 ${socket.userData.name} غادر`);
        }
    });
});

http.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
