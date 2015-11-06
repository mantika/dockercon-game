var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');

server.listen(9090);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

var players = {}

var cleanImages = fs.readdirSync('./green')
var spamImages = fs.readdirSync('./red')

io.set('transports', ['websocket']);

io.on('connection', function (socket) {
  socket.on('newplayer', function(username, fn) {
    players[this.id] = {name: username, score: 0};
    console.log("New player has joined", username);
    if (fn) {
      fn();
    }
    newRound(this)
  });
  socket.on('disconnect', function() {
    delete players[this.id];
  });
  socket.on('feedback', function(data, fn) {
    var self = this;
    var player = players[this.id];
    var correct = false;
    if (player.image.isSpam == data) {
      console.log("Player", player.name ,"moderated correctly");
      player.score++;
      correct = true;
    }
    if (fn) {
      fn(correct);
    }
    setTimeout(function(){
      newRound(self);
    }, 1000);
  });
});

function getImage() {
  var arrayPick = Math.round(Math.random());
  var image = {};
  if (arrayPick == 0) {
    var imageName = spamImages[Math.floor(Math.random()*spamImages.length)];
    image.url = 'http://s3.amazonaws.com/mantika-pictures/red/'+imageName;
    image.isSpam = true;
  } else {
    var imageName = cleanImages[Math.floor(Math.random()*cleanImages.length)];
    image.url = 'http://s3.amazonaws.com/mantika-pictures/green/'+imageName;
    image.isSpam = false;
  }
  return image;
}


function newRound(playerSocket) {
  var image = getImage();
  players[playerSocket.id].image = image;
  playerSocket.emit('newround', {image_url: image.url});
}


setInterval(function() {
  console.log("Scoreboard:");
  for (player in players) {
    console.log(players[player].name, ":", players[player].score);
  }
}, 5000)


