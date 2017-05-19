var async = require('async');
var assert = require('assert');
var savePostUser = require('./import-user-post-info');
var saveFollow = require('./import-follow');
var save_viewer_node = require('./import-viewer-info').save_viewer_node;
var MongoOplog = require('mongo-oplog');
var mongodb = require('mongodb');
var mqtt    = require('mqtt');
//var restify = require('restify');

var conn = {
  mongo: process.env.MONGO_URL,
  oplog: process.env.MONGO_OPLOG,

  mongo_opts: {
    db: {
      native_parser: true,
      readPreference: 'secondaryPreferred'
    },
    server : {
      reconnectTries : 3000,
      reconnectInterval: 5000,
      autoReconnect : true ,
      socketOptions: {
        connectTimeoutMS: 10000
      }
    }
  },
  oplog_opts_v: { ns: 'hotShare.viewers' , server : { reconnectTries : 3000, reconnectInterval: 5000, autoReconnect : true }},
  oplog_opts_p: { ns: 'hotShare.posts'   , server : { reconnectTries : 3000, reconnectInterval: 5000, autoReconnect : true }},
  oplog_opts_u: { ns: 'hotShare.users'   , server : { reconnectTries : 3000, reconnectInterval: 5000, autoReconnect : true }},
  oplog_opts_f: { ns: 'hotShare.follower', server : { reconnectTries : 3000, reconnectInterval: 5000, autoReconnect : true }}
};
var MongoClient = mongodb.MongoClient;
var db = null;
var oplog_v = null;
var oplog_p = null;
var oplog_u = null;
var oplog_f = null;

process.addListener('uncaughtException', function (err) {
    var msg = err.message;
    if (err.stack) {
        msg += '\n' + err.stack;
    }
    if (!msg) {
        msg = JSON.stringify(err);
    }
    console.log(msg);
    console.trace();
});

MongoClient.connect(conn.mongo, conn.mongo_opts, function(err, tdb) {
    assert.equal(null, err);
    db=tdb
    console.log('db connected!')

    db.on('timeout',     function(){console.log('MongoClient.connect timeout')});
    db.on('error',       function(){console.log('MongoClient.connect error')});
    db.on('close',       function(){console.log('MongoClient.connect close')});
    db.on('reconnect',   function(){
        console.log('MongoClient.connect reconnect')
        //oplog_connect();
    });

    //oplog_connect();
});

