/**
 * Created by simba on 5/17/17.
 */

if(Meteor.isServer){
    getFollowPostFromNeo4J = function(userId,skip,limit){
        var queryString = 'MATCH (u:User{userId:"'+userId+'"})-[f:FOLLOW]->(u1:User) with u1 '+
            'MATCH (p:Post{ownerId:u1.userId})'+
            'RETURN p ORDER BY p.createdAt DESC SKIP '+skip+' LIMIT ' + limit

        var e, queryResult;

        try {
            queryResult = Neo4j.query(queryString);
        } catch (_error) {
            e = _error;
            console.log("Can't query hot post from neo4j server");
            if (postMessageToGeneralChannel) {
                if (process.env.PRODUCTION) {
                    postMessageToGeneralChannel("@everyone Can't query hot post from neo4j server, this is reporting from Production server.");
                } else {
                    postMessageToGeneralChannel("@everyone Can't query hot post from neo4j server, this is reporting from Test/Local  server.");
                }
            }
            return false;
        }

        console.log(queryString);
        updateSucc();
        return queryResult;
    }
}
