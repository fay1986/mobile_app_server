/**
 * Created by simba on 5/2/17.
 */

const { Wechaty } = require('wechaty')
var DDP = require('ddp');
var login = require('ddp-login');
var async = require('async');

var host = "host1.tiegushi.com";
var port = 80;

var ddpClient = new DDP({
    host: host,
    port: port
});

function testLogin(callback){
    var begin = new Date()
    ddpClient.connect(function (err) {
        if (err) {
            reportToWechatRoomAlertALL('机器人助理 无法通过DDP连接到服务器 '+host+':'+port);
            try{
                ddpClient.close()
            } catch(e){
            }
            try {
                callback('Error')
            } catch(e){
            }
            return
        }

        login(ddpClient,
            {  // Options below are the defaults
                env: 'METEOR_TOKEN',  // Name of an environment variable to check for a
                                      // token. If a token is found and is good,
                                      // authentication will require no user interaction.
                method: 'account',    // Login method: account, email, username or token
                account: 'monitor@163.com',        // Prompt for account info by default
                pass: 'qwezxc',           // Prompt for password by default
                retry: 1,             // Number of login attempts to make
                plaintext: false      // Do not fallback to plaintext password compatibility
                                      // for older non-bcrypt accounts
            },
            function (error, userInfo) {
                if (error) {
                    reportToWechatRoomAlertALL('机器人助理 登陆故事贴失败')
                    ddpClient.close()
                    try{
                        callback('Error')
                    } catch (e){

                    }
                    return
                } else {
                    // We are now logged in, with userInfo.token as our session auth token.
                    token = userInfo.token;
                    var timeDiff = new Date() - begin
                    reportToWechatRoom('机器人助理 成功登陆故事贴,耗时'+timeDiff+'ms')
                    // ddpClient.close()
                    try{
                        callback(null,'Success')
                    } catch (e){
                    }
                    return
                }
            }
        );
    });
}

function testSubscribeShowPost(callback){
    var begin = new Date()
    ddpClient.subscribe(
        'postInfoById',                  // name of Meteor Publish function to subscribe to 
        ['WrnSqg89a3r4nPwXr'],                       // any parameters used by the Publish function 
        function (error) {
            if (error) {
                reportToWechatRoomAlertALL('获取一篇帖子数据  失败！')
                reportToWechatRoomAlertALL(error)
                ddpClient.unsubscribe('WrnSqg89a3r4nPwXr')
                ddpClient.close()
                try{
                    callback('Error')
                } catch (e){

                }
                return
            } else {
                console.log('posts complete:');
                console.log(ddpClient.collections.posts);
                var timeDiff = new Date() - begin
                reportToWechatRoom('获取一篇帖子数据,  耗时'+timeDiff+'ms')
                ddpClient.unsubscribe('WrnSqg89a3r4nPwXr')
                ddpClient.close()
                try{
                    callback(null,'Success')
                } catch (e){
                }
                return
            }
        }
    );
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
            console.log(room)
        }
    }
    console.log(`Message: ${message}`)
})
wechatInstance.init()


taskList = [testLogin,testSubscribeShowPost]

var intervalTask = function(){
    async.series(taskList,testOpenShowPost)
}


setInterval(intervalTask, 1*60*1000)