function oplog_connect() {
  if(oplog_v) {
      oplog_v.destroy(function(){
          console.log('oplog_v destroyed');
          oplog_v = null;
      })
  }
  if(oplog_p) {
      oplog_p.destroy(function(){
          console.log('oplog_p destroyed');
          oplog_p = null;
      })
  }
  if(oplog_u) {
      oplog_u.destroy(function(){
          console.log('oplog_u destroyed');
          oplog_u = null;
      })
  }
  if(oplog_f) {
    oplog_f.destroy(function(){
      console.log('oplog_f destroyed');
      oplog_f = null;
    })
  }

  oplog_v = MongoOplog(conn.oplog, conn.oplog_opts_v);
  oplog_v.tail();
  oplog_v.on('op', function (data) {
    get_doc(data, function (ns, postDoc, userDoc, viewerDoc, followDoc) {
      sync_to_neo4j(ns, postDoc, userDoc, viewerDoc, followDoc);
    })
  });
  oplog_v.on('error', function (error) {
    console.log('>>> error: ' + error);
  });
  oplog_v.on('end', function () {
    console.log('>>> end: Stream ended');
  });
  oplog_v.on('stop', function () {
    console.log('>>> stop: server stopped');
  });

  oplog_p = MongoOplog(conn.oplog, conn.oplog_opts_p);
  oplog_p.tail();
  oplog_p.on('op', function (data) {
    get_doc(data, function (ns, postDoc, userDoc, viewerDoc, followDoc) {
      sync_to_neo4j(ns, postDoc, userDoc, viewerDoc, followDoc);
    })
  });
  oplog_p.on('delete', function (doc) {
    on_post_remove(doc);
  });
  oplog_p.on('error', function (error) {
    console.log('>>> error: ' + error);
  });
  oplog_p.on('end', function () {
    console.log('>>> end: Stream ended');
  });
  oplog_p.on('stop', function () {
    console.log('>>> stop: server stopped');
  });

  oplog_u = MongoOplog(conn.oplog, conn.oplog_opts_u);
  oplog_u.tail();
  oplog_u.on('op', function (data) {
    get_doc(data, function (ns, postDoc, userDoc, viewerDoc, followDoc) {
      sync_to_neo4j(ns, postDoc, userDoc, viewerDoc, followDoc);
    })
  });
  oplog_u.on('error', function (error) {
    console.log('>>> error: ' + error);
  });
  oplog_u.on('end', function () {
    console.log('>>> end: Stream ended');
  });
  oplog_u.on('stop', function () {
    console.log('>>> stop: server stopped');
  });

  oplog_f = MongoOplog(conn.oplog, conn.oplog_opts_f);
  oplog_f.tail();
  oplog_f.on('op', function (data) {
    get_doc(data, function (ns, postDoc, userDoc, viewerDoc, followDoc) {
      sync_to_neo4j(ns, postDoc, userDoc, viewerDoc, followDoc);
    })
  });
  oplog_f.on('error', function (error) {
    console.log('>>> error: ' + error);
  });
  oplog_f.on('end', function () {
    console.log('>>> end: Stream ended');
  });
  oplog_f.on('stop', function () {
    console.log('>>> stop: server stopped');
  });
}

function on_post_remove(doc){
  var postId = doc.o._id;
  console.log('on_post_remove:', doc);
  console.log('on_post_remove[postId]:', postId);
  savePostUser.remove_post(postId);
}

function get_doc(doc, cb) {
  var postDoc = null;
  var userDoc = null;
  var viewerDoc = null;
  var followDoc = null;

  if(doc.op === 'i') {
    if(doc.ns === conn.oplog_opts_v.ns && (!!doc.o))
      viewerDoc = doc.o
    else if(doc.ns === conn.oplog_opts_u.ns && (!!doc.o))
      userDoc = doc.o
    else if(doc.ns === conn.oplog_opts_p.ns && (!!doc.o))
      postDoc = doc.o
    else if(doc.ns === conn.oplog_opts_f.ns && (!!doc.o))
      followDoc = doc.o
    else
      console.log('!!! unknow insert op: ' + JSON.stringify(doc))

    return cb && cb(doc.ns, postDoc, userDoc, viewerDoc, followDoc);
  }
  else if(doc.op === 'u') {
    if(doc.ns === conn.oplog_opts_v.ns && (!!doc.o2) && doc.o2._id) {
      get_doc_byId(doc.ns, doc.o2._id, function(ns, result) {
        if(result)
          viewerDoc = result
        return cb && cb(doc.ns, postDoc, userDoc, viewerDoc, followDoc);
      })
    }
    else
      return cb && cb(doc.ns, postDoc, userDoc, viewerDoc, followDoc);
  }
  else if(doc.op === 'd') {
    if(doc.ns === conn.oplog_opts_f.ns && (!!doc.o) && doc.o._id) {
        followDoc = {drop: true, _id: doc.o._id}
        return cb && cb(doc.ns, postDoc, userDoc, viewerDoc, followDoc);
    }
    else
      return cb && cb(doc.ns, postDoc, userDoc, viewerDoc, followDoc);
  }
  else
    return cb && cb(doc.ns, postDoc, userDoc, viewerDoc, followDoc);
}

