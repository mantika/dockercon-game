var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var os = require('os');

server.listen(9090, "0.0.0.0");

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
    players[this.id] = {name: username, score: 0, incorrect: 0};
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
    } else {
      player.incorrect++;
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
    image.isSpam = true;
  } else {
    var imageName = cleanImages[Math.floor(Math.random()*cleanImages.length)];
    image.isSpam = false;
  }
  image.url = 'http://s3.amazonaws.com/mantika-pictures/'+imageName;
  return image;
}


function newRound(playerSocket) {
  var image = getImage();
  // New round might be firing right after player disconnected
  if (players[playerSocket.id]) {
    players[playerSocket.id].image = image;
    playerSocket.emit('newround', {image_url: image.url, hostname: os.hostname()});
  }
}

function scoresorter(a,b) {
  return b.score - a.score;
}

setInterval(function() {
  var scores = [];
  for (player in players) {
    scores.push(players[player]);
  }
  scores.sort(scoresorter);

  io.emit('scores', scores);
}, 5000)


