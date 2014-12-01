var _ = require('lodash');

var SIO = require('./lib/sio.js');
var Manager = require('./lib/Manager.js');
var WiFiUtil = require('./lib/WiFiUtil.js');

//-- kill forked process first (for xdk's Run/Stop)
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var spn = spawn('ps');
spn.stdout.setEncoding('utf8');
spn.stdout.on('data',function(data) {
    var v = data.match(/[0-9]+\sroot[\s]+[0-9]+\s[A-Z][\s]+\/usr\/bin\/node\s\/node_app_slot\/lib\/matrix\/JSLEDMatrix8\n/g);
    _.each(v, function(vv){
        exec('kill -s 3 ' + vv.split(' ')[0]);
    });
});
//--


var sio = SIO();
var wifi = new WiFiUtil();
sio.matrix.stopDrawing();
sio.matrix.startDrawing();
sio.matrix.clear();


sio.on('connection', function(socket){
    if(wifi.scanning){
        wifi.scanStop();
    }
    
    socket
        .on('disconnect', function(){
            wifi.scanStop();
            
            console.log('start internal loop.., after 2 seconds');

            setTimeout(function() {                    
                var state = sio.appManager.getState();
                var scenes = sio.appManager.scenes;
                
                if(state !== null && state.play && state.mode === 0){
                    var vb = scenes.findWhere({label:state.current}).value(),
                        ic = 0;
                    if(_.has(vb, 'data') && vb.data.length > 0){
                        sio.appManager.setTimer(function(){
                            sio.matrix.clear();
                            sio.matrix.drawBmp(
                                vb.data[ic]
                            );
                            ic = (ic+ 1) % vb.data.length;
                        });
                    }        
                }                    
            }, 2000);
        })
        .on('wifi', function(data){
            wifi.scan();
        })
        .on('changewifi', function(data){
            console.log(data);
            wifi.scanStop();
            wifi.changeRequest(data);
        })
        .on('blob', function(data){
            var state = sio.appManager.getState();
            if(state !== null && state.mode === 1 && state.join !== null){return;}

            if(_.has(state, 'scroll') && state.scroll){
                sio.matrix.stopScroll();
                sio.appManager.emit('update_state', {scroll:false});
            }
            
            if(data.data.length === 8){
                sio.matrix.clear();
                sio.matrix.drawBmp(data.data);
            }
        });
});


sio.clientSocket
    .on('disconnect', function(){
        wifi.reassociate();
    })
    .on('tweet', function(data){
        var state = sio.appManager.getState();
        if(state === null || (state !== null && state.mode === 0)){return;}
        
        var ptext = data.text;
        
        if(_.size(data.entities.hashtags) > 0){
            _.each(data.entities.hashtags, function(h, i){
                ptext = ptext.replace('#' + h.text, '');
            });
        }
        
        ptext = ('  ' + ptext + '  ');
        
        sio.matrix.startDrawing();
        sio.matrix.drawStringWithCursor(ptext, 0, 0);
        sio.matrix.startScroll(Manager.DEFAULTS.SCROLL_SPEED);

        sio.appManager.emit('update_state', {lasttweet:ptext, scroll:true});
    });


wifi
    .on('data', function(data){
        if(_.isArray(data)){
            var msg = data.join(',');
            if(msg.match(/ip_address=[0-9\.]+/) !== null){
                msg = msg.replace(/.+,(ip_address=[0-9\.]+),.*/, '$1');
                msg = 'connected : ' + msg;
            }else{
                msg = 'status : \r\n' + msg;
            }
            sio.sockets.emit('wifi_done', msg);
        }else{
            sio.sockets.emit('wifi', data);
        }
    });


//-- reboot
sio.appManager.clearTimer();

var state = sio.appManager.getState();
var scenes = sio.appManager.scenes;

if(state !== null){
    if(state.mode === 0 && state.play){
        var vb = scenes.findWhere({label:state.current}).value(),
            ic = 0;
        if(_.has(vb, 'data') && vb.data.length > 0){
            sio.appManager.setTimer(function(){
                sio.matrix.clear();
                sio.matrix.drawBmp(
                    vb.data[ic]
                );
                ic = (ic+ 1) % vb.data.length;
            });
        }
    }else if(state.mode === 1 && state.lasttweet !== null && state.lasttweet.length > 0){
        if(state.join !== null){
            console.log('join to', state.join);
            sio.clientSocket.emit('join', state.join);
        }

        if(_.has(state, 'scroll') && state.scroll){
            sio.matrix.startDrawing();
            sio.matrix.drawStringWithCursor(state.lasttweet, 0, 0);
            sio.matrix.startScroll(Manager.DEFAULTS.SCROLL_SPEED);
        }
    }
}
//--