function get_doc_byId(ns, id, cb) {
  if(!(!!ns && !!id)) {
    return cb(null, null);
  }

  if(ns === conn.oplog_opts_v.ns) {
    db.collection('viewers').findOne({_id:id},{fields:{
      postId: true,
      userId: true
    }},function(err, viewer) {
        if(err || (!viewer))
          return cb(null, null)
        else
          return cb(ns, viewer)
    });
  }
  else if(ns === conn.oplog_opts_u.ns) {
    db.collection('users').findOne({_id:id},{fields:{
      username: true,
      createdAt:true,
      'profile.fullname': true,
      type: true,
      'profile.sex':true,
      'profile.lastLogonIP':true,
      'profile.anonymous':true,
      'profile.browser':true,
      'profile.location':true
    }},function(err, user) {
        if(err || (!user))
          return cb(null, null)
        else
          return cb(ns, user)
    });
  }
  else if(ns === conn.oplog_opts_p.ns) {
    db.collection('posts').findOne({_id:id},{fields:{
      browse:true,
      title:true,
      addontitle:true,
      owner:true,
      _id:true,
      ownerName:true,
      createdAt:true,
      mainImage:true
    }},function(err, post) {
        if(err || (!post))
          return cb(null, null)
        else
          return cb(ns, post)
    });
  }
  else
    return cb(null, null);
}

function sync_to_neo4j(ns, postDoc, userDoc, viewerDoc, followDoc) {
  if(ns === conn.oplog_opts_v.ns && (!!viewerDoc)) {
    if (!viewerDoc.createdAt)
      viewerDoc.createdAt = new Date();

    save_viewer_node(viewerDoc, function(err){
      if(err === null)
        console.log('postview saved: pid=' + viewerDoc.postId + ' uid=' + viewerDoc.userId)
      else
        resave_viewer_node(viewerDoc)
    })
  }
  else if(ns === conn.oplog_opts_u.ns && (!!userDoc)) {
    savePostUser.save_user_node(userDoc,function(err){
      if(err === null)
        console.log('User Info saved: uid=' + userDoc._id)
      else
        console.log('User Info saved: error:' + err)
    })
  }
  else if(ns === conn.oplog_opts_p.ns && (!!postDoc)) {
    savePostUser.save_post_node(postDoc,function(err){
      if(err === null)
        console.log('Post Info saved: pid=' + postDoc._id)
      else
        console.log('Post Info saved: error:' + err)
    })
  }
  else if(ns === conn.oplog_opts_f.ns && (!!followDoc)) {
    if(!followDoc.drop) {
      saveFollow.save_follow_relationship(followDoc,function(err){
        if(err === null)
          console.log('Follow saved: fid=' + followDoc._id)
        else
          console.log('Follow Info saved: error:' + err)
      })
    }
    else {
      saveFollow.remove_follow_relationship(followDoc, function(err){
        if(err === null)
          console.log('Follow removed fid=' + followDoc._id)
        else
          console.log('Follow Info removed: error:' + err)
      });
    }

  }
}

function resave_viewer_node(viewerDoc) {
  var postId = null
  var userId = null
  var postDoc = null
  var userDoc = null
  if((!!viewerDoc) && viewerDoc.postId && viewerDoc.userId) {
    postId = viewerDoc.postId
    userId = viewerDoc.userId

    get_doc_byId(conn.oplog_opts_p.ns, postId, function(ns, result1) {
      if(result1) {
        postDoc = result1
        get_doc_byId(conn.oplog_opts_u.ns, userId, function(ns, result2) {
          if(result2) {
            userDoc = result2
            savePostUser.save_user_node(userDoc,function(){
              savePostUser.save_post_node(postDoc,function(){
                save_viewer_node(viewerDoc, function(err){
                  if(err === null)
                    console.log('postview resaved: pid=' + viewerDoc.postId + ' uid=' + viewerDoc.userId)
                  else
                    console.log('postview Info resaved: error:' + err)
                })
              })
            })
          }
        })
      }
    })
  }
}
var mqttOptions = {
  keepalive:30,
  reconnectPeriod:20*1000
}

