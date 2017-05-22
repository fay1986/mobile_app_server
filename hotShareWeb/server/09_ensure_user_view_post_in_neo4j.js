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
        var viewInNeo4j = runQueryOne('MATCH (u:User{userId:"'+userId+'"})-[v:VIEWER]->(p:Post{postId:"'+postId+'"})  RETURN v')
        if(!viewInNeo4j){
            console.log('Need insert view')
            insertViewerToNeo4j(userId,postId)
        }
    }
}
