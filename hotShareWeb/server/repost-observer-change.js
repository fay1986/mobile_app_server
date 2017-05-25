var Fiber = Meteor.npmRequire('fibers');
var cluster = Meteor.npmRequire('cluster');

function deferSetImmediate(func) {
    var runFunction = function() {
            return func.apply(null);
    }
    if(typeof setImmediate == 'function') {
        setImmediate(function(){
            Fiber(runFunction).run();
        });
    } else {
        setTimeout(function(){
            Fiber(runFunction).run();
        }, 0);
    }
}

var sendMessageToWechatBot = function(id){
  deferSetImmediate(function(){
    var doc = RePosts.findOne({_id: id});
    if (!doc || doc.owner === 'ras6CfDNxX7mD6zq7' || doc.sendWechatBot === true)
      return;

    console.log('待审核的贴子：', doc.title);
    RePosts.update({_id: id}, {$set: {sendWechatBot: true}})
    sendMqttMessage('/wechat-bot/repost', doc);
  });
};

var handle = null;
var repostTimeout = function(){
  if (handle){
    try{handle.stop();}catch(e){}
    handle = null;
  }

  var time = new Date(new Date().getTime() - 1000*30);
  var cursor = RePosts.find({createdAt: {$lte: time}, owner: {$ne: 'ras6CfDNxX7mD6zq7'}});
  if (cursor.count() <= 0)
    return;

  deferSetImmediate(function(){
    var posts = cursor.fetch();
    var texts = [];

    if (posts.length <= 0)
      return;

    for(var i=0;i<posts.length;i++){
      texts.push({
        time: posts[i].createdAt.getHours() + ':' + posts[i].createdAt.getMinutes() + ':' + posts[i].createdAt.getSeconds(),
        title: posts[i].title
      });
    }
    console.log('待审核故事:', texts);
    sendMqttMessage('/wechat-bot/reposts', {
      texts: texts
    });
  });

  // handle = cursor.observeChanges({
  //   added: function(id, fields){
  //     sendMessageToWechatBot(id);
  //   },
  //   changed: function(id, fields){
  //     sendMessageToWechatBot(id);
  //   }
  // });
};

Meteor.startup(function(){
  if(process.env.PRODUCTION != true && process.env.NODE_ENV === 'production' && cluster.isMaster){
    var timeoutFun = null;
    RePosts.find({owner: {$ne: 'ras6CfDNxX7mD6zq7'}}).observeChanges({
      added: function(id, fields){
        repostTimeout();
        if (timeoutFun){Meteor.clearTimeout(timeoutFun);timeoutFun=null;}
        timeoutFun = Meteor.setTimeout(function(){
          repostTimeout();
        }, 1000*30+200);
      },
      changed: function(id, fields){
        repostTimeout();
      },
      removed: function(id){
        repostTimeout();
      }
    });
    console.log('listening repost...');
  }
});