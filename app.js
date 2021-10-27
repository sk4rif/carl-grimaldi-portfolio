const { create } = require('domain');
const express = require('express');
const app = express();
const path = require('path');
const { getHeapCodeStatistics } = require('v8');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 5000

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

setTimeout(function(){
  io.emit('createchart');
},2000)



function getdata(){

  function countdown(){
    var s = 5
    io.emit('visible');
    var countdown = setInterval(function(){
      s = (s - 0.1).toFixed(1);
      io.emit('countdown', s);
      if (s==0){
        clearInterval(countdown);
        s=5
        io.emit('hide');
      }
    }, 100)
  };

  let bear2 = (getRandomInt(1200));
  let bull2 = (getRandomInt(1200));
  let bear4 = (getRandomInt(2400));
  let bull4 = (getRandomInt(2400));

  var data = []
  var sec = 0


  var  timeout = setTimeout(function(){
    let prev = 100;
    for (let i = 0; i < 375; i++) {
      prev += ((getRandomInt(10)*(1 - (Math.random()) * 2)));
      let flash = (getRandomInt(300));
        if (bear4 == flash){
          prev = prev/2
        };
      if (bull4 == flash){
        prev = prev*2
      };
      if (bear2 == flash){
        prev = prev/1.5
      };
      if (bull2 == flash){
        prev = prev*1.5
      };
      data.push({x: i, y: prev});
    }
    console.log(data);
    clearTimeout(timeout);


    var interval = setInterval(function(){
      var yvalue = (data[sec])
      JSON.stringify(yvalue);
      sec = sec + 1
      let price = yvalue.y
      //console.log(price);
      io.emit('newdata', price);
      console.log(price, sec)

      if (sec==374){
        sec=0
        clearInterval(interval);
        io.emit('clear');
        io.emit('createchart');
        getdata();
        countdown();
        //console.log(data);

        
      }
    

      if (yvalue.y<0){
        sec=0
        clearInterval(interval);
        io.emit('clear');
        io.emit('createchart');
        getdata();
        countdown();
        //console.log(data);
        
        
      }
    }, 40)
  }, 5000);
}
getdata();

io.on('connection', (socket) => {
    ////CHAT///////

    let numUsers = 0;


      let addedUser = false;

      // when the client emits 'new message', this listens and executes
      socket.on('new message', (data) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
          username: socket.username,
          message: data
        });
      });

      // when the client emits 'add user', this listens and executes
      socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
          numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
          username: socket.username,
          numUsers: numUsers
        });
      });

      // when the client emits 'typing', we broadcast it to others
      socket.on('typing', () => {
        socket.broadcast.emit('typing', {
          username: socket.username
        });
      });

      // when the client emits 'stop typing', we broadcast it to others
      socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
          username: socket.username
        });
      });

      // when the user disconnects.. perform this
      socket.on('disconnect', () => {
        if (addedUser) {
          --numUsers;

          // echo globally that this client has left
          socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
          });
        }
      });
});
