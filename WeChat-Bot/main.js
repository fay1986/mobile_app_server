/**
 * Created by simba on 5/2/17.
 */

const { Wechaty } = require('wechaty')
var DDP = require('ddp');
var login = require('ddp-login');
var async = require('async');
var mqtt = require('mqtt');
var http= require('http');
var debug_on = process.env.DEBUG || false;

var Datastore = require('nedb')
    , db = new Datastore({ filename: 'wechatbot.db', autoload: true });

var testNeo4J = require('./test_neo4j');
var testRedis = require('./test_redis');
var mqttOptions = {
    keepalive:30,
    reconnectPeriod:20*1000
}
var mqttClient  = mqtt.connect('ws://tmq.tiegushi.com:80',mqttOptions);
mqttClient.on('connect' ,function () {
    console.log('Connected to mqtt server')
    mqttClient.subscribe('status/service',{qos:1});
    mqttClient.subscribe('/wechat-bot/reposts',{qos:1});
})
mqttClient.on('message' ,function (topic,message) {
    console.log(topic+': '+message);
    if(topic === 'status/service' ){
        var json = JSON.parse(message);
        if(json.service && (typeof json.serviceIndex) !== 'undefined') {
            var isProd = json.production;
            db.update({
                service: json.service,
                serviceIndex: json.serviceIndex,
                isProd: isProd
            }, {
                $set: {by: new Date().getTime()}
            }, {upsert: true}, function (err, doc) {
                debug_on && console.log(err)
                debug_on && console.log(doc)
                db.persistence.compactDatafile();
                // A new document { _id: 'id5', planet: 'Pluton', distance: 38 } has been added to the collection
            });
        }
    } else if (topic === '/wechat-bot/reposts'){
         var json = JSON.parse(message);
         var text = '';
         if (json.texts.length <= 0)
            return;
        for(var i=0;i<json.texts.length;i++){
            if (text.length > 0)
                text += ',';
            text += json.texts[i].title + '('+json.texts[i].time+')';
        }
        console.log(json.texts.length+' 条待审核的贴子:', text);
        reportToWechatRoom(json.texts.length+'条待审核的贴子:'+text)
    }
})
var switchAccount = require('./switch-account');
var example = require('./post-example');

var host = "host1.tiegushi.com";
var port = 80;

var ddpClient = new DDP({
    host: host,
    port: port
});

var token = null;
var loginUser = null;
var baseLogin = function(callback){
    login(ddpClient, {
        env: 'METEOR_TOKEN',
        method: 'account',
        account: 'monitor@163.com',
        pass: 'qwezxc',
        retry: 1,
        plaintext: false
    }, function(error, userInfo){
        if (!error){
            token = userInfo.token;
            loginUser = userInfo;
        } else {
            token = null;
            loginUser = null;
        }
        console.log('login user:', userInfo);
        callback && callback(error, userInfo)
    });
};
var ddpLogin = function(callback){
    if (token)
        return login.loginWithToken(ddpClient, token, function (error, userInfo) {
            if (error) {return baseLogin(callback);}
            callback && callback(error, userInfo)
        });
    baseLogin(callback);
};

function testLogin(callback){
    var begin = new Date()
    ddpClient.connect(function (err) {
        if (err) {
            //reportToWechatRoomAlertALL('机器人助理 无法通过DDP连接到服务器 '+host+':'+port);
            try{
                ddpClient.close()
            } catch(e){
            }
            try {
                console.log('机器人助理 无法通过DDP连接到服务器 '+host+':'+port)
                callback('机器人助理 无法通过DDP连接到服务器 '+host+':'+port)
            } catch(e){
            }
            return
        }


        ddpLogin(function(error, userInfo){
            if (error) {
                //reportToWechatRoomAlertALL('机器人助理 登陆故事贴失败')
                ddpClient.close()
                try{
                    console.log('无法通过DDP登陆故事贴')
                    callback('无法通过DDP登陆故事贴')
                } catch (e){
                }
                return
            } else {
                // We are now logged in, with userInfo.token as our session auth token.
                // token = userInfo.token;
                var timeDiff = new Date() - begin
                // reportToWechatRoom('机器人助理 成功登陆故事贴,耗时'+timeDiff+'ms')
                // ddpClient.close()
                try{
                    debug_on && console.log('成功登陆('+timeDiff+'ms)')
                    callback(null,'成功登陆('+timeDiff+'ms)')
                } catch (e){
                }
                return
            }
        });
    });
}

