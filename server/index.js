var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');

server.listen(8080);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

var players = {}

var cleanImages = fs.readdirSync('./green')
var spamImages = fs.readdirSync('./red')
var isSpam;
var hasWinner;
var currentImage;


io.on('connection', function (socket) {
  socket.on('newplayer', function(username, fn){
    players[this] = {name: username, score: 0};
    console.log("New player has joined", username);
    fn(currentImage);
  });
  socket.on('disconnect', function() {
    delete players[this];
  });
  socket.on('feedback', function(data) {
    if (!hasWinner) {
      if (data == isSpam) {
        console.log("We have a winner: ",players[this].name);
        hasWinner = true;
        io.emit('winner', players[this].name);
        setTimeout(newRound, 5000);
      }
    }
  });
});


function newRound() {
  hasWinner = false;
  var arrayPick = Math.round(Math.random());
  var message = {};
  if (arrayPick == 0) {
    isSpam = true;
    var image = spamImages[Math.floor(Math.random()*spamImages.length)];
    message.image_url = 'http://s3.amazonaws.com/mantika-pictures/red/'+image;
  } else {
    isSpam = false;
    var image = cleanImages[Math.floor(Math.random()*cleanImages.length)];
    message.image_url = 'http://s3.amazonaws.com/mantika-pictures/green/'+image;
  }

  currentImage = message.image_url;

  console.log("Emitting new round with image  ", message.image_url);
  io.emit('newround', message)
}

newRound();


