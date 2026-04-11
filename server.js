const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// خدمة الملفات من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const connectedUsers = new Map();
const registeredNames = new Set();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('check name', (name, callback) => {
        const exists = registeredNames.has(name) || Array.from(connectedUsers.values()).some(u => u.name === name);
        callback(exists);
    });
    
    socket.on('user join', (user) => {
        if (registeredNames.has(user.name) || Array.from(connectedUsers.values()).some(u => u.name === user.name)) {
            socket.emit('name exists');
            return;
        }
        
        socket.userData = user;
        connectedUsers.set(socket.id, user);
        registeredNames.add(user.name);
        
        io.emit('user joined', user);
        io.emit('users update', connectedUsers);
    });
    
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });
    
    socket.on('user leave', (user) => {
        if (socket.userData) {
            registeredNames.delete(socket.userData.name);
        }
        connectedUsers.delete(socket.id);
        io.emit('user left', user);
        io.emit('users update', connectedUsers);
    });
    
    socket.on('disconnect', () => {
        if (socket.userData) {
            registeredNames.delete(socket.userData.name);
            io.emit('user left', socket.userData);
            connectedUsers.delete(socket.id);
            io.emit('users update', connectedUsers);
        }
    });
});

http.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