function testSubscribeShowPost(callback){
    var begin = new Date()
    ddpClient.subscribe(
        'postInfoById',                  // name of Meteor Publish function to subscribe to 
        ['WrnSqg89a3r4nPwXr'],                       // any parameters used by the Publish function 
        function (error) {
            if (error) {
                //reportToWechatRoomAlertALL('获取一篇帖子数据  失败！')
                reportToWechatRoomAlertALL(error)
                ddpClient.unsubscribe('WrnSqg89a3r4nPwXr')
                ddpClient.close()
                try{
                    console.log('无法通过DDP获取帖子数据')
                    callback('无法通过DDP获取帖子数据')
                } catch (e){

                }
                return
            } else {
                debug_on && console.log('posts complete:');
                debug_on && console.log(ddpClient.collections.posts);
                var timeDiff = new Date() - begin
                //reportToWechatRoom('成功获取一篇帖子数据,  耗时'+timeDiff+'ms')
                ddpClient.unsubscribe('WrnSqg89a3r4nPwXr')
                ddpClient.close()
                try{
                    debug_on && console.log('帖子数据('+timeDiff+'ms)');
                    callback(null,'帖子数据('+timeDiff+'ms)')
                } catch (e){
                }
                return
            }
        }
    );
}

function getProductionServerOnlineStatus(callback){
    var begin = new Date().getTime() - 60*1000;
    db.count({ isProd: true }, function (err, prodServer) {
        db.count( {$and:[{isProd: true},{by :{$gt:begin}}]}, function (err,prodServerOnline) {
            if(prodServerOnline < prodServer){
                db.find( {$and:[{isProd: true},{by :{$lt:begin}}]}, function (err,docs) {
                    var serverLists = []
                    for(var i=0;i<docs.length;i++){
                        serverLists.push(docs[i].service+'['+docs[i].serviceIndex+']')
                    }
                    console.log('不在线或异常，请检查')
                    callback(serverLists.toString()+'不在线或异常，请检查')
                })
                return
            }
            db.count({ isProd: false }, function (err, testServer) {
                db.count( {$and:[{isProd: false},{by :{$gt:begin}}]}, function (err,testServerOnline) {

                    if(testServerOnline < testServer){
                        db.find( {$and:[{isProd: false},{by :{$lt:begin}}]}, function (err,docs) {
                            var serverLists = []
                            for(var i=0;i<docs.length;i++){
                                serverLists.push(docs[i].service+'['+docs[i].serviceIndex+']')
                            }
                            console.log(serverLists.toString()+'不在线或不在调试')
                        })
                    }
                    try{
                        var msg = '['+prodServerOnline+'/' +prodServer+']产品服务器在线,['+testServerOnline+'/' +testServer+']本地服务器在线'
                        debug_on && console.log(msg)
                        callback(null,msg)
                    } catch (e){
                    }
                });
            });
        });
    });
}
function reportHowManyProductionServerIsBeingMonitored() {
    db.find({isProd: true}, function (err, docs) {
        var serverLists = []
        if(err) {
            console.log('nedb find err: ' + err)
        }

        if (docs.length > 0) {
            for (var i = 0; i < docs.length; i++) {
                serverLists.push(docs[i].service + '[' + docs[i].serviceIndex + ']')
            }
            var msg = '正在监控' + serverLists.length + '台产品服务器(' + serverLists.toString() + ')'
            console.log(msg)
            reportToWechatRoom(msg)
        } else {
            console.log('未能成功监测产品服务器')
            reportToWechatRoom('未能成功监测产品服务器')
        }
    })
}
function testSwitchAccount(callback){
    var begin = new Date();

    if (!loginUser.id) {
        debug_on && console.log('loginUser.id=' + loginUser.id)
        return;
    }

    switchAccount(ddpClient, loginUser.id, 'mdaRAZBL73d8KsQP7', function(err){
        if (err){
            ddpClient.close();
            //reportToWechatRoomAlertALL('！');
            //reportToWechatRoomAlertALL(error);
            console.log('切换帐号  失败')
            try{callback && callback('切换帐号  失败');}catch(e){}
        } else {
            var timeDiff = new Date() - begin;
            //reportToWechatRoom('切换帐号,  耗时'+timeDiff+'ms');
            debug_on && console.log('切换帐号('+timeDiff+'ms)')
            try{callback && callback(null,'切换帐号('+timeDiff+'ms)');}catch(e){}
        }
    });
}

function testPostNew(callback){
    var begin = new Date();
    var post = example();
    post._id = new Date().getTime() + '' + Math.round(Math.random()*9999999);
    ddpClient.call('/posts/insert', [post], function(error, res){
        if (error){
            try{ddpClient.close()}catch(e){}
            console.log('发贴失败')
            return callback('发贴失败');
        }

        debug_on && console.log('发贴成功')
        ddpClient.call('/posts/remove', [{_id: post._id}], function(){
            debug_on && console.log('post-id:', post._id);
            var timeDiff = new Date() - begin;
            try{callback && callback(null,'发贴('+timeDiff+'ms)');}catch(e){}
        });
    });
}

