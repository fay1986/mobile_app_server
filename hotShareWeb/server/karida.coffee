if Meteor.isServer

  kadiraID=process.env.KARDIRA_ID ||'PaEXiKMbAeNEZZNhF'
  kadiraKey=process.env.KARDIRA_KEY ||'0f8e6fd4-51d7-49d9-a1ec-e9f01b549e6d'

  Kadira.connect(kadiraID,kadiraKey)
