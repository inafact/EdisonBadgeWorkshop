var app = require('./app');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioClient = require('socket.io-client');
var _ = require('lodash');

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var JSLEDMatrix8x8 = require('./matrix/JSLEDMatrix8x8.js');
var Manager = require('./Manager');

function sio() {
    http.listen(app.get('port'), function() {
        console.log('start listening..');
    });

    io.matrix = new JSLEDMatrix8x8(0, 0x50);
    io.appManager = new Manager();
    
    io.clientSocket = ioClient(Manager.DEFAULTS.PROXY_URL);
        
    io.clientSocket
        .on('connect', function(){
            console.log('connect to ' + Manager.DEFAULTS.PROXY_URL + '..');
            io.clientSocket.emit('ping');
        })
        .on('joined', function(data){
            io.sockets.emit('joined', data);
        })   
        .on('leaved', function(data){
            io.sockets.emit('leaved', data);
        });

    // 
    io.on('connection', function(socket){
        socket
            .on('join', function(data){
                var _data = data ? data : {};

                if(_.has(_data, 'id')){
                    console.log('join to', _data);
                    io.clientSocket.emit('join', _data);
                }

                io.appManager.emit('update_state', {mode:1, join:_data, play:false});
                io.appManager.clearTimer();
            })
            .on('leave', function(data){
                var _data = data ? data : {};
                if(_.has(_data, 'id') && io.clientSocket){
                    console.log('leave from', _data);
                    io.clientSocket.emit('leave', _data);

                    io.appManager.emit('update_state', {join:null});
                    
                    // io.matrix.stopScroll();
                }
            })
            .on('download', function(data){
                socket.emit('download', io.appManager.getScenes());
            })
            .on('upload', function(data){
                io.appManager.emit('update_scene', data);                
                socket.emit('download', io.appManager.getScenes());
            })
            .on('sync', function(data){
                socket.emit('sync', io.appManager.getState());
            })
            .on('stop', function(data){
                io.appManager.emit('update_state', {play:false, current:null});
                io.appManager.clearTimer();                
            })
            .on('play', function(data){
                io.appManager.emit('update_state', {play:true, current:data.currentScene, mode:0});
                io.appManager.clearTimer();                

                io.matrix.stopScroll();
            });
    });
    
    return io;
}

module.exports = sio;
