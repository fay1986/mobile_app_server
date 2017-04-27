if Meteor.isClient
  Template.topicPosts.onCreated ()->
    Meteor.subscribe("topics")
    Session.set("topicPostLimit", 20)
    Session.set('topicPostsCollection','loading')
    Meteor.subscribe 'topicposts', Session.get('topicId'), 20, onReady: ->
      if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('topicId')}).count()
        console.log 'topicPostsCollection loaded'
        Meteor.setTimeout (->
          Session.set 'topicPostsCollection', 'loaded'
        ), 500
    
  Template.topicPosts.rendered=->
    $('.content').css 'min-height',$(window).height()
    $(window).scroll (event)->
        tHeight = $('.home').height()
        nHeight = $(window).scrollTop() + $(window).height() + 300
        if nHeight > tHeight
          Session.set('topicPostsCollection','loading')
        target = $("#topicPostShowMoreResults");
        TOPIC_POSTS_ITEMS_INCREMENT = 20;

        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height()

        if target.offset().top < threshold
          if (!target.data("visible"))
              Session.set("topicPostLimit",
                          Session.get("topicPostLimit") + TOPIC_POSTS_ITEMS_INCREMENT)
              Meteor.subscribe 'topicposts', Session.get('topicId'), Session.get("topicPostLimit"), onReady: ->
                if Session.get("topicPostLimit") >= TopicPosts.find({topicId:Session.get('topicId')}).count()
                  console.log 'topicPostsCollection loaded'
                  Meteor.setTimeout (->
                    Session.set 'topicPostsCollection', 'loaded'
                    return
                  ), 500
                return
        else
          if (target.data("visible"))
              target.data("visible", false);
  Template.topicPosts.helpers
    TopicTitle:()->
      Session.get('topicTitle')
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    Posts:()->
      TopicPosts.find({topicId:Session.get('topicId')}, {sort: {createdAt: -1}})
    moreResults:->
      if Session.equals('topicPostsCollection','loaded')
          false
      else
          true
  Template.topicPosts.events
    'click .back':(event)->
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.back()
      ,animatePageTrasitionTimeout
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('#footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      postId = this.postId
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      Session.set 'FollowPostsId',this._id
      return
    'click .footer .icon': (e)->
      console.log 'i clicked a icon'
      console.log "owner is: " + this.owner
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("usersById", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      onUserProfile()
    'click .footer .name': (e)->
      console.log 'i clicked a name'
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("usersById", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      onUserProfile()

  getFollowerArr = ()->
    userId = Meteor.userId()
    followerData = Follower.find().fetch()
    followpostData = FollowPosts.find().fetch()
    notShowArrId = []
    notShowArrId.push(userId)
    for item in followerData
      if item.userId is userId
        notShowArrId.push(item.followerId)
    for postData in followpostData
      if notShowArrId.indexOf(postData.owner) is -1
        notShowArrId.push(postData.owner)
    console.log notShowArrId
    Session.set 'notShowPostUserIdArr', notShowArrId
  Template.topicPostsAll.onCreated ()->
    Session.set("newpostsLimit", 10)
    Session.set('newpostsCollection','loading')
    Meteor.subscribe 'newposts', 10, onReady: ->
      if Session.get("newpostsLimit") >= Posts.find({}).count()
        console.log 'newpostsCollection loaded'
        Meteor.setTimeout (->
          Session.set 'newpostsCollection', 'loaded'
        ), 500
    
  Template.topicPostsAll.rendered=->
    $('.content').css 'min-height',$(window).height()
    $(window).scroll (event)->
        tHeight = $('.home').height()
        nHeight = $(window).scrollTop() + $(window).height() + 320
        if nHeight > tHeight
          Session.set('newpostsCollection','loading')
        target = $("#topicPostShowMoreResults");
        TOPIC_POSTS_ITEMS_INCREMENT = 10;

        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height()

        if target.offset().top < threshold
          if (!target.data("visible"))
              Session.set("newpostsLimit",
                          Posts.find({}).count() + TOPIC_POSTS_ITEMS_INCREMENT)
              Meteor.subscribe 'newposts', Session.get('newpostsLimit'), onReady: ->
                notShowArrId = Session.get('notShowPostUserIdArr')
                getFollowerArr()
                if Session.get("newpostsLimit") >= Posts.find({'owner':{$nin:notShowArrId}}).count()
                  console.log 'newpostsCollection loaded'
                  Meteor.setTimeout (->
                    Session.set 'newpostsCollection', 'loaded'
                    return
                  ), 500
                return
        else
          if (target.data("visible"))
              target.data("visible", false);
  Template.topicPostsAll.helpers
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    hideFollowerPosts:(owner)->
      followerIdArr = Session.get('notShowPostUserIdArr')
      if followerIdArr.indexOf(owner) isnt -1
        return false
      else
        return true
    newPosts:()->
      getFollowerArr()
      notShowArrId = Session.get('notShowPostUserIdArr')
      return Posts.find({'owner':{$nin:notShowArrId},'isReview':true,'publish':true}, {sort: {createdAt: -1}})
    moreResults:->
      if Session.equals('newpostsCollection','loaded')
          false
      else
          true
  Template.topicPostsAll.events
    'click .back':(event)->
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.back()
      ,animatePageTrasitionTimeout
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('#footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      postId = this._id
      $('.home').addClass('animated ' + animateOutUpperEffect);
      Meteor.setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      # Session.set 'FollowPostsId',this._id
      return
    'click .footer .icon': (e)->
      console.log 'i clicked a icon'
      console.log "owner is: " + this.owner
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("userinfo", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      onUserProfile()
    'click .footer .name': (e)->
      console.log 'i clicked a name'
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("userinfo", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      onUserProfile()
