/**
 * Created by simba on 5/12/16.
 */
if(Meteor.isServer){
    initMQTT = function(clientId){
        var mqttOptions = {
            clean:true,
            keepalive:30,
            reconnectPeriod:20*1000,
            clientId:clientId
        }
        mqtt_connection=mqtt.connect('ws://tmq.tiegushi.com:80',mqttOptions);
        mqtt_connection.on('connect',function(){
            console.log('Connected to mqtt server');
        });
        sendMqttMessage=function(topic,message){
            Meteor.defer(function(){
                mqtt_connection.publish(topic,JSON.stringify(message),{qos:1})
            })
        }
        mqttPostViewHook=function(userId,postId){
            try{
                sendMqttMessage('postView',{userId:userId,postId:postId})
            }catch(e){}
        }
        mqttInsertNewPostHook=function(ownerId,postId,title,addonTitle,ownerName,mainImage){
            try{
                sendMqttMessage('publishPost',{
                    ownerId:ownerId,
                    postId:postId,
                    title:title,
                    addonTitle:addonTitle,
                    ownerName:ownerName,
                    mainImage:mainImage
                })
            }catch(e){}
        }
        mqttRemoveNewPostHook = function(ownerId,postId,createdAt) {
            try{
                sendMqttMessage('unPublishPost',{
                    ownerId: ownerId,
                    postId: postId,
                    createdAt: createdAt
                });
            }catch(e){}
        }
        mqttUserCreateHook=function(userId,fullname,username){
            try{
                sendMqttMessage('newUser',{
                    userId:userId,
                    fullname:fullname,
                    username:username
                })
            }catch(e){}
        }
        mqttFollowerInsertHook = function(doc){
            try{
                sendMqttMessage('followUser',{
                    userId: doc.userId,
                    userName: doc.username,
                    userIcon: doc.userIcon,
                    userDesc: doc.userDesc,
                    followerId: doc.followerId,
                    followerName: doc.followerName,
                    followerIcon: doc.followerIcon,
                    followerDesc: doc.followerDesc,
                    createAt: doc.createAt
                })
            } catch(e){}
        }
        mqttFollowerRemoveHook = function(userId, followerId) {
            try{
                sendMqttMessage('unFollowUser',{
                    userId: userId,
                    followerId: followerId
                })
            } catch (e){}
        }
    }

    Meteor.startup(function(){
        initMQTT(null);
    })
}
