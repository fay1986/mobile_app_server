/**
 * Created by simba on 5/17/17.
 */

if(Meteor.isServer){
    getLatestFollowPostFromNeo4J = function(since){
        // we need show posts wrote by self
        var queryString = 'MATCH (u:User{userId:"'+userId+'"})-[f:FOLLOW]->(u1:User) with u1 ' +
            'MATCH (p:Post{ownerId:u1.userId}) ' +
            'WHERE p.createdAt > ' + since +
            'WITH COLLECT(p) AS pc ' +
            'OPTIONAL MATCH (p1:Post{ownerId:"'+userId+'"}) ' +
            'WHERE p1.createdAt > ' + since +
            'WITH COLLECT(p1)+pc AS pAll ' +
            'UNWIND pAll AS all ' +
            'RETURN all ORDER BY all.createdAt DESC LIMIT '+ 30
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
    getFollowPostFromNeo4J = function(userId,skip,limit){
        /*var queryString = 'MATCH (u:User{userId:"'+userId+'"})-[f:FOLLOW]->(u1:User) with u1 '+
            'MATCH (p:Post{ownerId:u1.userId})'+
            'RETURN p ORDER BY p.createdAt DESC SKIP '+skip+' LIMIT ' + limit
        */
        // we need show posts wrote by self
        var queryString = 'MATCH (u:User{userId:"'+userId+'"})-[f:FOLLOW]->(u1:User) with u1 ' +
            'MATCH (p:Post{ownerId:u1.userId}) ' +
            'WITH COLLECT(p) AS pc ' +
            'OPTIONAL MATCH (p1:Post{ownerId:"'+userId+'"}) ' +
            'WITH COLLECT(p1)+pc AS pAll ' +
            'UNWIND pAll AS all ' +
            'RETURN all ORDER BY all.createdAt DESC SKIP '+skip+' LIMIT '+limit
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
    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };
    ensureFollowInNeo4j = function(userId){
        if(!Match.test(userId, String)){
            return;
        }
        var queryString = 'MATCH (u:User{userId:"'+userId+'"})-[r:FOLLOW]->(u1:User) RETURN count(r),collect(u1.userId)'
        var queryResult = null;
        try {
            queryResult = Neo4j.query(queryString);
        } catch (_error) {
        }
        if (queryResult && queryResult.length>0){
            var count = queryResult[0][0]
            console.log(count)
            var inDBCount = Follower.find({userId:userId}).count()
            if(count !== inDBCount){
                var inNeo4jFollowToIDs = queryResult[0][1]
                var inDBFollowToIDs = Follower.find({userId:userId},{fields:{_id:false,followerId:true}}).fetch()
                inDBFollowToIDs = inDBFollowToIDs.map(function(item){
                    if(item && item.followerId){
                        return item.followerId
                    } else {
                        return null
                    }
                })
                console.log('Count of follower('+inDBCount+') is not same as in NEO4j('+ count +')')
                console.log(inDBFollowToIDs)
                var toRemoveInNeo4j = inNeo4jFollowToIDs.diff(inDBFollowToIDs)
                var toAddToNeo4j = inDBFollowToIDs.diff(inNeo4jFollowToIDs)
                console.log('To Remove in Neo4J:'+toRemoveInNeo4j)
                if(toRemoveInNeo4j && toRemoveInNeo4j.length > 0){
                    toRemoveInNeo4j.forEach(function(followerId){
                        var removestr = 'MATCH (:User{userId:"'+userId+'"})-[f:FOLLOW]->(:User{userId:"'+followerId+'"}) DELETE f';
                        try {
                            queryResult = Neo4j.query(removestr);
                        } catch (_error) {
                            console.log(_error)
                        }
                    })
                }
                console.log('To Add in Neo4J:'+toAddToNeo4j)
                if(toAddToNeo4j && toAddToNeo4j.length > 0){

                    toAddToNeo4j.forEach(function(followerId){
                        var doc =  Follower.findOne({userId:userId,followerId:followerId},{fields:{_id:false,createAt:true}})
                        if(doc){
                            var ts = new Date(doc.createAt)
                            var createstr = 'MATCH (u:User {userId:"'+userId+'"}),(u1:User {userId:"'+followerId+'"}) '+
                                'MERGE  (u)-[f:FOLLOW]->(u1) '+
                                'SET f.by = '+ts.getTime()+' ' +
                                'WITH head(collect(f)) as v1, tail(collect(f)) as coll '+
                                'FOREACH(x in coll | delete x) '+
                                'RETURN v1';
                        }
                        try {
                            queryResult = Neo4j.query(createstr);
                        } catch (_error) {
                            console.log(_error)
                        }
                    })
                }
                //var userListIn
            } else {
                console.log('Count of follower('+inDBCount+') is same as in NEO4j('+ count +')')
            }
        }
    }
}
