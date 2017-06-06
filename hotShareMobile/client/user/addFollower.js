/**
 * Created by simba on 6/6/17.
 */
if(Meteor.isClient){
    function getUserPostFromServer(userId,skip,limit){
        Meteor.call('getUserPosts', userId, skip, limit, function(err,result){
            console.log(err)
            console.log(result)
            if(!err && result && result.length > 0){
                result.forEach(function(item){
                    if(item && item._id){
                        if(!FollowPosts.findOne({_id:item._id})){
                            FollowPosts._collection.insert(item)
                        }
                    }
                })
                $('.home #wrapper').data("plugin_xpull").init()
            }
        });
    }
    addFollower = function(data) {
        var followerId = data.followerId;
        function callback() {
            var blackId;
            blackId = BlackList.findOne({blackBy: Meteor.userId()})._id;
            BlackList.update({
                _id: blackId
            }, {
                $pull: {
                    blacker: followerId
                }
            });
            Follower.insert(data);
            if(followerId !== Meteor.userId()){
                getUserPostFromServer(followerId,0,10)
            }
        };
        if (BlackList.find({blackBy: Meteor.userId(),blacker: { $in: [followerId]}}).count() > 0) {
            return navigator.notification.confirm('你已将对方加入黑名单，是否解除？', function(index) {
                if (index === 2) {
                    return callback();
                }
            }, '提示', ['暂不', '解除']);
        } else {
            Follower.insert(data);
            if(followerId !== Meteor.userId()){
                getUserPostFromServer(followerId,0,10)
            }
        }
    };
}