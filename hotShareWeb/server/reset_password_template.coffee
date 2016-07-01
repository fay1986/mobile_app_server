if Meteor.isServer
  Meteor.startup ()->
    Accounts.emailTemplates.from = 'Storyboard <no-reply@tiegushi.com>'
    Accounts.emailTemplates.siteName = 'Storyboard'

    #A Function that takes a user object and returns a String for the subject line of the email.
    Accounts.emailTemplates.verifyEmail.subject = (user)->
      return 'Please verify your email address.'
    #A Function that takes a user object and a url, and returns the body text for the email.
    #Note: if you need to return HTML instead, use Accounts.emailTemplates.verifyEmail.html
    Accounts.emailTemplates.verifyEmail.text = (user, url)->
      return 'Please click the following link to verify your email address:' + url
    Accounts.emailTemplates.resetPassword.subject = (user)->
      return 'You are requsting to reset Storyboard log in password.'
    Accounts.emailTemplates.resetPassword.text = (user,url)->
      if user.profile and user.profile.fullname and user.profile.fullname isnt ''
        displayName = user.profile.fullname
      else
        displayName = user.fullname
      if displayName is undefined
         displayName = "Hi, "
      displayName = displayName + ':\n' +'Did you forget Storyboard log in password？Please click folliwing link and we will help you to reset it. \n'
      displayName = displayName + url + '\n\nPlease ignore this email if there is anything wrong.'
      return displayName
