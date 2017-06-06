/**
 * Created by simba on 6/6/17.
 */

if(Meteor.isServer){
    /*
     * 本函数的目的是从Neo4J中查询指定用户的发帖记录
     */
    getUserPostFromNeo4J = function(userId,skip,limit){
        var queryString = 'MATCH (post:Post{ownerId:"'+userId+'"}) ' +
            'RETURN post ORDER BY post.createdAt DESC SKIP '+skip+' LIMIT '+limit
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
    Meteor.startup(function() {
        Meteor.methods({
            "getUserPosts": function (userId,skip,limit) {
                if (this.userId === null) {
                    return false;
                }
                this.unblock();
                var queryResult = getUserPostFromNeo4J(userId,skip,limit)
                var returnResult = []
                try{
                    if(queryResult && queryResult.length > 0){
                        queryResult.forEach(function (item) {
                            if(item){
                                var fields = formatFollowPost(userId, item);
                                fields['_id'] = item.postId;
                                fields['followby'] = this.userId;
                                returnResult.push(fields);
                            }
                        });
                    }
                } catch(e) {
                    console.log(e)
                    console.log('in pullLatestPosts, exception')
                }

                return returnResult;
            }
        })
    })
}
