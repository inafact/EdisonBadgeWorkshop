var util = require('util');
var events = require('events');
var path = require('path');
var _ = require('lodash');
var ldb = require('lowdb');
var stateStore = ldb(path.resolve(__dirname, '../', 'settings.json'));
var sceneStore = ldb(path.resolve(__dirname, '../', 'scenes.json'));

//
var DEFAULTS = {
    PROXY_URL:_.has(stateStore('g').first().value(), 'proxyUrl') ? stateStore('g').first().value().proxyUrl : '',
    LOOP_INTERVAL:_.has(stateStore('g').first().value(), 'loopInterval') ? stateStore('g').first().value().loopInterval : 500,
    SCROLL_SPEED:_.has(stateStore('g').first().value(), 'scrollSpeed') ? stateStore('g').first().value().scrollSpeed : 100
};
console.log(DEFAULTS);
//


function Manager(){
    var _self = this;
    
    this.state = stateStore('g');
    this.scenes = sceneStore('p');
    this.timer = {
        id:null,
        interval:DEFAULTS.LOOP_INTERVAL
    };

    this
        .on('update_state', function(data){
            if(_self.state.size().value() > 0){
                _self.state.first().assign(data).value();
            }else{
                _self.state.push(data).value();
            }
            console.log('update state', _self.state.value());
        })
        .on('update_scene', function(data){
            if(_.has(data, 'label')){
                _self.scenes.remove({label:data.label}).value();
                
                if(_self.scenes.size().value() < 8){
                    _self.scenes.push(data);
                }
            }
            console.log('update scenes', _self.scenes.value());
        });
    
    events.EventEmitter.call(this);
}
util.inherits(Manager, events.EventEmitter);


Manager.prototype.getState = function(){
    return (this.state.size().value() === 0) ? null : this.state.first().value();
};

Manager.prototype.getScenes = function(){
    return this.scenes.value();
};

Manager.prototype.clearTimer = function(){
    if(this.timer.id !== null){
        clearInterval(this.timer.id);
        this.timer.id = null;
    }
};

Manager.prototype.setTimer = function(f){
    if(this.timer.id === null){
        this.timer.id = setInterval(f, this.timer.interval);
    }
};


module.exports = Manager;

module.exports.DEFAULTS = DEFAULTS;
