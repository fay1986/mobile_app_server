if Meteor.isClient
  Template.thanksReport.events
    "click .rightButton":(event)->
       if Session.get('reportUser')
         Session.set('reportUser',null)
         return PUB.back()
       postId = Session.get("postContent")._id
       Router.go '/posts/'+postId
       false
    "click .back":(event)->
       if Session.get('reportUser')
         Session.set('reportUser',null)
         return PUB.back()
       postId = Session.get("postContent")._id
       Router.go '/posts/'+postId
       false
