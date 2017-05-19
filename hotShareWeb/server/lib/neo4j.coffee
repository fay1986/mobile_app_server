Meteor.startup ()->
  url = process.env.NEO4J_URL or process.env.GRAPHENEDB_URL or "http://neo4j:5MW-wU3-V9t-bF6@50.233.239.115:7575"
  Meteor.defer ()->
    @Neo4j = new Neo4jDb url