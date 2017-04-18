if Meteor.isClient
  Template.reportPost.helpers
    postOwner:->
      Session.get("postContent").ownerName
    postTitle:->
      Session.get("postContent").title
    reportUser:->
      if Session.get('reportUser')
        return Session.get('reportUser').userName 
      else 
        return false
  Template.reportPost.events
    'click .back': (event)->
       if Session.get('reportUser')
         Session.set('reportUser',null)
       history.back()
    "click #save":(event)->
       unless Session.get('reportUser')
         reportPostId = Session.get("postContent")._id
         reportPostOwner = Session.get("postContent").ownerName
         reportTitle = Session.get("postContent").title
       reportReason = $('#reason').val()
       if reportReason is ""
         PUB.toast('请添加举报理由！')
         return false
       if reportReason != ''
         try
           if Session.get('reportUser')
              Reports.insert {
                postId:reportPostId
                reason:reportReason
                username:Meteor.user().username
                userId:Meteor.user()._id
                userIcon:Meteor.user().profile.icon
                createdAt: new Date()
              }
            else
              Reports.insert {
                reporterUser:Session.get('reportUser').userId
                reason:reportReason
                username:Meteor.user().username
                userId:Meteor.user()._id
                userIcon:Meteor.user().profile.icon
                createdAt: new Date()
              }
         catch error
           console.log error
       Router.go('/thanksReport')
       false
