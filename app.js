var express = require('express');
var redis = require('redis');
const bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

var client = redis.createClient();


client.on('connect', function() {
    console.log('connected');
});

// setting the allRoom  - in case of failure it will loose all the data
// our room info will be also there in mongoDB, so we will fetch that info from there
client.set('allRoom',JSON.stringify({'allRoom':[]}), function(err, reply) {
    console.log(reply);
  });

 

// function to get all room - right now just returning room name
// room metadata can also be returned as json object

app.get('/getAllRoom', function(req, res){
    client.get('allRoom', function(err, reply) {
        const allRoom = JSON.parse(reply)['allRoom'];
        console.log(allRoom);
        res.send(JSON.stringify(allRoom));    
    });
})

app.get('/createRoom', function(req, res){
    console.log(req.body);
    const roomName = req.body.roomName;
    const roomAdmin = req.body.roomAdmin; // Either send UserName
    
    var chatRoomObj = {
        'admin':roomAdmin,
        'name':roomName,
        'host':[],
        'member':[],
    }

    // send this chatroom object to database as well and get the roomId created by mongo
    const roomID='sample'; // this will be returned by mongoDb

    // create the room in redis
    client.set(roomID,JSON.stringify(chatRoomObj), function(err, reply) {
        console.log(reply);
      });
    
    // updating all the room
      client.get('allRoom', function(err, reply){
        var all_room = JSON.parse(reply)['allRoom'];
        all_room.push(roomID);
        client.set('allRoom',JSON.stringify({'allRoom':all_room}), function(err, reply) {
            console.log(reply);
          });
    })
    res.send(roomID);
})

app.get('/addMemberInRoom', function(req, res) {
    const roomId = req.body.roomId;
    const userId = req.body.userId;
    client.get(roomId, function(err, reply) {
        var roomInfo = JSON.parse(reply); // Json object corresponding to that room
        roomInfo['member'].push(userId);
        
        client.set(roomId,JSON.stringify(roomInfo), function(err, reply) {
            console.log(reply);
          });
        
        res.send("done");    
    });


})

app.get('/getRoomInfo', function(req,res){
    const roomId = req.body.roomId;

    client.get(roomId, function(err, reply){
        res.send(JSON.stringify(JSON.parse(reply)));
    });
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("listening at http://%s:%s", host, port)
})