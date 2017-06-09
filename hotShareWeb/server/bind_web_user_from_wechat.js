if (Meteor.isServer) {
  function checkContains(array, e) {
    return _.pluck(array, 'id').indexOf(e) >= 0;
    // for(var i=0; i<array.length; i++){
    //   if (array[i] == e) return true;
    // }
    // return false;
  }

  Meteor.startup(function () {
    Meteor.methods({
      'bind_web_user': function (this_userId, userId, touserId, p, postId) {
        try {
          console.log('bind_web_user: userId=' + userId + ' touserId=' + touserId + ' p=' + p +' postId=' + postId + ' this.userId=' + this_userId)
          if ((!this_userId) || (!userId) || (!p) || (!postId)) {
              return {result: false, message: '无效的二维码！'};
          }

          var webUser = Meteor.users.findOne({_id: userId}, {fields:{profile:1, username: 1}});
          var appUser = Meteor.users.findOne({_id: this_userId}, {fields:{profile:1, username: 1}});
          //console.log('webUser=' + JSON.stringify(webUser))
          //console.log('appUser=' + JSON.stringify(appUser))
          if(!(webUser && webUser.profile && appUser && appUser.profile)) {
              console.log('webUser or appUser not found')
              return {result: false, message: '无效的二维码！'};
          }

          //clone message to associated appuser
          var msg = WebWaitReadMsg.findOne({_id: webUser._id});
          if(!msg)
            return {result: false, message: '此二维码已经绑定过了！'};

          //check relationship
          var pre_webAssociated = (webUser.profile.associated) ? webUser.profile.associated : [];
          var pre_appAssociated = (appUser.profile.associated) ? appUser.profile.associated : [];
          var webAssociated = pre_webAssociated;
          var appAssociated = pre_appAssociated;
          var alreadyAssociated = false;

          if(!checkContains(pre_appAssociated, webUser._id)) {
            // appAssociated = pre_appAssociated.concat(webUser._id);
            appAssociated = pre_appAssociated.concat({
              id: webUser._id,
              name: webUser.profile && webUser.profile.fullname ? webUser.profile.fullname : webUser.username,
              icon: webUser.profile && webUser.profile.icon ? webUser.profile.icon : '/userPicture.png'
            });
            console.log(appAssociated)
            Meteor.users.update({_id: appUser._id}, {$set: {'profile.associated': appAssociated}});
          }

          if(!checkContains(pre_webAssociated, appUser._id)) {
            // webAssociated = pre_webAssociated.concat(appUser._id);
            webAssociated = pre_webAssociated.concat({
              id: appUser._id,
              name: appUser.profile && appUser.profile.fullname ? appUser.profile.fullname : appUser.username,
              icon: appUser.profile && appUser.profile.icon ? appUser.profile.icon : '/userPicture.png'
            });
            console.log(webAssociated)
            Meteor.users.update({_id: webUser._id}, {$set: {'profile.associated': webAssociated}});
          }
          else {
            console.log('appUser: ' + this_userId + ' webUser: ' + webUser._id + ' already associated !')
            alreadyAssociated = true;
          }

          if((!alreadyAssociated) && msg && msg.qrcode && msg.messages) {
            for(var i=0; i<msg.messages.length; i++){
              var oneMsg = msg.messages[i];

              if (oneMsg && oneMsg.to && (!oneMsg.ttl)) {
                if(oneMsg.to.id != webUser._id)
                  continue;

                for(var j=0; j<webAssociated.length; j++){
                  var sendToUser = webAssociated[j];
                  if(sendToUser && sendToUser.name && sendToUser.icon) {
                    oneMsg.to.id =   sendToUser.id;
                    oneMsg.to.name = sendToUser.name;
                    oneMsg.to.icon = sendToUser.icon;
                    oneMsg.ttl = 1;
                    //console.log('>> send message: ' + JSON.stringify(oneMsg))
                    sendMqttUserMessage(sendToUser.id, oneMsg);
                  }
                }
              }
            }
          }

          if(msg && msg._id)
            WebWaitReadMsg.remove({_id: webUser._id});

          if(alreadyAssociated)
            return {result: false, message: '已经绑定过该用户！'};

          return {result: true, msg: msg.messages || []};

        } catch (error) {
          console.log('addTopicsAtReview ERR=', error)
          return {result: false, message: '绑定失败！'};
        }
      }
    });
  })
}