function testImportPost(callback){
    var begin = new Date();
    var req = http.request({
        hostname: 'host1.tiegushi.com',
        port: 80,
        path: '/import-server/ras6CfDNxX7mD6zq7/' + encodeURIComponent('http://www.baidu.com'),
        method: 'GET'
    }, function(res){
        var text = '';
        res.setEncoding('utf8'); 
        res.on('data', function(chunk){
            text += chunk;
        });
        res.on('end', function(){
            var result = text.trim().split('\r\n');
            var json = JSON.parse(result[result.length-1]).json;
            var id = json.substr(json.lastIndexOf('/')+1);
            console.log('http res:', result);
            console.log('import post id:', id);

            var timeDiff = new Date() - begin;
            try{
                http.get('http://host1.tiegushi.com/import-cancel/' + id);
                ddpClient.call('/posts/remove', [{_id: id}]);
                debug_on && console.log('快速导入('+timeDiff+'ms)')
                callback && callback(null,'快速导入('+timeDiff+'ms)');
            }catch(e){}
        });
    });
    req.on('error', function(err){
        try{ddpClient.close()}catch(e){}
        console.log('http err:', err);
        console.log('快速导入失败')
        return callback('快速导入失败');
    });
    req.end();
}

var globalRoom = null
var reportToWechatRoom = function(string){
    if(string && globalRoom){
        globalRoom.say(string)
    }
}
var reportToWechatRoomAlertALL = function(string){
    if(string && globalRoom){
        globalRoom.say(string,globalRoom.memberList())
    }
}
var recorder = {};
var simpleMessageHandle = function(message){
    if(globalRoom &&  message.room() ===  globalRoom){
        if(message.typeApp()){
            console.log('APP Type is '+message.typeApp())
            var appMsg = message.obj;
            var url = appMsg.url;
            var from = appMsg.from;
            var newMsg = '';
            if(!recorder[from]){
                recorder[from] = new Date()
                newMsg += '这是本次监控记录中您第1次发帖'
            } else {
                var timeDiff = new Date() - recorder[from]
                newMsg += '这个帖子和您上次发帖的间隔是'+Math.round(timeDiff/1000/60)+'分钟'
                console.log(timeDiff)
                recorder[from] = new Date()
            }
            globalRoom.say(newMsg, message.from())
            console.log(message.mentioned())
        }
    }
}

wechatInstance = Wechaty.instance() // Singleton

wechatInstance.on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`))
wechatInstance.on('login',       user => console.log(`User ${user} logined`))
wechatInstance.on('message', function(message){
    if(!globalRoom){
        var room = message.room()
        if(room && room.topic()==='故事贴监控群'){
            globalRoom = room;
            globalRoom.say('机器人助理 加入监控群，每次重启 机器人助理 后，需要任意人在监控群中发言激活功能')

            intervalTask()
            reportHowManyProductionServerIsBeingMonitored()
            console.log(room)
        }
    } else {
        simpleMessageHandle(message)
    }
    console.log(`Message: ${message}`)
    //console.log(message)
})
wechatInstance.init()

taskList = [testLogin,testPostNew,testImportPost,testSwitchAccount,
    testSubscribeShowPost,testNeo4J,testRedis,getProductionServerOnlineStatus]
var isTesting = false;
var intervalTask = function(){
    if(isTesting){
        console.log('队列中的任务正在执行中')
        return
    } else {
        isTesting = true;
        async.series(taskList,function(err,results){
            isTesting = false;
            if(!err){
                console.log(err)
                var msg = '['+ results.length + '/'+ taskList.length + '] 检查通过,详情:' + results.toString()
                reportToWechatRoom(msg)
                console.log(msg)
            } else {
                console.log('失败：'+err)
                reportToWechatRoomAlertALL(err)
            }
        })
    }
}
setInterval(intervalTask, 1*60*1000)
setInterval(reportHowManyProductionServerIsBeingMonitored,15*60*1000)

intervalTask()
reportHowManyProductionServerIsBeingMonitored()

process.addListener('uncaughtException', function (err) {
    var msg = err.message;
    if (err.stack) {
        msg += '\n' + err.stack;
    }
    if (!msg) {
        msg = JSON.stringify(err);
    }
    console.log(msg);
    try{
        msg += console.trace();
    } catch(e){
        reportToWechatRoomAlertALL('监控程序出现内部错误：'+msg);
    }
});
