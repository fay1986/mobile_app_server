if Meteor.isServer
  Meteor.startup ()->
    Accounts.emailTemplates.from = 'Storyboard <no-reply@tiegushi.com>'
    Accounts.emailTemplates.siteName = 'Storyboard'

    #A Function that takes a user object and returns a String for the subject line of the email.
    Accounts.emailTemplates.verifyEmail.subject = (user)->
      return 'Please verify your email address!'
    #A Function that takes a user object and a url, and returns the body text for the email.
    #Note: if you need to return HTML instead, use Accounts.emailTemplates.verifyEmail.html
    Accounts.emailTemplates.verifyEmail.text = (user, url)->
      return 'Please click following URL to verify your email address!' + url
    Accounts.emailTemplates.resetPassword.subject = (user)->
      return 'You want to change your log in password.'
    Accounts.emailTemplates.resetPassword.text = (user,url)->
      if user.profile and user.profile.fullname and user.profile.fullname isnt ''
        displayName = user.profile.fullname
      else
        displayName = user.fullname
      if displayName is undefined
         displayName = "Hi there!"
      displayName = displayName + ':\n' +'Do you forget the password? We can help!\n'
      displayName = displayName + url + '\n\nIf it is not for you, sorry for my bothering.'
      return displayName
