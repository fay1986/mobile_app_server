if Meteor.isServer
  Meteor.startup ()->
    @JPush = Meteor.npmRequire "jpush-sdk"
    @client = @JPush.buildClient '50e8f00890be941f05784e6f', 'ec9940bbc7fcc646fc492ed8'
  @pushnotification = (type, doc, userId)->
    console.log "type:"+type
    if type is "palsofavourite"
      content = 'Someone also likes this story:\n《' + doc.title + '》'
      extras = {
        type: "palsofavourite"
        postId: doc._id
      }
      toUserId = userId
    else if type is "palsocomment"
      content = 'Someone also replies to this story:\n《' + doc.title + '》'
      extras = {
        type: "palsocomment"
        postId: doc._id
      }
      toUserId = userId
    else if type is "pcommentowner"
      content = 'Someone replies to your story:\n《' + doc.title + '》'
      extras = {
        type: "pcommentowner"
        postId: doc._id
      }
      toUserId = doc.owner
    else if type is "comment"
      post = Posts.findOne({_id: doc.postId});
      if post.owner == userId
        #console.log "comment self post"
        return
      commentText = doc.content;
      content = 'You receive a new reply:\n'+commentText
      extras = {
        type: "comment"
        postId: doc.postId
      }
      toUserId = post.owner
    else if type is "read"
      if doc.owner == userId
        #console.log "read self post"
        return
      content = 'Someone is readying your stroy:\n《' + doc.title + '》'
      extras = {
        type: "read"
        postId: doc._id
      }
      toUserId = doc.owner
    else if type is "recommand"
      content = doc.recommander + 'recommands you' + doc.ownerName + '\'s story.\n《' + doc.postTitle + '》'
      extras = {
        type: "recommand"
        postId: doc.postId
      }
      toUserId = doc.followby
    else if type is "getrequest"
      content = doc.requester + 'invites you to be a friend.'
      extras = {
        type: "getrequest"
        requesterId: doc.requesterId
      }
      toUserId = doc.followby
    else if type is "newpost"
      content = doc.ownerName + 'publishes a new story:\n《' + doc.title + '》'
      extras = {
        type: "newpost"
        postId: doc._id
      }
      toUserId = userId
    else
      post = Posts.findOne({_id: doc.postId});
      commentText = doc.content;
      content = 'The story you have activities on has a new reply:\n'+commentText
      extras = {
        type: "recomment"
        postId: doc.postId
      }
      if userId is null or userId is undefined
         return;
      toUserId = userId
    toUserToken = Meteor.users.findOne({_id: toUserId})

    unless toUserToken is undefined or toUserToken.type is undefined or toUserToken.token is undefined
    
      if type is "newpost"
        # push send logs
        removeTime = new Date((new Date()).getTime() - 1000*60*60*48) # 48 hour
        expireTime = new Date((new Date()).getTime() - 1000*60*10) # 10 minute
        
        PushSendLogs.remove({createAt: {$lt: removeTime}})
        if(PushSendLogs.find({
          type: toUserToken.type
          token: toUserToken.token
          message: content
          'extras.type': extras.type
          'extras.postId': extras.postId
          'extras.requesterId': extras.requesterId
          createAt: {$gte: expireTime}
        }).count() > 0)
          return
          
        pushReq = {
          toUserId: toUserId
          type: toUserToken.type
          token: toUserToken.token
          message: content
          extras: extras
          createAt: new Date()
        }
        PushSendLogs.insert pushReq
    
      pushToken = {type: toUserToken.type, token: toUserToken.token}
      #console.log "toUserToken.type:"+toUserToken.type+";toUserToken.token:"+toUserToken.token
      if pushToken.type is 'JPush'
        token = pushToken.token
        #console.log 'JPUSH to ' + pushToken.token
        client.push().setPlatform 'ios', 'android'
          .setAudience JPush.registration_id(token)
          .setNotification 'reply',JPush.ios(content,null,null,null,extras),JPush.android(content, null, 1,extras)
          #.setMessage(commentText)
          .setOptions null, 60
          .send (err, res)->
            #if err
            #  console.log err.message
            #else
            #  console.log 'Sendno: ' + res.sendno
            #  console.log 'Msg_id: ' + res.msg_id
      else if pushToken.type is 'iOS'
        #console.log 'Server PN to iOS '
        token = pushToken.token
        waitReadCount = Meteor.users.findOne({_id:toUserId}).profile.waitReadCount
        if waitReadCount is undefined or isNaN(waitReadCount)
            waitReadCount = 0
        pushServer.sendIOS 'me', token , '', content, waitReadCount
      else if pushToken.type is 'GCM'
        #console.log 'Server PN to GCM '
        token = pushToken.token
        pushServer.sendAndroid 'me', token , '',content, 1
