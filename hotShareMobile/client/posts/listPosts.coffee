@onUserProfile = ->
  @PopUpBox = $('.popUpBox').bPopup
    positionStyle: 'fixed'
    position: [0, 0]
    console.log "in user profile page"
    Session.set('displayUserProfileBox',true)
    #onClose: ->
    #  Session.set('displayUserProfileBox',false)
    #onOpen: ->
    #  Session.set('displayUserProfileBox',true)
    
if Meteor.isClient
  Template.listPosts.rendered=->
    $('.content').css 'min-height',$(window).height()
    if FollowPosts.find().count()<4
      toLoadFollowPost()
    if !$('.home #wrapper').data("plugin_xpull")
      $('.home #wrapper').xpull(
        {
          onPullStart: ()->
          callback: ()->
            console.log('pull to refresh follow posts')
            toLoadLatestFollowPost()
        }
      )
    else
      $('.home #wrapper').data("plugin_xpull").init()
    Deps.autorun (h)->
      if FollowPosts.find().count()>3
        h.stop()
        initLoadMoreForListPosts()
    #    $('.mainImage').css('height',$(window).height()*0.55)
    ###
    $(window).scroll (event)->
        target = $("#showMoreResults");
        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if target.offset().top < threshold
            if (!target.data("visible"))
                console.log("target became visible (inside viewable area)");
                target.data("visible", true);
                toLoadFollowPost();
        else
            if (target.data("visible"))
                console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
    ###
  Template.listPosts.helpers
    getBrowseCount:(browse)->
      if (browse)
        browse
      else
        0
    myPosts:()->
      myFollowedPosts = FollowPosts.find({followby:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1}})
      #Session.setPersistent('persistentMyFollowedPosts',myFollowedPosts.fetch())
      return myFollowedPosts #Session.get('persistentMyFollowedPosts')
    # isfollowerpost:(postId)->
    #   if FollowPosts.find({postId:postId}).count() > 1 and postId isnt null
    #     followPostsId = FollowPosts.findOne({postId: postId})._id
    #     FollowPosts.remove({_id:followPostsId})
    #     myFollowedPosts = FollowPosts.find({followby:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1}})
    #     #Session.setPersistent('persistentMyFollowedPosts',myFollowedPosts.fetch())
    #     return true
    #   else
    #     return true
    moreResults:->
      !(FollowPosts.find().count() < Session.get("followpostsitemsLimit"))
    loading:->
      Session.equals('followPostsCollection','loading')
    loadError:->
      Session.equals('followPostsCollection','error')
  Template.listPosts.events
    'click .mainImage': (event)->
      Session.set("postPageScrollTop", 0)
      if isIOS
        if (event.clientY + $('.home #footer').height()) >=  $(window).height()
          console.log 'should be triggered in scrolling'
          return false
      $('.home').addClass('animated ' + animateOutLowerEffect);
      postId = this.postId
      setTimeout ()->
        PUB.page '/posts/'+postId
      ,animatePageTrasitionTimeout
      console.log this.postId
      Session.set 'FollowPostsId',this._id
      console.log this._id
    'click .footer .icon': (e)->
      console.log 'i clicked a icon'
      console.log "owner is: " + this.owner
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("usersById", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      Session.set('pageToProfile','/')
      Session.set('pageScrollTop',$(window).scrollTop())
      onUserProfile()
    'click .footer .name': (e)->
      console.log 'i clicked a name'
      Session.set("ProfileUserId1", this.owner)
      Session.set("currentPageIndex",-1)
      Meteor.subscribe("usersById", this.owner)
      Meteor.subscribe("recentPostsViewByUser", this.owner)
      Session.set('pageToProfile','/')
      Session.set('pageScrollTop',$(window).scrollTop())
      onUserProfile()
