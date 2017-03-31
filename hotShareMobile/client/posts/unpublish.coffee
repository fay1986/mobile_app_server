if Meteor.isClient
  Template.unpublish.events
    'click .back':(event)->
      #Router.go('/')
      PUB.back()
  Template.seriesUnPublish.events
    'click .back':(event)->
      PUB.back()