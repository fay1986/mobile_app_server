if Meteor.isClient
  Template.bell.rendered=->
    Session.set("postPageScrollTop", 0)
    $('.content').css 'min-height',$(window).height()
    $(window).scroll (event)->
        target = $("#showMoreFeedsResults");
        FEEDS_ITEMS_INCREMENT = 20;
        if (!target.length)
            return;
        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if target.offset().top < threshold
            if (!target.data("visible"))
                target.data("visible", true);
                Session.set("feedsitemsLimit",
                Session.get("feedsitemsLimit") + FEEDS_ITEMS_INCREMENT);
        else
            if (target.data("visible"))
                target.data("visible", false);
  Template.bell.helpers
    notReadCount: ()->
      Feeds.find({isRead:{$ne: true}, checked:{$ne: true}}).count()
    notRead:(read, check)->
      console.log('isRead:'+read+ 'isCheck:'+check+'>>>>>>>>>>>参数 长度：'+arguments.length)
      if check or read
        return false
      else if arguments.length is 0
        console.log(">>>++++>>>"+this._id)
        return false
      else
        return true
    isFriend:(userId)->
      Meteor.subscribe("friendFollower",Meteor.userId(),userId)
      if Follower.findOne({"userId":Meteor.userId(),"followerId":userId})
        true
      else
        false
    eventFeeds:->
      feeds = Feeds.find({}, {sort: {createdAt: -1}})
      if feeds.count() > 0
        Meteor.defer ()->
          Session.setPersistent('persistentFeedsForMe',feeds.fetch())
        return feeds
      else
        Session.get('persistentFeedsForMe')
    isAlsoComment:(eventType)->
      eventType is 'pcomment'
    isAlsoFavourite:(eventType)->
      eventType is 'pfavourite'
    isPcommentOwner:(eventType)->
      eventType is 'pcommentowner'
    isGetRequest:(eventType)->
      eventType is 'getrequest'
    isSendRequest:(eventType)->
      eventType is 'sendrequest'
    isRecommand:(eventType)->
      eventType is 'recommand'
    isReComment:(eventType)->
      eventType is 'recomment'
    isComment:(eventType)->
      eventType is 'comment'
    selfPosted:(eventType)->
      eventType is 'SelfPosted'
    time_diff: (created)->
      GetTime0(new Date() - created)
    moreResults:->
      !(Feeds.find().count() < Session.get("feedsitemsLimit"))
    loading:->
      Session.equals('feedsCollection','loading')
    loadError:->
      Session.equals('feedsCollection','error')
    noMessages:->
      if Feeds.find().count() > 0 or Session.equals('feedsCollection','loading')
         return false
      else 
         return true
  Template.bell.events
    'click .contentList': (e)->
      if this.pindex?
        Session.set("pcurrentIndex",this.pindex)
        Session.set("pcommetsId",this.owner)
        Session.set("pcommentsName",this.ownerName)
        Session.set "toasted",false
        Feeds.update({_id:this._id},{$set: {checked:true}})
      console.log(this._id)
      Meteor.call 'feedsMsgSetAsRead', this._id
    'click .acceptrequest': (event)->
       Follower.insert {
         userId: this.requesteeId
         userName: this.requestee
         userIcon: this.requesteeIcon
         userDesc: ''
         followerId: this.requesterId
         followerName: this.requester
         followerIcon: this.requesterIcon
         followerDesc: ''
         createAt: new Date()
       }
       Follower.insert {
         userId: this.requesterId
         userName: this.requester
         userIcon: this.requesterIcon
         userDesc: ''
         followerId: this.requesteeId
         followerName: this.requestee
         followerIcon: this.requesteeIcon
         followerDesc: ''
         createAt: new Date()
       }
    'click #follow': (event)->
       Router.go '/searchFollow'
