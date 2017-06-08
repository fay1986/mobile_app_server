if (Meteor.isServer) {
  function checkContains(array, e) {
    for(var i=0; i<array.length; i++){
      if (array[i] == e) return true;
    }
    return false;
  }

  Meteor.startup(function () {
    Meteor.methods({
      'bind_web_user': function (this_userId, userId, touserId, p, postId) {
        try {
          console.log('bind_web_user: userId=' + userId + ' touserId=' + touserId + ' p=' + p +' postId=' + postId + ' this.userId=' + this_userId)
          if ((!this_userId) || (!userId) || (!p) || (!postId)) {
              return {result: false, message: '无效的二维码！'};
          }

          var webUser = Meteor.users.findOne({_id: userId}, {fields:{profile:1}});
          var appUser = Meteor.users.findOne({_id: this_userId}, {fields:{profile:1}});
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
          var pre_webAssociated = (webUser.profile.usersAssociated) ? webUser.profile.usersAssociated : [];
          var pre_appAssociated = (appUser.profile.usersAssociated) ? appUser.profile.usersAssociated : [];
          var webAssociated = pre_webAssociated;
          var appAssociated = pre_appAssociated;

          if(!checkContains(pre_appAssociated, webUser._id)) {
            appAssociated = pre_appAssociated.concat(webUser._id);
            console.log(appAssociated)
            Meteor.users.update({_id: appUser._id}, {$set: {'profile.usersAssociated': appAssociated}});
          }

          if(!checkContains(pre_webAssociated, appUser._id)) {
            webAssociated = pre_webAssociated.concat(appUser._id);
            console.log(webAssociated)
            Meteor.users.update({_id: webUser._id}, {$set: {'profile.usersAssociated': webAssociated}});
          }

          if(msg && msg.qrcode && msg.messages) {
            for(var i=0; i<msg.messages.length; i++){
              var oneMsg = msg.messages[i];

              if (oneMsg && oneMsg.to) {
                if(oneMsg.to.id != webUser._id)
                  continue;

                for(var j=0; j<webAssociated.length; j++){
                  var sendToUser = Meteor.users.findOne({_id: webAssociated[j]}, {fields:{profile:1}});
                  if(sendToUser && sendToUser.profile && sendToUser.profile.fullname && sendToUser.profile.icon) {
                    oneMsg.to.id =   sendToUser._id;
                    oneMsg.to.name = sendToUser.profile.fullname;
                    oneMsg.to.icon = sendToUser.profile.icon;
                    //console.log('>> send message: ' + JSON.stringify(oneMsg))
                    sendMqttUserMessage(sendToUser._id, oneMsg);
                  }
                }
              }
            }
          }

          if(msg && msg._id)
            WebWaitReadMsg.remove({_id: webUser._id});

          return {result: true};

        } catch (error) {
          console.log('addTopicsAtReview ERR=', error)
          return {result: true};
        }
      }
    });
  })
}
