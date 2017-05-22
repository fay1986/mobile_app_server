/**
 * Created by simba on 5/6/16.
 */

module.exports.save_follow_relationship=save_follow_relationship
module.exports.remove_follow_relationship=remove_follow_relationship

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = process.env.MONGO_URL;

var dbGraph = require("seraph")({ server: process.env.NEO4J_SERVER,
    endpoint: process.env.NEO4J_ENDPOINT,
    user: process.env.NEO4J_USER,
    pass: process.env.NEO4J_PASSWORD });

function remove_follow_relationship(doc, cb) {
    if (doc && doc.drop && doc.userId && doc.followerId) {
      //MATCH ()-[r1:FOLLOW]->() WITH r1 WHERE r1.itemid is not NULL RETURN r1
      var removestr = 'MATCH (:User{userId:"'+doc.userId+'"})-[f:FOLLOW]->(:User{userId:"'+doc.followerId+'"}) DELETE f';

      //console.log(removestr);
      dbGraph.query(removestr, function(err1, result) {
          if (err1 || !result){
              console.log('DELETE failed');
              cb && cb('DELETE failed')
          }
          else {
              cb && cb(null)
          }
      })
    }
    else
      return cb && cb("invalied arguments");
}

function save_follow_relationship(doc,cb){
    if (doc && doc.userId && doc.followerId && doc.createAt) {
        var ts = new Date(doc.createAt)

        var createstr = 'MATCH (u:User {userId:"'+doc.userId+'"}),(u1:User {userId:"'+doc.followerId+'"}) '+
        'MERGE  (u)-[f:FOLLOW]->(u1) '+
        'SET f.by = '+ts.getTime()+' ' +
        'WITH head(collect(f)) as v1, tail(collect(f)) as coll '+
        'FOREACH(x in coll | delete x) '+
        'RETURN v1';

        console.log(createstr);
        //return cb && cb(null)
        dbGraph.query(createstr, function(err1, result) {
            //console.log(result);
            if (err1 || !result){
                console.log('MERGE failed');
                cb('MERGE failed')
            }
            else {
                cb(null)
            }
        })
    }
    else {
        return cb && cb('invalied arguments for MERGE')
    }
}

function grab_follow_in_hotshare(db,query){
    var cursor =db.collection('follower').find(query);//.limit(3000).sort({createdAt:-1});

    function eachFollowInfo(err,doc){
        if(doc ===null){
            console.log('sync follower finished!')
            return
        }
        if(!err){
            //console.dir(doc)
            save_follow_relationship(doc,function(){
                setTimeout(function(){
                    cursor.next(eachFollowInfo)
                },0)
            })
        } else{
            console.log('Got error in db find follower '+err)
            setTimeout(function(){
                cursor.next(eachFollowInfo)
            },0)
        }
    }
    cursor.next(eachFollowInfo)
}

if(process.env.RUN_IMPORT_FOLLOW) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        var query = {};
        if(process.env.DAY_SINCE_DAY_BEFORE){
            var day = parseInt(process.env.DAY_SINCE_DAY_BEFORE);
            var d = new Date();
            d.setDate(d.getDate()-day);
            query = {createAt:{$gt:d}}
        }
        grab_follow_in_hotshare(db,query)
    });
}

