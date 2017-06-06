/**
 * Created by simba on 6/6/17.
 */

if(Meteor.isClient){
    removeFollower = function(_id){
        try{
            var follower = Follower.findOne({_id:_id},{fields:{followerId:true}})
            Follower.remove(_id)
            if(follower && follower.followerId){
                FollowPosts._collection.remove({owner:follower.followerId})
            }
        } catch(e){
            console.log(e)
            console.log('Exception when remove follower on client')
        }
    }
}