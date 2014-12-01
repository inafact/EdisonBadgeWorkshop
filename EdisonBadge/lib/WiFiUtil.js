var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var util = require("util");
var events = require("events");
var _ = require('lodash');


function WiFiUtil(){
    this.scanning = false;    
    this.checking = false;
    this.bssid = {};    
    this.maxScan = 10;
    this.numScan = 0;
    // this.maxCheck = 20;
    // this.numCheck = 0;

    this.scanQueue = null;
    this.checkQueue = null;
    
    events.EventEmitter.call(this); 
}
util.inherits(WiFiUtil, events.EventEmitter);


WiFiUtil.prototype._scan = function(){
    var _self = this;
    var _ok = false;
    
    _self.scanQueue = spawn('wpa_cli', ['scan']);
    _self.scanQueue.stdout.setEncoding('utf8');
    _self.scanQueue.stdout.on('data', function(data) {
        if(data.match(/OK/) !== null){
            _ok = true;
        }
    });
    _self.scanQueue.on('exit', function(){
        if(_ok){
            console.log('ok,', _self.numScan);
            
            var res = spawn('wpa_cli', ['scan_results']);
            var _data = null;            
            res.stdout.setEncoding('utf8');
            res.stdout.on('data', function(data) {
                console.log('results,', _self.numScan, data);
                _data = data;
            });
            res.on('exit', function(){
                var row = _data !== null ? _data.split('\n') : [];
                if(_.size(row) > 2){
                    row = _.rest(row, 2);
                }
                _.each(row, function(r, i){
                    var s = (r !== '') ? r.split('\t') : null;
                    if(s !== null && !_.has(_self.bssid, s[0])){
                        _self.bssid[s[0]] ={type:s[3], value:s[4]};
                        _self.emit('data', _self.bssid);
                    }
                });                
                if(_self.numScan > 0){
                    _self.numScan --;
                    _.delay(function(){_self._scan();}, 5000);
                }else{
                    console.log('scan end');
                    _self.scanning = false;
                }
            });
        }else{
            console.log('fail,', _self.numScan);
            
            if(_self.numScan > 0){
                _self.numScan --;
                _.delay(function(){_self._scan();}, 5000);
            }else{
                console.log('scan end');
                _self.scanning = false;
            }
        }

        _self.scanQueue = null;
    });
};

WiFiUtil.prototype.scan = function(){
    var _self = this;
    
    if(_self.scanning){
        return;
    }

    _self.numScan = _self.maxScan;
    _self.scanning = true;
    
    exec('systemctl stop hostapd && sleep 2 && systemctl start wpa_supplicant && sleep 4', function(){
        console.log('scan start');
        _self._scan();
    });
};

WiFiUtil.prototype.scanStop = function(){
    this.numScan = 0;
    this.scanning = false;

    //
    this.checking = false;
};

WiFiUtil.prototype._check = function(){
    var _self = this;
    var _ok = false;
    var _data = '';

    _self.checkQueue = spawn('wpa_cli', ['status']);
    _self.checkQueue.stdout.setEncoding('utf8');
    _self.checkQueue.stdout.on('data', function(data) {
        _data = data;
    });
    _self.checkQueue.on('exit', function(){
        console.log(_data);        
        _self.emit('data', _data.split('\n'));

        _self.checking = false;
        _self.checkQueue = null;
    });
};

WiFiUtil.prototype.changeRequest = function(data) {
    var _self = this;
    var exec_cmd = "configure_edison --changeWiFi ";

    if(!_.has(data,'type') || data.type === null || data.type === ''){
        exec_cmd +=  "OPEN '" + data.ssid + "'";
    }else if(data.type.match(/WPA[2]*/) !== null){
        exec_cmd +=  "WPA-PSK '" + data.ssid + "' '" + data.pswd + "'";
    }else if(data.type.match(/WEP/) !== null){
        exec_cmd +=  "WEP '" + data.ssid + "' '" + data.pswd + "'";
    }else{
        console.log('this type is not supported');
        return;
    }
    
    if(_self.checking){
        return;
    }

    _self.checking = true;
    
    exec(exec_cmd, function(e, stdout){
        console.log(stdout);
        _.delay(function(){_self._check();}, 10 * 1000);
    });
};

WiFiUtil.prototype.reassociate = function() {
    console.log('try reassociate...');
    var ra = spawn('wpa_cli', ['reassociate']);
    ra.stdout.setEncoding('utf8');
    ra.stdout.on('data', function(data) {
        console.log(data);
    });
    ra.on('exit', function(){
        console.log('reassociate done');
    });
};


module.exports = WiFiUtil;
