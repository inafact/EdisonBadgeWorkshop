/*
 * EdisonBadegServerApp
 *
 * Copyright (c) 2014 
 * Licensed under the MIT license.
 */

'use strict';
/*jshint node:true*/

var _ = require('lodash');
var app = require('http').createServer(function(req, res){
        console.log('requested');
        res.writeHead(200);
        return res.end(null);
});
var io = require('socket.io')(app);
var Twit = require('twit');
var ROOT_HASHTAG = '#Edisonlab';

var T = new Twit({
    consumer_key: 'YOUR_CONSUMER_KEY',
    consumer_secret:'YOUR_CONSUMER_SECRET',
    access_token:'APPLICATION_ACCESS_TOKEN',
    access_token_secret:'APPLICATION_ACCESS_TOKEN_SECRET'
});
var stream = T.stream('statuses/filter', { track: [ROOT_HASHTAG] });

app.listen(process.env.APP_PORT||8888);

console.log(stream);
console.log('root hashtag is ', ROOT_HASHTAG);

stream.on('tweet', function (tweet) {
    io.sockets.to(tweet.user.screen_name).emit(
        'tweet',
        tweet
    );
        
    console.log('stream updated', new Date());
});

io.on('connection', function(socket){
    console.log('connected socket:', socket.id);
    
    socket.on('disconnect', function(){

    });

    socket
        .on('join', function(data){
            var _data = data ? data : {};
            
            if(_.has(_data, 'id')){
                socket.join(_data.id);
                socket.emit('joined', {channel:_data.id, status:200, socketId:socket.id});
            }
        })
        .on('leave', function(data){
            var _data = data ? data : {};
            if(_.has(_data, 'id')){
                socket.leave(_data.id);
                socket.emit('leaved', {channel:_data.id, status:200, socketId:socket.id});
            }
        })
        .on('ping', function(){
            console.log('ping');
        });    
});
