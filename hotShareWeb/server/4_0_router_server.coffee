if Meteor.isServer
  subs = new SubsManager({
    #maximum number of cache subscriptions
    cacheLimit: 999,
    # any subscription will be expire after 30 days, if it's not subscribed again
    expireIn: 60*24*30
  });
  countA = 0

  request = Meteor.npmRequire('request')
  Fiber = Meteor.npmRequire('fibers')
  QRImage = Meteor.npmRequire('qr-image')

  ###
  Router.route '/posts/:_id', {
      waitOn: ->
          [subs.subscribe("publicPosts",this.params._id),
           subs.subscribe "pcomments"]
      fastRender: true
    }
  ###
  injectSignData = (req,res)->
    try
      console.log(req.url)
      if req.url
        signature=generateSignature('http://'+server_domain_name+req.url)
        if signature
          console.log(signature)
          InjectData.pushData(res, "wechatsign",  signature);
    catch error
      return null
  Router.configure {
    waitOn: ()->
      if this and this.path
        path=this.path
        if path.indexOf('/posts/') is 0
          if path.indexOf('?') > 0
            path = path.split('?')[0]
          params=path.replace('/posts/','')
          params=params.split('/')
          if params.length > 0
            return [subs.subscribe("publicPosts",params[0]),
                    subs.subscribe("postsAuthor",params[0]),
                    subs.subscribe "pcomments"]
    fastRender: true
  }

  #SSR.compileTemplate('post', Assets.getText('template/post.html'))
  Router.route '/posts/:_id', (req, res, next)->
    _post = Posts.findOne({_id: this.params._id},{fields:{title:1,mainImage:1,addontitle:1,isReview:1}})

    if !_post
      res.writeHead(404, {
        'Content-Type': 'text/html'
      })
      return res.end(Assets.getText('page-not-found.html'))

    if _post and _post.isReview is false
      res.writeHead(404, {
        'Content-Type': 'text/html'
      })
      return res.end(Assets.getText('post-no-review.html'))
    ###
    BOTS = [
      'googlebot',
      'baiduspider',
      '360Spider',
      'sosospider',
      'sogou spider',
      'facebookexternalhit',
      'twitterbot',
      'rogerbot',
      'linkedinbot',
      'embedly',
      'bufferbot',
      'quora link preview',
      'showyoubot',
      'outbrain',
      'pinterest',
      'developers.google.com/+/web/snippet',
      'slackbot'
    ]
    agentPattern = new RegExp(BOTS.join('|'), 'i')
    userAgent = req.headers['user-agent']
    if agentPattern.test(userAgent)
      console.log('user Agent: '+userAgent);
      postItem = Posts.findOne({_id: this.params._id})
      postHtml = SSR.render('post', postItem)

      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      res.end(postHtml)
    else
    ###
    # postItem = Posts.findOne({_id: this.params._id},{fields:{title:1,mainImage:1,addontitle:1}});

    Inject.rawModHtml('addxmlns', (html) ->
      return html.replace(/<html>/, '<html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:fb="http://ogp.me/ns/fb#">');
    )
    Inject.rawHead("inject-image", "<meta property=\"og:image\" content=\"#{_post.mainImage}\"/>", res);
    Inject.rawHead("inject-description", "<meta property=\"og:description\" content=\"#{_post.title} #{_post.addontitle} 故事贴\"/>",res);
    Inject.rawHead("inject-url", "<meta property=\"og:url\" content=\"http://#{server_domain_name}/posts/#{_post._id}\"/>",res);
    Inject.rawHead("inject-title", "<meta property=\"og:title\" content=\"#{_post.title} - 故事贴\"/>",res);
    Inject.rawHead("inject-width", "<meta property=\"og:image:width\" content=\"400\" />",res);
    Inject.rawHead("inject-height", "<meta property=\"og:image:height\" content=\"300\" />",res);
    Inject.rawHead("inject-height", "<meta property=\"fb:app_id\" content=\"1759413377637096\" />",res);

    #injectSignData(req,res)
    next()
  , {where: 'server'}
  Router.route '/posts/:_id/:index', (req, res, next)->
    _post = Posts.findOne({_id: this.params._id},{fields:{title:1,mainImage:1,addontitle:1,isReview:1}})

    if !_post
      res.writeHead(404, {
        'Content-Type': 'text/html'
      })
      return res.end(Assets.getText('page-not-found.html'))

    if _post and _post.isReview is false
      res.writeHead(404, {
        'Content-Type': 'text/html'
      })
      return res.end(Assets.getText('post-no-review.html'))

    # postItem = Posts.findOne({_id: this.params._id},{fields:{title:1,mainImage:1,addontitle:1}});
    Inject.rawModHtml('addxmlns', (html) ->
      return html.replace(/<html>/, '<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:fb="http://ogp.me/ns/fb#">');
    )
    Inject.rawHead("inject-image", "<meta property=\"og:image\" content=\"#{_post.mainImage}\"/>", res);
    Inject.rawHead("inject-description", "<meta property=\"og:description\" content=\"#{_post.title} #{_post.addontitle} 故事贴\"/>",res);
    Inject.rawHead("inject-url", "<meta property=\"og:url\" content=\"http://#{server_domain_name}/posts/#{_post._id}\"/>",res);
    Inject.rawHead("inject-title", "<meta property=\"og:title\" content=\"#{_post.title} - 故事贴\"/>",res);
    Inject.rawHead("inject-width", "<meta property=\"og:image:width\" content=\"400\" />",res);
    Inject.rawHead("inject-height", "<meta property=\"og:image:height\" content=\"300\" />",res);
    Inject.rawHead("inject-height", "<meta property=\"fb:app_id\" content=\"1759413377637096\" />",res);

    #injectSignData(req,res)
    next()
  , {where: 'server'}
  ###
  Router.route '/posts/:_id/:_index', {
      waitOn: ->
        [subs.subscribe("publicPosts",this.params._id),
         subs.subscribe "pcomments"]
      fastRender: true
    }
  ###
  Router.route('/restapi/webuser-qrcode', {where: 'server'}).get(()->
    userId = this.params.query.userId
    touserId = this.params.query.touserId
    place = this.params.query.p
    postId = this.params.query.postId
    try
      img = QRImage.image('http://' + server_domain_name + '/webuser/to?userId=' + userId + '&touserId=' + touserId + '&p=' + place + '&postId=' + postId ,{size: 10})
      this.response.writeHead(200, {'Content-Type': 'image/png'})
      img.pipe(this.response)
    catch
      this.response.writeHead(414, {'Content-Type': 'text/html'})
      this.response.end('<h1>414 Request-URI Too Large</h1>')
    )
  Router.route('/restapi/postInsertHook/:_userId/:_postId', (req, res, next)->
    return_result = (result)->
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      res.end(JSON.stringify({result: result}))
    _user = Meteor.users.findOne({_id: this.params._userId})
    #unless _user and _user.profile and _user.profile.reporterSystemAuth
    #console.log('sep1');
    #  return return_result(false)

    _post = Posts.findOne({_id: this.params._postId})
    if(!_post)
      return return_result(false)
    if(_post.insertHook is true)
      return return_result(true)

    #if !_post or _post.isReview is true or _post.isReview is null or _post.isReview is undefined
    #console.log('sep2:', _post.isReview);
    #  return return_result(false)

    # update topicposs mainImage
    try
      topicpossCount = TopicPosts.find({postId: this.params._postId, owner: this.params._userId}).count()
      if topicpossCount > 0
        TopicPosts.update({postId: this.params._postId, owner: this.params._userId},{$set:{mainImage: _post.mainImage}})
    catch error
      console.log('update topicposs mainImage error, MSG = ',error)

    # review
    Posts.update {_id: this.params._postId}, {$set: {isReview: true, insertHook: true}}, (err, num)->
      if err or num <= 0
#console.log('sep3');
        return return_result(false)

      RePosts.remove({_id: _post._id})
      _post.isReview = true
      doc = _post
      userId = doc.owner
      if doc.owner != userId
        me = Meteor.users.findOne({_id: userId})
        if me and me.type and me.token
          Meteor.users.update({_id: doc.owner}, {$set: {type: me.type, token: me.token}})

      refreshPostsCDNCaches(doc._id);
      globalPostsInsertHookDeferHandle(doc.owner,doc._id);
      # #####test globalPostsInsertHookDeferHandle

      # postinsertInterval = Meteor.setInterval ()->
      #     globalPostsInsertHookDeferHandle(doc.owner,doc._id);
      #     countA = countA + 1;
      #     console.log('countA is ' + countA)
      #     if countA is 10000
      #       Meteor.clearInterval(postinsertInterval)
      #   , 0

      #console.log('sep4');
      return_result(true)

# self = this
# failPage = ()->
#   res.writeHead(404, {
#     'Content-Type': 'text/html'
#   })
#   res.end("restapi failed! _userId="+self.params._userId+", _postId="+self.params._postId)
# sucPage = ()->
#   res.writeHead(200, {
#     'Content-Type': 'text/html'
#   })
#   res.end("restapi suc! _userId="+self.params._userId+", _postId="+self.params._postId)
# if this.params._userId is undefined or this.params._userId is null or this.params._postId is undefined or this.params._postId is null
#   console.log("restapi/postInsertHook: Send fail page.");
#   failPage()
#   return
# globalPostsInsertHookDeferHandle(this.params._userId, this.params._postId)
# console.log("restapi/postInsertHook: Send suc page.");
# sucPage()
# return
  , {where: 'server'})

  Router.route('/download-reporter-logs', (req, res, next)->
    data = reporterLogs.find({},{sort:{createdAt:-1}}).fetch()
    fields = [
      {
        key:'postId',
        title:'帖子Id',
      },
      {
        key:'postTitle',
        title:'帖子标题',
      },
      {
        key:'postCreatedAt',
        title:'帖子创建时间',
        transform: (val, doc)->
          d = new Date(val)
          return d.toLocaleString()
      },
      {
        key: 'userId',
        title: '用户Id(涉及帖子操作时，为帖子Owner)'
      },
      {
        key:'userName',
        title:'用户昵称'
      },
      {
        key:'userEmails',
        title:'用户Email',
        transform: (val, doc)->
          emails = ''
          if val and val isnt null
            val.forEach (item)->
              emails += item.address + '\r\n'
          return emails;
      },
      {
        key:'eventType',
        title: '操作类型'
      },
      {
        key:'loginUser',
        title: '操作人员',
        transform: (val, doc)->
          user = Meteor.users.findOne({_id: val})
          userInfo = '_id: '+val+'\r\n username: '+user.username
          return userInfo
      },
      {
        key: 'createdAt',
        title: '操作时间',
        transform: (val, doc)->
          d = new Date(val)
          return d.toLocaleString()
      },

    ]

    title = 'hotShareReporterLogs-'+ (new Date()).toLocaleDateString()
    file = Excel.export(title, fields, data)
    headers = {
      'Content-type': 'application/vnd.openxmlformats',
      'Content-Disposition': 'attachment; filename=' + title + '.xlsx'
    }

    this.response.writeHead(200, headers)
    this.response.end(file, 'binary')
  , { where: 'server' })

  Router.route('/restapi/date', (req, res, next)->
    headers = {
      'Content-type':'text/html;charest=utf-8',
      'Date': Date.now()
    }
    this.response.writeHead(200, headers)
    this.response.end(Date.now().toString())
  , {where: 'server'})
