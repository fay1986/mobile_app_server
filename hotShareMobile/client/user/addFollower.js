/**
 * Created by simba on 6/6/17.
 */
if(Meteor.isClient){
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
        };
        if (BlackList.find({blackBy: Meteor.userId(),blacker: { $in: [followerId]}}).count() > 0) {
            return navigator.notification.confirm('你已将对方加入黑名单，是否解除？', function(index) {
                if (index === 2) {
                    return callback();
                }
            }, '提示', ['暂不', '解除']);
        } else {
            return Follower.insert(data);
        }
    };
}