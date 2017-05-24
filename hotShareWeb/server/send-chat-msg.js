var Fiber = Meteor.npmRequire('fibers');
var mqttMessages = new Meteor.Collection('mqttMessages');
var mqttPosts = new Meteor.Collection('mqttPosts');

Meteor.startup(function(){
  if (!Date.prototype.format){
    Date.prototype.format = function(format) {
      var o = {
          "M+": this.getMonth() + 1,  //month
          "d+": this.getDate(),     //day
          "h+": this.getHours(),    //hour
          "m+": this.getMinutes(),  //minute
          "s+": this.getSeconds(), //second
          "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
          "S": this.getMilliseconds() //millisecond
      };
      if (/(y+)/.test(format)) {
          format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      }
      for (var k in o) {
          if (new RegExp("(" + k + ")").test(format)) {
              format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
          }
      }
      return format;
    };
  }
  var fromUser = Meteor.users.findOne({_id: 'zR2Y5Ar9k9LZQS9vS'}); // 故事贴小秘 -> tiegushi
  var deferSetImmediate = function(func) {
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
  var formatPub = function(pub){
    for(var i=0;i<pub.length;i++){
      if(!pub[i]._id){pub[i]._id = new Mongo.ObjectID()._str;}
      if(pub[i].type === 'image'){
        pub[i].isImage = true;
        pub[i].data_sizey = 3;
      }else{
        pub[i].data_sizey = 1;
      }
      pub[i].data_row = 1;
      pub[i].data_col = 1;
      pub[i].data_sizex = 6;
    }

    // format
    for(var i=0;i<pub.length;i++){
      pub[i].index = i;
      pub[i].data_col = parseInt(pub[i].data_col);
      pub[i].data_row = parseInt(pub[i].data_row);
      pub[i].data_sizex = parseInt(pub[i].data_sizex);
      pub[i].data_sizey = parseInt(pub[i].data_sizey);
      pub[i].data_wait_init = true;
      pub[i].originImgUrl = pub[i].imageUrl;
      pub[i].imgUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
      if (i > 0) {
        pub[i].data_row = pub[i-1].data_row + pub[i-1].data_sizey;
      }
    }

    return pub;
  };
  var insertNewMsg = function(pub, doc){
    switch(doc.type){
      case 'text':
        pub.splice(0, 0, {
          "_id": new Mongo.ObjectID()._str,
            "type": "text",
            "isImage": false,
            "owner": fromUser._id,
            "text": doc.form.name.trim() + ": " + (doc.create_time || new Date()).format('yyyy-MM-dd hh:mm') + "\r\n" + doc.text,
            "style": "",
            "layout": {"font": "quota"},
            "data_row": 1,
            "data_col": 1,
            "data_sizex": 6,
            "data_sizey": 3
        });
        break;
      case 'image':
        // pub.splice(0, 0, {
        //   "_id": new Mongo.ObjectID()._str,
        //     "type": "image",
        //     "isImage": false,
        //     "owner": fromUser._id,
        //     "text": doc.form.name + ":" + doc.create_time + "\r\n[图片]",
        //     "style": "",
        //     "data_row": 1,
        //     "data_col": 1,
        //     "data_sizex": 6,
        //     "data_sizey": 3
        // });
        pub.splice(0, 0, {
          "_id": new Mongo.ObjectID()._str,
            "type": "text",
            "isImage": false,
            "owner": fromUser._id,
            "text": doc.form.name.trim() + ":" + doc.create_time + "\r\n[图片]",
            "style": "",
            "layout": {"font": "quota"},
            "data_row": 1,
            "data_col": 1,
            "data_sizex": 6,
            "data_sizey": 3
        });
        break;
    }
  };
  var findAndCreatePost = function(userId, doc){
    var post = mqttPosts.findOne({owner: fromUser._id, toUserId: userId});
    if (!post){
      post = {
        "pub": [
          {
            "_id": new Mongo.ObjectID()._str,
            "type": "text",
            "isImage": false,
            "owner": fromUser._id,
            "text": "<a href=\"http://a.app.qq.com/o/simple.jsp?pkgname=org.hotshare.everywhere\" target=\"_blank\" class=\"_post_item_a\">点击此行更新最新版本，随时私信聊天，轻松互动~</a>",
            "hyperlinkText": "点击此行更新最新版本，随时私信聊天，轻松互动~",
            "isHyperlink": true,
            "layout": {"align": "center"},
            "style": "",
            "data_row": 1,
            "data_col": 1,
            "data_sizex": 6,
            "data_sizey": 3
          }
        ],
        "_id": new Mongo.ObjectID()._str,
        "title": "您有新的私信消息（1条）",
        "addontitle": "下载新版本可互动",
        "browse": 0,
        "heart": [],
        "retweet": [],
        "comment": [],
        "commentsCount": 0,
        "mainImage": "http://data.tiegushi.com/Ju3gGj3Xb4CFyrihY_1495617098946_cdv_photo_002.jpg",
        "publish": true,
        "owner": fromUser._id,
        "ownerName": fromUser.profile && fromUser.profile.fullname ? fromUser.profile.fullname : fromUser.username,
        "ownerIcon": fromUser.profile && fromUser.profile.icon ? fromUser.profile.icon : '/userPicture.png',
        "createdAt": new Date(),
        "isReview": true,
        "insertHook": true,
        "import_status": "done",
        "fromUrl": "",
        "toUserId": userId,
        "message_count": 0
      }
      insertNewMsg(post.pub, doc);
      formatPub(post.pub);
      post.message_count = parseInt(post.message_count || 0) + 1;
      post.title = '您有新的私信消息（'+post.message_count+'条）';
      mqttPosts.insert(post);
      Posts.insert(post);
    } else {
      insertNewMsg(post.pub, doc);
      formatPub(post.pub);
      post.message_count = parseInt(post.message_count || 0) + 1;
      post.title = '您有新的私信消息（'+post.message_count+'条）';
      mqttPosts.update({_id: post._id}, {$set: {pub: post.pub}});
      Posts.update({_id: post._id}, {$set: {pub: post.pub, message_count: post.message_count, title: post.title}});
    }

    return post;
  };
  var createOrUpdateFollowPosts = function(userId, post){
    var followPost = FollowPosts.findOne({owner: fromUser._id, followby: userId});
    if (!followPost){
      followPost = {
        _id: new Mongo.ObjectID()._str,
        postId:post._id,
        title:post.title,
        addontitle:post.addontitle,
        mainImage: post.mainImage,
        mainImageStyle:post.mainImageStyle,
        heart:0,
        retweet:0,
        comment:0,
        browse: 0,
        publish: post.publish,
        owner:post.owner,
        ownerName:post.ownerName,
        ownerIcon:post.ownerIcon,
        createdAt: new Date(),
        followby: userId
      };
      followPost.title = post.addontitle;
      followPost.addontitle = post.addontitle;
      FollowPosts.insert(followPost);
    } else {
      followPost.title = post.addontitle;
      followPost.addontitle = post.addontitle;
      FollowPosts.update({_id: followPost._id}, {$set: {createdAt: new Date(), title: post.title}});
    }

    return followPost;
  };
  var publishPostToUser = function(id, doc){
    deferSetImmediate(function(){
      var post = findAndCreatePost(doc.to.id, doc);
      createOrUpdateFollowPosts(doc.to.id, post);
      mqttMessages.remove({_id: id});
    });
  };
  mqttMessages.find({}).observeChanges({
    added: function(id, fields){
      publishPostToUser(id, fields);
      console.log('send mqtt msg to:', fields.to.id);
    }
  });
});