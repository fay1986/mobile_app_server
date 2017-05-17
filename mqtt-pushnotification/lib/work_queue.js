var kue        = require('kue');
var cluster    = require('cluster');
var clusterWorkerSize = 1; //only one slave needed !!

var debug = false
var prefix = '';
var redis_prefix = prefix+'workai_mqtt_pushnotification_task';
var redis_prefix_us = prefix+'workai_mqtt_pushnotification_task_us';
var QUEUE_SIZE = 1024;
var kuequeue;

module.exports = workQueue
function workQueue(){
}
workQueue.workQueueInit = workQueue_init;
workQueue.isMaster = checkIsMaster;
workQueue.createTaskToKueQueue = createTaskToKueQueue;

function startKueService(handler) {
    var redis_server_url;
    if (process.env.SERVER_IN_US) {
        redis_server_url = 'usurlanalyser.tiegushi.com';
    } else {
        redis_server_url = 'urlanalyser.tiegushi.com';
    }
    kuequeue = kue.createQueue({
             prefix: redis_prefix,
             redis: {
                 port: 6379,
                 host: redis_server_url,
                 auth: 'uwAL539mUJ'
             }});
    if (cluster.isMaster) {
        console.log("!!!!!!!!!! startKueService: Master...");
    } else {
        console.log("!!!!!!!!!! startKueService: Slaver...");
        setKueProcessCallback(handler);
    }
}

function _isObject(obj){
    return (typeof obj=='object')&&obj.constructor==Object;
}

function setKueProcessCallback(handler) {
    function _process_callback(job, ctx, done){
        ctx.pause( 5000, function(err){
            var data = job.data;
            var _id = data.id;
            var itemObj = data.itemObj;
            debug && console.log('worker', cluster.worker.id, 'queue.process', job.data);
            debug && console.log('------- Start --------');

            if (!_isObject(itemObj)) {
                console.log("itemObj is invalid, itemObj="+itemObj);
                done();
                ctx.resume();
                return;
            }
            setTimeout(function() {
                try {
                    debug && console.log("Worker is paused... ");
                    handler(_id, itemObj, function() {
                        job.progress(100, 100, JSON.stringify({'result': 'success'}));
                        debug && console.log('-------  End  --------');
                        done();
                        ctx.resume();
                    });
                } catch (error) {
                    console.log("Exception: in setKueProcessCallback, error="+error);
                    console.log("Exception: in setKueProcessCallback, job.data="+JSON.stringify(job.data));
                    done(new Error('failed'));
                    ctx.resume();
                }
            }, 0);
        });
    }
    if (!process.env.SERVER_IN_US) {
        console.log("cluster Slaver: CN");
        kuequeue.process(redis_prefix, QUEUE_SIZE, _process_callback);
    } else {
        console.log("cluster Slaver: US");
        kuequeue.process(redis_prefix_us, QUEUE_SIZE, _process_callback);
    }
}

function abornalDispose() {
    kuequeue.on('error', function(err) {
        if (cluster.isMaster) {
            console.log('Master: Oops... ', err);
        } else {
            console.log('Slaver: Oops... ', err);
        }
        restartKueService();
    });

    kuequeue.watchStuckJobs(30*1000);

    kuequeue.inactiveCount(function(err, total){ // others are activeCount, completeCount, failedCount, delayedCount
        if (total > 100000) {
            console.log( 'We need some back pressure here' );
        }
    });
    kuequeue.failedCount('my-critical-job', function(err, total) {
        if (total > 10000) {
            console.log( 'This is tOoOo bad' );
        }
    });
}

function createTaskToKueQueue(_id, itemObj) {
    _createTaskToKueQueue(redis_prefix, _id, itemObj)
}

function _createTaskToKueQueue(prefix, _id, itemObj) {
    var job = kuequeue.create(prefix, {
      id: _id,
      itemObj:itemObj
    }).priority('critical').removeOnComplete(true).save(function(err){
      if (!err) {
        debug && console.log("   job.id = "+job.id+", _id="+_id);
      }
    });

    job.on('enqueue', function(id, type) {
        debug && console.log('Job '+id+'('+job.id+') got queued of type '+type);
    }).on('complete', function(result){
        debug && console.log('Job '+job.id+' completed with data '+result);
    }).on('failed attempt', function(errorMessage, doneAttempts){
        console.log('Job '+job.id+' attempt failed');
    }).on('failed', function(errorMessage){
        console.log('Job '+job.id+' failed');
    }).on('progress', function(progress, data){
        debug && console.log('job #' + job.id + ' ' + progress + '% complete with data ', data);
    });
    return job;
}

function checkIsMaster() {
    return cluster.isMaster;
}

function workQueue_init(handler) {
    if (cluster.isMaster) {
        console.log("clusterWorkerSize="+clusterWorkerSize);
        for (var i = 0; i < clusterWorkerSize; i++) {
            cluster.fork();
            console.log("cluster master fork: i="+i);
        }
        cluster.on('exit', function(worker, code, signal) {
            console.log('Worker ' + worker.id + ' died..');
            cluster.fork();
        });
        cluster.on('disconnect', function() {
            console.log('Frank Worker disconnect..');
        });
        cluster.on('message', function(message) {
            console.log('master message form worker:', message);
        });
    }

    startKueService(handler);
    abornalDispose();
}

//workQueue_init();
