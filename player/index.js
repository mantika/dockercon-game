var io = require('socket.io-client');
var needle = require('needle');
var querystring = require('querystring');

var socket = io('http://server:9090');
var playername = 'mantika';

socket.emit('newplayer', playername, function() {
    console.log('Connected as ' + playername);
    socket.on('newround', function (data) {
        var url = data.image_url;

        var qs = querystring.stringify({criteria: 'personal', content_url: url});
        console.log('Sent image to scorer: ' + url);
        needle.get('http://scorer:8080/score?' + qs, {parse_response: true}, function(err, response) {
            if (err) {
                return console.log('Error reaching scorer: ' + err);
            }
            if (response.statusCode != 200) {
                console.log('Error in scorer: ' + response.statusCode);
                return console.log(response.body);
            }
            console.log('Score: ' + response.body.score);
            var feedback = false;
            if (response.body.score > 60) {
                feedback = true;
            }
            console.log('Sending feedback: ' + feedback);
            socket.emit('feedback', feedback);
        });
    });
});
