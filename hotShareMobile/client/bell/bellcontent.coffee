if Meteor.isClient
  updateUserFeedsByType = ()->
    me = Meteor.userId()
    type = Session.get('bellType')
    if me 
      if type is 'new-story'
        Meteor.call('updateFeedsByType',me,['SelfPosted'])
      else if type is 'up-and-pcomment'
        typeArr = ["pcomment","pcommentReply","pfavourite","pcommentowner","getrequest","sendrequest","recommand","recomment","comment"]
        Meteor.call('updateFeedsByType',me,typeArr)
      else if type is 'personal-letter'
        Meteor.call('updateFeedsByType',me,['personalletter'])
  Template.bellcontent.rendered=->
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
  Template.bellcontent.helpers
    headTitle: ()->
      bellType = Session.get 'bellType'
      t = '动态'
      if bellType is 'new-story'
        t = '新故事'
      else if bellType is 'up-and-pcomment'
        t = '赞和评论'
      else if bellType is 'personal-letter'
        t = '站内信'
      return t
    notRead:(read, check, index, createAt)->
      console.log('isRead:'+read+ 'isCheck:'+check+'>>>>>>>>>>>参数 长度：'+arguments.length)
      if (new Date() - new Date(createAt).getTime() ) > (7 * 24 * 3600 * 1000)
        return false
      if index > 20
        return false      
      if check or read
        return false
      else if arguments.length is 2
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
      return Session.get 'bellData'
      # feeds = Feeds.find({}, {sort: {createdAt: -1}})
      # if feeds.count() > 0
      #   Meteor.defer ()->
      #     Session.setPersistent('persistentFeedsForMe',feeds.fetch())
      #   return feeds
      # else
      #   Session.get('persistentFeedsForMe')
    isAlsoComment:(eventType)->
      eventType is 'pcomment'
    isPCommentReply:(eventType)->
      eventType is 'pcommentReply'
    isAlsoFavourite:(eventType)->
      eventType is 'pfavourite'
    isPcommentOwner:(eventType)->
      eventType is 'pcommentowner'
    isPersonalletter:(eventType)->
      eventType is 'personalletter'
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
  Template.bellcontent.events
  	'click #back': (e)->
      updateUserFeedsByType()
      Router.go '/bell'
    'click .bell-line': (e)->
      currentType = e.currentTarget.id
      Session.set 'bellType', currentType
      Router.go '/bellcontent'
    'click .closePersonalLetter': ()->
      Session.set('inPersonalLetterView',false)
      $('body').css('overflow-y','auto')
      $('.personalLetterContent,.bellAlertBackground').fadeOut 300
    'click #personalLetter': (e)->
      Session.set('inPersonalLetterView',true)
      $('body').css('overflow-y','hidden')
      document.getElementById(this._id + 'content').style.display='block'
      $(".bellAlertBackground").fadeIn 300
    'click .contentList': (e)->
      history = []
      history.push {
          view: 'bellcontent'
          scrollTop: document.body.scrollTop
      }
      Session.set "history_view", history
      if this.pindex?
        Session.set("pcurrentIndex",this.pindex)
        Session.set("pcommetsId",this.owner)
        Session.set("pcommentsName",this.ownerName)
        Session.set "toasted",false
        if this.eventType is 'pcommentReply'
          Session.set "isPcommetReply",true
        else
          Session.set "isPcommetReply",false
        Feeds.update({_id:this._id},{$set: {checked:true}})
      console.log(this._id)
      # Meteor.call 'updataFeedsWithMe', Meteor.userId()
      updateUserFeedsByType()
    'click .acceptrequest': (event)->
      addFollower {
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
      addFollower {
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
