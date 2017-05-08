var mqtt = require('mqtt')
var MongoClient = require('mongodb').MongoClient;
var redisClient = require('./lib/redis.js')

var serverUrl = process.env.SERVER_URL || 'http://host1.tiegushi.com/';
var MQTT_URL = process.env.MQTT_URL;
var DB_CONN = process.env.MONGO_URL;
// var DB_CONN = 'mongodb://workAIAdmin:weo23biHUI@aidb.tiegushi.com:27017/workai';
var db = null;
var debug_on = process.env.DEBUG_MESSAGE || false;
var allowGroupNotification = process.env.ALLOW_GROUP_NOTIFICATION || false;
var projectName = process.env.PROJECT_NAME || null; // '故事贴：t , 点圈： d'
var client  = mqtt.connect(MQTT_URL);

var Array = require('node-array');

redisClient.redisClientInit();

MongoClient.connect(DB_CONN, {poolSize:20 , reconnectTries: Infinity}, function(err, mongodb){
  if (err) {
    console.log('Mongo connect Error:' + err);
  }
  console.log('Mongo connect');
  db = mongodb;
  db.on('timeout',     function(){console.log('MongoClient.connect timeout')});
  db.on('error',       function(){console.log('MongoClient.connect error')});
  db.on('close',       function(){console.log('MongoClient.connect close')});
  db.on('reconnect',   function(){
      console.log('MongoClient.connect reconnect')
  });
});

client.on('connect', function () {
  console.log('mqtt connected')
  var subscribeTopic = '/msg/#';
  if(projectName){
    subscribeTopic = '/'+projectName+'/msg/#';
  }
  client.unsubscribe(subscribeTopic);
  client.subscribe(subscribeTopic,{qos:1},function(err,granted){
    console.log('Granted is '+JSON.stringify(granted))
  });
});

client.on('message', function (topic, message) {
  // message is Buffer
  debug_on && console.log(topic)
  var msgObj = JSON.parse(message.toString());
  debug_on && console.log(msgObj)
  // client.end()
  if(allowGroupNotification && topic.match('/msg/g/')){
    if(msgObj.is_people){
    } else {
       //if(msgObj.to.id === '953386e352c1ae0e95a24b8a')
       sendGroupNotification(db,msgObj,'groupmessage');
    }
  }
  if(topic.match('/msg/u/')){
      // sendNotification(db,msgObj, msgObj.to.id,'usermessage');
      sendUserNotification(db, msgObj, 'usermessage');
  }
});

client.on('disconnect', function (topic, message) {
    console.log('disconnected')
});

function sendNotification(db,message, toUserId ,type) {
  var toUserId = toUserId;
  var userId = message.form.id;

  var users = db.collection('users');
  var pushTokens = db.collection('pushTokens');
  var PushMessages = db.collection('pushmessages');

  users.findOne({ _id: toUserId }, function (err, toUser) {
    if (err) {
      console.log('Error:'+err)
      return
    }
    if (toUser && toUser.type && toUser.token) {
      pushTokens.findOne({ type: toUser.type, token: toUser.token }, function (err, pushTokenObj) {
        if (err) {
          console.log('Error:' + err);
          return
        }
        if (!pushTokenObj || pushTokenObj.userId !== toUser._id) {
          return
        }
        var content = '';
        var msgText = '';
        var pushToken = {
          type: toUser.type,
          token: toUser.token
        };
        if(message.type === 'image'){
          msgText = '[图片]';
        } else {
          msgText = message.text;
        }
        if(type == 'usermessage'){
            content = message.form.name+ ':' + msgText;
        }
        if(type === 'groupmessage'){
          content = message.to.name+ ':' + msgText;
        }
        var commentText = '';
        var extras = {
          type: type,
          messageId: message._id
        }
        var waitReadCount = (toUser.profile && toUser.profile.waitReadCount) ? toUser.profile.waitReadCount : 1;
        var tidyDoc = {
          _id: message._id,
          form: message.form.id,
          to: message.to.id,
          to_type: message.to_type,
          type: message.type,
          text: message.text,
          create_time: message.create_time
        };

        var dataObj = {
          fromserver: encodeURIComponent(serverUrl),
          eventType: type,
          doc: tidyDoc,
          userId: userId,
          content: content,
          extras: extras,
          toUserId: toUserId,
          pushToken: pushToken,
          waitReadCount: waitReadCount
        }
        var dataArray = [];
        dataArray.push(dataObj);
        debug_on && console.log(JSON.stringify(dataArray))
        PushMessages.insert({pushMessage: dataArray, createAt: new Date()},function(err,result){
          if(err){
            console.log('Error:'+err);
          } else {
            debug_on && console.log(result)
          }
        })
      });
    }
  });
}

function sendUserNotification(db, message, type){
  var BlackList = db.collection('blackList');
  var toUserId  = message.to.id;
  var userId    = message.form.id;
  BlackList.findOne({blackBy: toUserId,blacker:{$in:[userId]}},function(err, result){
    if (err){
      debug_on && console.log('mongo blackList Error:',err);
      return
    }

    if (result) {
      debug_on && console.log('在对方黑名单中， userId='+ userId +' ,toUserId='+ toUserId);
      return
    }
    sendNotification(db, message, toUserId, type);
  });
};

function sendGroupNotification(db, message, type){

  var groupUsers = db.collection('simple_chat_groups_users');

  var groupId = message.to.id;
  groupUsers.find({group_id:  groupId}).toArray(function(err, docs) {
    if(err){
      return
    }

    docs.forEachAsync(function(doc,index, arr,next){
      if(message.form.id === doc.user_id) {
          next();
      }
      else {
          var keystring = groupId + '_' + doc.user_id;
          redisClient.redisUpdateKey(keystring, function(ttl) {
              console.log('>>> main.js ttl='+ttl)
              if(ttl > 1)
                  next();
              else {
                  // continue after 100ms
                  setTimeout(function() {
                      sendNotification(db,message,doc.user_id,type)
                      next();
                  }, 100);
              }
          });
      }
      return true;
    },function(){
      debug_on && console.log('send GroupNotification complete, messageForm:',JSON.stringify(message.form));
    })
  });
};
