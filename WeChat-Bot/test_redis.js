/**
 * Created by simba on 5/22/17.
 */
var redis = require("redis")
var async = require('async');
function retry_strategy_func (options) {
    // reconnect after
    return 3000;
}
// 在下面添加需要被测试的Neo4j信息即可
var redisServerConnectionLists=[
    {
        host: 'rds.tiegushi.com',
        port: 6379,
        password: '87302aKecatcp',
        return_buffers: true,
        socket_keepalive: true,
        retry_strategy: retry_strategy_func
    },
    {
        host: 'usurlanalyser.tiegushi.com',
        port: 6379,
        password: 'uwAL539mUJ',
        return_buffers: true,
        socket_keepalive: true,
        retry_strategy: retry_strategy_func
    },
    {
        host: 'urlanalyser.tiegushi.com',
        port: 6379,
        password: 'uwAL539mUJ',
        return_buffers: true,
        socket_keepalive: true,
        retry_strategy: retry_strategy_func
    }
]
var redisLists = []
redisServerConnectionLists.forEach(function(item){
    redisLists.push(redis.createClient(item))
})
var testKey = 'test_key_in_monitor'
function doTestRedis(redisClient,callback){

    if(!redisClient.connected || !redisClient.ready){
        var msg = 'REDIS['+ redisClient.address +'] 连接有误'
        return callback(msg)
    }
    redisClient.incr(testKey,function(err,res){
        redisClient.expire(testKey,60)
        if(err){
            callback('REDIS['+ redisClient.address +'] 出错')
        }
        else{
            callback(null,'REDIS['+ redisClient.address +'] 成功')
        }
    });
}
function testRedis(callback){
    async.map(redisLists,doTestRedis,function(err,result){
        if(!err){
            console.log(result)
            callback(null,'['+result.length + '/'+redisLists.length+'] REDIS 检查成功')
        } else {
            console.log(err)
            callback(err)
        }
    })
}

module.exports=testRedis

