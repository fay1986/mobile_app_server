/**
 * Created by simba on 5/16/17.
 */

if(Meteor.isServer){
    function runQueryOne(queryString){
        console.log('Query String: '+queryString)
        try {
            var queryResult = Neo4j.query(queryString)
        } catch (_error) {
            console.log("Can't query hot post from neo4j server")
            return false;
        }
        if(queryResult.length >= 1){
            return queryResult[0]
        }
        return false
    }
    function insertUserToNeo4j(userId){
        var doc=Meteor.users.findOne({_id:userId},{fields:{
                'createdAt':1, 'type':1,'profile.sex':1,'profile.lastLogonIP':1,'profile.anonymous':1,
                'profile.browser':1,'profile.location':1, 'services.weixin':1,'username':1,
                'profile.fullname' : 1}})
        var userInfo={
            userId:doc._id,
            createdAt:doc.createdAt.getTime(),
            fullname: doc.profile.fullname,
            device: doc.type,
            sex: doc.profile.sex?doc.profile.sex:'',
            lastLogonIP:doc.profile.lastLogonIP,
            anonymous:doc.profile.anonymous?true:false,
            browser:doc.profile.browser?true:false,
            location:doc.profile.location
        }
        if(doc.services &&doc.services.weixin){
            userInfo.wechatLogin = true
        } else {
            userInfo.username = doc.username
        }
        var userInfoString = JSON.stringify(userInfo)
        userInfoString = userInfoString.replace(/\"([^(\")"]+)\":/g,"$1:")

        var queryString = 'CREATE (u:User'+userInfoString+')'
        runQueryOne(queryString)
    }
    function insertPostToNeo4j(postId){
        var doc = Posts.findOne({_id:postId},{fields:{
            createdAt:1,
            title:1,
            addontitle:1,
            ownerName:1,
            owner:1,
            mainImage:1
        }})
        var postInfo = {
            postId: doc._id,
            createdAt: doc.createdAt.getTime(),
            name: doc.title,
            addonTitle: doc.addontitle,
            ownerName: doc.ownerName,
            ownerId: doc.owner,
            mainImage: doc.mainImage
        }
        var postInfoString = JSON.stringify(postInfo)
        postInfoString = postInfoString.replace(/\"([^(\")"]+)\":/g,"$1:")

        var queryString = 'CREATE (u:Post'+postInfoString+')'
        runQueryOne(queryString)
    }
    function insertViewerToNeo4j(userId,postId){
        var createstr = 'MATCH (u:User {userId:"'+userId+'"}),(p:Post {postId:"'+postId+'"}) '+
            'MERGE  (u)-[v:VIEWER]->(p) '+
            'SET v.by = '+new Date().getTime()+' ' +
            'SET v.count = CASE v.count WHEN NULL THEN 1 ELSE v.count+1 END '+
            'WITH head(collect(v)) as v1, tail(collect(v)) as coll '+
            'FOREACH(x in coll | delete x) '+
            'RETURN v1';
        runQueryOne(createstr)
    }
    ensureUserViewPostInNeo4j = function(userId,postId){
        var postInNeo4j = runQueryOne('MATCH (p:Post{postId:"'+postId+'"}) RETURN p')
        if(!postInNeo4j){
            console.log('Need insert post')
            insertPostToNeo4j(postId)
        }
        var userInNeo4j = runQueryOne('MATCH (u:User{userId:"'+userId+'"}) RETURN u')
        if(!userInNeo4j){
            console.log('Need insert user')
            insertUserToNeo4j(userId)
        }
        var viewInNeo4j = runQueryOne()
        if(!viewInNeo4j){
            console.log('Need insert view')
            insertViewerToNeo4j(userId,postId)
        }

        var queryString = 'MATCH (u:User)-[v:VIEWER]->(p:Post{postId:"'+postId+'"})  RETURN count(v),collect(u.userId)'
        var queryResult = null;
        try {
            queryResult = Neo4j.query(queryString);
        } catch (_error) {
        }
        if (queryResult && queryResult.length>0){
            var count = queryResult[0][0]
            console.log(count)
            var inDBCount = Viewers.find({postId:postId}).count()
            if(count !== inDBCount){
                var inNeo4jViewerIDs=queryResult[0][1]
                var inDBViewerIDs = Viewers.find({postId:postId},{fields:{_id:false,userId:true}}).fetch()
                inDBViewerIDs = inDBViewerIDs.map(function(item){
                    if(item && item.userId){
                        return item.userId
                    } else {
                        return null
                    }
                })
                console.log('Count of userId('+inDBCount+') is not same as in NEO4j('+ count +')')
                console.log(inDBViewerIDs)
                var toRemoveInNeo4j = inNeo4jViewerIDs.diff(inDBViewerIDs)
                var toAddToNeo4j = inDBViewerIDs.diff(inNeo4jViewerIDs)
                console.log('To Remove in Neo4J:'+toRemoveInNeo4j)
                if(toRemoveInNeo4j && toRemoveInNeo4j.length > 0){
                    toRemoveInNeo4j.forEach(function(otherUserId){
                        var removestr = 'MATCH (:User{userId:"'+otherUserId+'"})-[v:VIEWER]->(:Post{postId:"'+postId+'"}) DELETE v';
                        try {
                            queryResult = Neo4j.query(removestr);
                        } catch (_error) {
                            console.log(_error)
                        }
                    })
                }
                console.log('To Add in Neo4J:'+toAddToNeo4j)
                if(toAddToNeo4j && toAddToNeo4j.length > 0){
                    toAddToNeo4j.forEach(function(otherUserId){
                        insertViewerToNeo4j(otherUserId,postId)
                    })
                }
                //var userListIn
            } else {
                console.log('Count of user('+inDBCount+') is same as in NEO4j('+ count +')')
            }
        }
    }
}