var client  = mqtt.connect('ws://tmq.tiegushi.com:80',mqttOptions);

function new_usernode(doc, cb){
  db.collection('users').findOne({_id:doc.userId},{fields:{
    username: true,
    createdAt:true,
    'profile.fullname': true,
    type: true,
    'profile.sex':true,
    'profile.lastLogonIP':true,
    'profile.anonymous':true,
    'profile.browser':true,
    'profile.location':true
  }},function(err, user) {
    if(err || (!user)) {
      return cb(err)
    }
    else {
      savePostUser.save_user_node(user,function(){
        console.log('User Info saved')
        return cb(null);
      })
    }
  });
}

function new_postnode(doc, cb){
  db.collection('posts').findOne({_id:doc.postId},{fields:{
    browse:true,
    title:true,
    addontitle:true,
    owner:true,
    _id:true,
    ownerName:true,
    createdAt:true,
    mainImage:true
  }},function(err, post) {
    if(err || (!post)) {
      return cb(err)
    }
    else {
      savePostUser.save_post_node(post,function(){
        console.log('Post Info saved')
        return cb(null);
      })
    }
  });
}
var reportSyncInfo;
initReportSyncInfo();
function initReportSyncInfo(){
  reportSyncInfo = {
    succ : 0,
    postView : 0,
    newUser : 0,
    publishPost : 0,
    unpublishPost : 0,
    follow : 0,
    unfollow : 0
  }
}

function reportStatusInterval(){
  var report = {
    service: process.env.SERVICE_NAME ? process.env.SERVICE_NAME:'mqttSyncToNeo4j',
    production: process.env.PRODUCTION ? true:false,
    serviceIndex: process.env.SERVICE_INDEX ? process.env.SERVICE_INDEX:0, //index 0 for production
    succ: reportSyncInfo.succ,
    detail:reportSyncInfo
  }
  client.publish('status/service',JSON.stringify(report))
  initReportSyncInfo();
}

setInterval(reportStatusInterval,30*1000)

client.on('connect' ,function () {
  console.log('Connected to server')
  client.subscribe('postView',{qos:1});
  client.subscribe('publishPost',{qos:1});
  client.subscribe('newUser',{qos:1});

  client.on('message', function (topic, message) {
    // message is Buffer
    console.log(topic+': '+message.toString());
    var json = JSON.parse(message)
    if(topic === 'postView'){
      if (!json.userId || !json.postId){
        return
      }
      if (json.postId.indexOf('?')>0){
        json.postId = json.postId.split('?')[0];
      }
      if (!json.createdAt){
        json.createdAt = new Date();
      }
      console.log('To save postview: '+JSON.stringify(json));
      save_viewer_node(json,function(error){
        if(!error){
          reportSyncInfo.succ++;
          reportSyncInfo.postView++;
        }
      })
    } else if(topic === 'newUser'){
      db.collection('users').findOne({_id:json.userId},{fields:{
        username: true,
        createdAt:true,
        'profile.fullname': true,
        type: true,
        'profile.sex':true,
        'profile.lastLogonIP':true,
        'profile.anonymous':true,
        'profile.browser':true,
        'profile.location':true
      }},function(err, user) {
        savePostUser.save_user_node(user,function(error){
          if(!error){
            console.log('User Info saved')
            reportSyncInfo.succ++;
            reportSyncInfo.newUser++;
          }
        })
      });
    } else if(topic === 'publishPost'){
      db.collection('posts').findOne({_id:json.postId},{fields:{
        browse:true,
        title:true,
        addontitle:true,
        owner:true,
        _id:true,
        ownerName:true,
        createdAt:true,
        mainImage:true
      }},function(err, post) {
        savePostUser.save_post_node(post,function(error){
          if(!error){
            console.log('publishPost Info saved')
            reportSyncInfo.succ++;
            reportSyncInfo.publishPost++;
          }
        })
      });
    }
  });
});
