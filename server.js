const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
/*
const valores = window.location.search;
const urlParams = new URLSearchParams(valores, urlParams);
*/
let info = {
  nombre: '',
  id: 0,
  setNombre: function(nombre) {
    this.nombre = nombre;
  },
  getNombre() { 
    return this.nombre;
  }
}

/*
let nombre='';


function square(nombre) {
  this.nombre = nombre;
}

*/
const {
   userJoin,
   getCurrentUser,
   userLeave,
   getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const router = express.Router();


router.get('/catch', (req, res) => {

  console.log(req.query.name);
  info.setNombre(req.query.name);

  console.log("lo que se obtuvo fue: "+ info.getNombre());
  //alert(req.query.name);

  console.log(__dirname);
  // res.redirect('http://localhost:3000');
  res.redirect('https://chats-virtualgadget.herokuapp.com');
  
})

app.use('/' ,router);

app.use(express.static(path.join(__dirname, 'public')));

const botName =  'Blumile bot ';

io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  
      // Welcome current user
      socket.emit('message', formatMessage(botName + info.getNombre() , `Bienvenido a la ${room} ${user.username}`));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} ' (${info.getNombre() }) ingresado a la sala`)
        );
  
      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });
  
    // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} ha salido de la sala`)
        );
  
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });
  });

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server corriendo en el puerto ${PORT}`))