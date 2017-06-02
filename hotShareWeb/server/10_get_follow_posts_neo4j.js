/**
 * Created by simba on 5/17/17.
 */

if(Meteor.isServer){
    /*
     * 本函数的目的是从Neo4J中查询从since开始的30条新FollowPost数据
     */
    getLatestFollowPostFromNeo4J = function(userId,since){

        /*
         * 逐行解释
         * 1. 获得u1，用户Follow的用户
         * 2. 获得p，u1创作的帖子
         * 3. 提取创作时间自since以后的帖子
         * 4. 将p变换成数组pc
         * 5. OPTINAL MATCH是独立Match语句，不对1／2／3的操作造成影响
         *    获得p1，p1是当前用户自己写的帖子，因为当前用户自己的帖子也要出现在他的首页
         *    也就是存在于followpost返回中
         * 6. 提取创作时间自since以后的自己写的帖子
         * 7. 将p1变换成数组，和pc合并记录为pAll
         * 8. 将数组解散成驻条记录all，以便使用Neo4J作用在all上
         * 9. 排序以及提取需要的数据
         */
        var queryString = 'MATCH (u:User{userId:"'+userId+'"})-[f:FOLLOW]->(u1:User) with u1 ' +
            'MATCH (p:Post{ownerId:u1.userId}) ' +
            'WHERE p.createdAt > ' + since + ' ' +
            'WITH COLLECT(p) AS pc ' +
            'OPTIONAL MATCH (p1:Post{ownerId:"'+userId+'"}) ' +
            'WHERE p1.createdAt > ' + since + ' ' +
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
    /*
     * 本函数的目的是从Neo4J中查询指定数目的FollowPost数据
     */
    getFollowPostFromNeo4J = function(userId,skip,limit){
        /*
         * 逐行解释
         * 1. 获得u1，用户Follow的用户
         * 2. 获得p，u1创作的帖子
         * 3. 将p变换成数组pc
         * 4. OPTINAL MATCH是独立Match语句，不对1／2／3的操作造成影响
         *    获得p1，p1是当前用户自己写的帖子，因为当前用户自己的帖子也要出现在他的首页
         *    也就是存在于followpost返回中
         * 5. 将p1变换成数组，和pc合并记录为pAll
         * 6. 将数组解散成驻条记录all，以便使用Neo4J作用在all上
         * 7. 排序以及提取需要的数据
         */
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

    /*
     * 本函数目的是保证Neo4J里记录的Follow To数据关系和Mongodb中的数据一致
     * 操作过程：
     * 1. 获得 Mongodb中用户Follow To关系的数量 inDBCount
     * 2. 获得 Neo4J中用户Follow To关系的数量 inNeo4jFollowToIDs.length
     * 3. 计算 Neo4J中多出来（toRemoveInNeo4j）和缺少的（toAddToNeo4j）
     * 4. 在Neo4J中删除多出来的（toRemoveInNeo4j）增加缺少的（toAddToNeo4j）
     */
    ensureFollowInNeo4j = function(userId){
        if(!Match.test(userId, String)){
            return;
        }
        // 计算Neo4J中用户Follow To的 数量和用户列表
        // count(r)计算数量，列表用 collect(u1.userId)合并到一个数组里
        // 该查询返回一个二维数组 [0][0] 是 count(r), [0][1] 是Follow To 的用户列表
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
                        // 在Neo4J中删除关系
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
                            // 在Neo4J中创建Follow To关系
                            // 需要注意不要创建出多条相同语义的关系，这里使用Merge来确保操作的是同一条 MERGE SET是操作同一条
                            // 如果Neo4J中已经保存了多条同等关系，这句话是用来确保 删除多余的数据
                            // collect(f) 是将满足约束的关系做成数组
                            // tail(collect(f)) as coll,  tail 是获得除去第一条之外，之后的所有数据
                            // FOREACH(x in coll | delete x)  是删除第一条之后的所有同等数据
                            // WITH head(collect(f)) as v1  head 是第一条记录，RETURN v1 将这条记录返回（目前不对结果做处理）
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
