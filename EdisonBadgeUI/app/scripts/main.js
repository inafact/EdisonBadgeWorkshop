/* global _:true, PIXI:true, $:true, io:true, Ractive:true */

(function () {
    'use strict';

    // var SIO_URL = 'http://192.168.2.15:8080', socket = io(SIO_URL);
    var socket = io();
    
    socket
        .on('connect', function(data){
            socket.emit('download');           
            if(drawer){
                socket.emit('wifi');
            }
        })
        .on('download', function(data){
            drawer.set('saved', data);
            socket.emit('sync');
        })
        .on('sync', function(data){
            if(data !== null){
                if(_.has(data, 'mode')){
                    if(data.mode === 0){
                        if(_.has(data, 'play')){
                            editmenu.set('play', data.play);
                        }
                    }else{
                        if(_.has(data, 'join') && data.join !== null){
                            drawer.set('twit', data.join.id);
                            drawer.set('connected', true).then(function(){
                                toggleMenu();
                            });
                        }
                    }
                }
                
                if(_.has(data, 'loopInterval')){
                    editmenu.set('interval', data.loopInterval);
                }
            }
        })
        .on('wifi', function(data){
            drawer.set('ssid', data);
        })
        .on('wifi_done', function(data){
            drawer.set('scanning', false);            
            window.alert(data);
        });

    
    var editmenu = new Ractive({
        el:'.app-bar-container',
        template:'#editmenu',
        data: {
            global:true,
            edit:true,
            pen:true,
            play:false,
            frame:false,
            interval:500
        }
    });
    
    var scenemenu = new Ractive({
        el:'.app-bar-footer .app-bar-container',
        template:'#editmenu',
        data: {
            label:false,
            nicename: false
        }
    });
    
    var help = new Ractive({
        el:'#help-text',
        template:'#help',
        data: _.defaults(editmenu.data, scenemenu.data)
    });
    
    var drawer = new Ractive({
        el:'.navdrawer-container',
        template:'#drawer',
        data: {
            saved:[],
            ssid:{},
            textssid:'',
            setupMode:true,
            encryptMode:0,
            selected:'-1',
            twit:'',
            pswd:'',
            connected:false,
            scanning:false,
            anim: true,
            speed: true
        }
    });

    editmenu
        .on({
            onFrameChange: function(){
                if(this.get('frame')){
                    var cf = this.get('frame');
                    this.set('frame', {total:cf.total, current:(cf.current + 1) > cf.total ? 1 : (cf.current + 1)});
                    _.each(frames, function(f, i){
                        f.alpha = (i !== (this.get('frame').current - 1)) ? 0.4 : 0.8;
                    }, this);
                    restoreState(frames[this.get('frame').current - 1].data);
                    blob();
                }
                help.set(_.defaults(this.data, scenemenu.data));
            },
            onPenModeChange: function(){
                this.set('pen', !this.get('pen'));
                help.set(_.defaults(this.data, scenemenu.data));
            },
            onClear: function(){
                restoreState(_.map(_.range(0,64), function(n){return 0;}));
                updateFrame();
            },
            onPlayToggle: function(e){
                var t = false;
                
                if(!this.get('play')){
                    if(frames.length > 0){
                        socket.emit('play', {currentScene:scenemenu.get('label')});
                        if(drawer.get('twit') !== false && drawer.get('twit') !== ''){
                            socket.emit('leave', {id:drawer.get('twit')});   
                        }
                        drawer.set('connected', false);
                        startLooper();
                        t = true;
                    }
                }else{
                    stopLooper();
                    socket.emit('stop');
                }
                
                this.set('play', t);                
            },
            helpClear: function(){
                help.set({hover:true, clear:false});
            },
            helpPlay: function(){
                help.set({hover:true, clear:true});
            },
            helpOut: function(){
                help.set({hover:false, clear:false});
            }
        });

    scenemenu
        .on({
            onFrameAdd: function(){
                if(editmenu.get('edit')){
                    addFrame();
                }
            },
            onFrameDelete: function(){
                if(editmenu.get('edit')){
                    deleteFrame();
                }
            },
            onSceneSave: function(){
                var l = this.get('label') !== false ? this.get('label') : new Date().getTime();
                var s = !this.get('nicename') ? l : this.get('nicename');
                
                socket.emit('upload', {
                    nicename:s,
                    label:l,
                    data: _.map(frames, function(f){return getBmp(f.data);})
                });
            }
        });
    
    drawer
        .on({
            onEditSaved: function(e){
                var bits = this.get(e.keypath).data;
                
                _.each(frames, function(f, i){
                    bgContainer.removeChild(f);
                });
                
                frames.splice(0, frames.length);
                
                _.each(bits, function(b, i){
                    restoreState(bmp2bit(b));
                    addFrame(true); //...
                });

                scenemenu.set({
                    label:this.get(this.event.keypath).label,
                    nicename:this.get(this.event.keypath).nicename
                }).then(_.bind(function(){
                    help.set('nicename', scenemenu.get('nicename'));
                    blob();
                }, this));
            },
            
            onChangeInputMode: function(){
                this.set('setupMode', !this.get('setupMode'));
            },
            
            onChangeWifi: function(e){
                var mode = this.get('setupMode');
                var selected = this.get('selected');
                var tssid = this.get('textssid');
                var pswd = this.get('pswd');
                
                if((mode && selected === '-1') || (!mode && tssid === '')){return;}
               
                
                this.set('scanning', true);
                                
                var env = mode ? {ssid:selected, pswd:pswd} : {ssid:tssid, pswd:pswd};
                if(mode){
                    var _c = _.findWhere(_.values(this.get('ssid')), {value:selected});
                    if(!_.isUndefined(_c)){
                        env.type = _c.type;
                    }
                }else{
                    env.type = this.get('encryptMode') === 0 ? 'WPA' : this.get('encryptMode') === 1 ? 'WEP' : '';
                }
                
                socket.emit('changewifi', env);
            },

            onChangeWifiEnv: function(e){
                if($(e.node).val() === '-1'){
                    this.set('selected', '-1');
                    socket.emit('wifi', 1);
                }else{
                    this.set('selected', $(e.node).children('option:selected').text());
                }
                this.set('pswd', '');
            },

            onChangeEncrypt: function(e){
                this.set('encryptMode', (this.get('encryptMode') + 1) % 3);
            },
            
            onStreamToggle: function(e){                
                if(this.get('twit') !== false && this.get('twit') !== ''){
                    this.set('connected', !this.get('connected'));
                    if(this.get('connected')){
                        socket.emit('join', {id:this.get('twit')});
                        this.set('connected', true);
                        editmenu.set('play', false);
                        stopLooper();
                        // setInteractive(false);
                    }else{
                        socket.emit('leave', {id:this.get('twit')});
                        this.set('connected', false);
                        // setInteractive(true);
                    }
                }else{
                    this.set('connected', false);
                    _.delay(function(){$('input[name="twitid"]').focus();}, 500);
                } 
            },

            //- not impl
            setRotate: function(){
                socket.emit('rotate', this.get('rotate'));
            },

            setAnim: function() {
                this.set('anim', !this.get('anim'));
                socket.emit('anim', this.get('anim'));
            },
            
            setSpeed: function() {
                this.set('speed', !this.get('speed'));
                socket.emit('spped', this.get('speed'));
            }
            //--
        });

    //- not impl
    $('.twoption').hide();

    
    var querySelector = document.querySelector.bind(document);
    var navdrawerContainer = querySelector('.navdrawer-container');
    var body = document.body;
    var appbarElement = querySelector('.app-bar');
    var appbarFooterElement = querySelector('.app-bar-footer');
    var menuBtn = querySelector('.menu');
    var main = querySelector('main');

    function closeMenu() {
        body.classList.remove('open');
        appbarElement.classList.remove('open');
        appbarFooterElement.classList.remove('open');
        navdrawerContainer.classList.remove('open');
    }

    function toggleMenu() {
        body.classList.toggle('open');
        appbarElement.classList.toggle('open');
        appbarFooterElement.classList.toggle('open');
        navdrawerContainer.classList.toggle('open');
        navdrawerContainer.classList.add('opened');
    }

    main.addEventListener('click', closeMenu);
    menuBtn.addEventListener('click', toggleMenu);
    navdrawerContainer.addEventListener('click', function (event) {
        if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
            closeMenu();
        }
    });

    
    var interactive = true;
    var stage = new PIXI.Stage(0xFFFFFF, interactive);
    var stageWidth = ($('main').width() < $(window).height()) ? $('main').width() : $(window).height() - 120;
    var renderer = new PIXI.CanvasRenderer(stageWidth, stageWidth);
    var rects = [];
    var frames = [];
    var rw = (renderer.width - 2) / 10;
    var looper = null;
    
    $('#drawing').append(renderer.view);

    function _resize() {
        var screenHeight = window.innerHeight - $('main').offset().top;
        var screenWidth = ($('main').width() < $(window).height()) ? $('main').width() : $(window).height() - 120;
        var width = screenWidth;
        var height = screenHeight;
        var ratio = stage.height/stage.width;
        
        if(screenHeight > screenWidth){
            ratio = stage.height/stage.width;
            height = ratio * screenWidth;
        }else{
            ratio = stage.width/stage.height;
            width = screenHeight * ratio;
        }
        
        $('#drawing canvas').css({
            width:width+'px', height:height+'px'
        });
    }
    $(window).on('resize', _resize);
    
    function animate() {
        renderer.render(stage);
        window.requestAnimFrame(animate);        
    }
    window.requestAnimFrame(animate);

    function getBmp(bits) {
        var bvalue = 0, barr = [];
        _.each(bits, function(b, i){
            bvalue += (b << (7 - (i % 8)));
            if((i % 8) === 7){
                barr.push(bvalue);
                bvalue = 0;
            }
        });
        
        return barr;
    }

    function bmp2bit(bmp) {
        var barr = [];
        _.each(bmp, function(b, i){
            for(var j=0; j<8; j++){
                barr.push((b >> (7 - j)) & 0x01);
            }
        });
        return barr;
    }
    
    function blob(){
        var ttext = '', bvalue = 0, barr = [];
        _.each(rects, function(r, i){
            r.isdown = false;
            
            // ttext += (r.toggle === 0) ? '◎' : '◉';
            ttext += (r.toggle === 0) ? '\u25ce' : '\u25c9';
            ttext += ((i % 8) === 7) ? '\r\n' : '';
            
            bvalue += (r.toggle << (7 - (i % 8)));
            if((i % 8) === 7){
                barr.push(bvalue);
                bvalue = 0;
            }
        });
        
        socket.emit('blob', {data:barr});

        if(window.twttr && _.isNull(looper)){
            window.twttr.widgets.createShareButton(
                'http://edison-lab.jp',
                $('.sct').get(0),
                {
                    count: 'none',
                    text: ttext,
                    hashtag: 'Edisonlab',
                    size: 'large'
                }
            ).then(function(){
                if($('.sct').children().size() > 1){$('.sct').children().eq(0).remove();}
            });
        }
    }
    
    function restoreState(s){
        if(rects.length === s.length && _.isArray(s)){
            _.each(rects, function(r, i){
                r.toggle = r.alpha = s[i];
            });
        }
    }

    function updateFrame(){
        var _t = fgContainer.generateTexture(1, 1, renderer);
        var _m = [];

        if(editmenu.get('frame')){
            frames[editmenu.get('frame').current - 1].setTexture(_t);

            _.each(rects, function(r, i){
                _m.push(r.toggle);
            });
            
            frames[editmenu.get('frame').current - 1].data = _m;
        }
        
        blob();
    }
    
    function addFrame(mode){
        //--
        if(_.size(frames) > 7){
            return;
        }
        //--
        
        var _t = fgContainer.generateTexture(1, 1, renderer);
        var _s = new PIXI.Sprite(_t);
        var _m = [];
        _s.width = _s.height = rw;
        _s.y = rw * _.size(frames);
        bgContainer.addChild(_s);        
        _.each(rects, function(r, i){
            _m.push(r.toggle);
        });
        _s.data = _m;
        
        if(frames.length > 0 && mode !== true){
            var fc = editmenu.get('frame');
            frames.splice(fc.current - 1, 0, _s);
            editmenu.set('frame', {total:frames.length, current:fc.current + 1});
        }else{
            frames.push(_s);
            editmenu.set('frame', frames.length === 0 ? false : {total:frames.length, current:frames.length});
        }

        _.each(frames, function(f, i){
            f.y = rw * i;
            f.alpha = (i === editmenu.get('frame').current - 1) ? 0.8 : 0.4;
        });

        help.set(editmenu.data);
    }

    function deleteFrame(){
        if(editmenu.get('frame') && frames.length > 1){
            bgContainer.removeChild(frames[editmenu.get('frame').current - 1]);
            frames.splice(editmenu.get('frame').current - 1, 1);
            _.each(frames, function(r, i){
                r.y = rw * i;
            });
            editmenu.set('frame', {
                total:frames.length,
                current:editmenu.get('frame').current > frames.length ? frames.length : editmenu.get('frame').current
            }).then(function(){
                _.each(frames, function(f, i){
                    f.alpha = (i !== editmenu.get('frame').current - 1) ? 0.4 : 0.8;
                });
                restoreState(frames[editmenu.get('frame').current - 1].data);
            });
        }
        
        help.set(editmenu.data);
    }

    function startLooper(){
        looper = window.setInterval(function(){
            var cf = editmenu.get('frame');
            editmenu
                .set('frame', {total:cf.total, current:(cf.current + 1) > cf.total ? 1 : (cf.current + 1)})
                .then(function(){
                    help.set(editmenu.data);
                    if(!_.isUndefined(frames[editmenu.get('frame').current - 1])){
                        restoreState(frames[editmenu.get('frame').current - 1].data);
                        _.each(frames, function(f, i){
                            f.alpha = (i !== editmenu.get('frame').current - 1) ? 0.4 : 0.8;
                        });
                        blob();
                    }
                });
        }, editmenu.get('interval'));
    }

    function stopLooper(){
        if(looper){
            window.clearInterval(looper);
            looper = null;
            blob();
        }
    }

    // function setInteractive(t){
    //     stage.interactive = t;
    //     _.each(rects, function(r){
    //         r.interactive = t;
    //     });
    // }
    
    stage.interactionManager.onTouchMove = function(data){
        var coffset = $('#drawing').position();
        var cx = data.targetTouches[0].clientX - coffset.left;
        var cy = data.targetTouches[0].clientY - coffset.top;
        
        _.each(rects, function(r){
            var b = r.position;
            var h = r.hitArea;
            if((b.x <= cx && cx <= (b.x + h.width)) && (b.y <= cy && cy <= (b.y + h.height) && r.isdown)){
                r.toggle = r.alpha = editmenu.get('pen') ? 1 : 0;
            }
        });
    };

    //- background
    var bgContainer = new PIXI.DisplayObjectContainer();
    stage.addChild(bgContainer);

    var fgContainer = new PIXI.DisplayObjectContainer();
    stage.addChild(fgContainer);    
    
    _.each(_.range(0, 100), function(v, i){
        var s = new PIXI.Graphics();
        if(((i % 10) < 1) || ((i % 10) > 8) || i > 79){
            s.lineStyle(1, 0x000000, 0);
        }else{
            s.lineStyle(1, 0xcccccc, 1);
        }
        s.drawRect(0, 0, rw, rw);
        s.position.x = (rw * (i % 10));
        s.position.y = (rw * Math.floor(i / 10));
        bgContainer.addChild(s);
    });

    //- foreground
    _.each(_.range(0, 64), function(v, i){
        var s = new PIXI.Graphics();
        var rad = (rw - 6) / 2;
        
        s.beginFill(0x4285F4, 0.85);
        s.drawRect(1, 1, rw - 1, rw - 1);
        s.endFill();
        s.beginFill(0x4285F4, 1);
        s.drawCircle(1 + rad + 3, 1 + rad + 3, rad);
        s.endFill();
        
        s.position.x = (rw * (i % 8)) + rw;
        s.position.y = (rw * Math.floor(i / 8));
        s.hitArea = new PIXI.Rectangle(0,0,rw,rw);
        s.buttonMode = true;
        s.interactive = true;
        s.alpha = s.toggle = 0;
        
        s.mousedown = s.touchstart = function(data) {
            $('#sct').empty();

            _.each(rects, function(r){
                r.isdown = true;
            });
            this.toggle = this.alpha = editmenu.get('pen') ? 1 : 0;
        };

        s.mouseup = s.touchend = s.mouseupoutside = s.touchendoutside = updateFrame;
        s.mouseover = function(data) {
            this.isOver = true;
            if (this.isdown){                
                $('a.twitter-share-button').attr('data-text', data.target.position.x +',' + data.target.position.y);                
                this.toggle = this.alpha = editmenu.get('pen') ? 1 : 0;
            }
        };
        
        fgContainer.addChild(s);
        rects.push(s);
    });

    //- add empty frame
    addFrame();    
})();
