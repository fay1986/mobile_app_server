#space 2
if Meteor.isClient
  Template.home.helpers
    wasLogon:()->
      if Session.get('isShareExtension')
        return true
      Session.get('persistentLoginStatus')
    isShareExtension:()->
      Session.get('isShareExtension')
    isCordova:()->
      Meteor.isCordova
    isFirstLog:()->
      if Session.get('isShareExtension')
        return false
      Session.get('isFlag');
  Template.home.events
    'click #follow': (event)->
       Router.go '/searchFollow'
    'click .clickHelp':(event)->
      PUB.page '/help'
  Template.home.rendered=->
    flag = window.localStorage.getItem("firstLog") == 'first'
    Session.set('isFlag', !flag)
