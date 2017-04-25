var mqtt = require('mqtt')
var MongoClient = require('mongodb').MongoClient;

var serverUrl = 'http://host1.tiegushi.com/'
var MQTT_URL = process.env.MQTT_URL;
var DB_CONN = process.env.MONGO_URL;
// var DB_CONN = 'mongodb://workAIAdmin:weo23biHUI@aidb.tiegushi.com:27017/workai';
var db = null;
var debug_on = process.env.DEBUG_MESSAGE || false;
var allowGroupNotification = process.env.ALLOW_GROUP_NOTIFICATION || false;

var client  = mqtt.connect(MQTT_URL);
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
  client.unsubscribe('/#');
  client.subscribe('/#',{qos:1},function(err,granted){
        console.log('Granted is '+JSON.stringify(granted)) 
    });
});
 
client.on('message', function (topic, message) {
  // message is Buffer 
  debug_on && console.log(topic)
  var msgObj = JSON.parse(message.toString());
  debug_on && console.log(msgObj)
  // client.end()
  if(topic.match('/msg/g/')){
    if(msgObj.is_people){
    } else {
      sendGroupNotification(db,msgObj,'groupmessage');
    }
  } else if(allowGroupNotification && topic.match('/msg/u/')){
      sendNotification(db,msgObj, msgObj.to.id,'usermessage');
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
        var pushToken = {
          type: toUser.type,
          token: toUser.token
        };
        if(type == 'usermessage'){
          content = '新消息:' + message.text;
        }
        if(type === 'groupmessage'){
          '群消息:' + message.text;
        }
        var commentText = '';
        var extras = {
          type: type,
          messageId: message._id
        }
        var waitReadCount = (toUser.profile && toUser.profile.waitReadCount) ? toUser.profile.waitReadCount : 1;
        var tidyDoc = {
          _id: message._id,
          form: message.form,
          to: message.to,
          to_type: message.to_type,
          type: message.type,
          text: message.text,
          create_time: message.create_time
        };

        var dataObj = {
          formserver: encodeURIComponent(serverUrl),
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

function sendGroupNotification(db, message, type){
  
  var groupUsers = db.collection('simple_chat_groups_users');

  var groupId = message.to.id;
  groupUsers.find({group_id:  groupId}).toArray(function(err, docs) {
    if(err){
      return
    }

    docs.forEach(function(doc){
      sendNotification(db,message,docs.user_id,type)
    })
  }); 
};