/**
 * Created by simba on 5/18/17.
 */

if(Meteor.isServer){
    Meteor.startup(function(){
        var statusRecordInfo = null;
        updateSucc = function(){
            statusRecordInfo.succ++;
        }
        function initStatusRecord(){
            statusRecordInfo = {
                service: process.env.SERVICE_NAME ? process.env.SERVICE_NAME:'ddpMeteor',
                production: process.env.PRODUCTION ? true:false,
                serviceIndex: process.env.SERVICE_INDEX ? process.env.SERVICE_INDEX:0, //index 0 for production
                succ: 0,
                detail:{}
            }
        }
        function reportStatusToMQTTBroker(){
            sendMqttMessage('status/service',statusRecordInfo);
            initStatusRecord();
        }
        initStatusRecord();
        Meteor.setInterval(reportStatusToMQTTBroker,30*1000);
    })
}
