window.updateMyCurrentVersion = ()->
  if version_of_build
    Meteor.users.update Meteor.userId(),{$set:{'profile.currentVersion':version_of_build}}
Accounts.onLogin(()->
  Meteor.setTimeout ()->
    console.log("Accounts.onLogin will update my own current version")
    window.updateMyCurrentVersion()
  ,3000
)