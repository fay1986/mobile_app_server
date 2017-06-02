/**
 * Created by simba on 5/18/17.
 */
var seraph = require("seraph");
var async = require('async');

// 在下面添加需要被测试的Neo4j信息即可
var neo4jServerLists=[
    {
        server:'http://50.233.239.115:7575',
        endpoint: '/db/data',
        user: 'neo4j',
        pass: '5MW-wU3-V9t-bF6'
    },
    {
        server:'http://120.24.247.107:7474',
        endpoint: '/db/data',
        user: 'neo4j',
        pass: '5MW-wU3-V9t-bF6'
    },
    {
        server:'http://120.24.247.107:7474',
        endpoint: '/db/data',
        user: 'neo4j',
        pass: '5MW-wU3-V9t-bF6'
    }

]
var dbGraphList = []
neo4jServerLists.forEach(function(item){
    dbGraphList.push(seraph(item))
})
var testQueryString = 'MATCH (n) RETURN count(n)'
function doTestNeo4J(dbGraph,callback){
    dbGraph.query(testQueryString, function(err,result){
        if(err)
            console.log('check neo4j err:' + err + ' result:' + result)

        if(!err && result && result.length > 0){
            var count = result[0]['count(n)']
            callback(null,count+' nodes on '+dbGraph.options.server)
        } else{
            callback('Neo4J 查询失败('+ dbGraph.options.server +')')
        }
    })
}
function testNeo4j(callback){
    async.map(dbGraphList,doTestNeo4J,function(err,result){
        if(!err){
            console.log(result)
            callback(null,'['+result.length + '/'+dbGraphList.length+'] Neo4J 查询成功')
        } else {
            console.log(err)
            callback(err)
        }
    })
}

module.exports=testNeo4j

