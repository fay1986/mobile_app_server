/**
 * Created by simba on 6/6/17.
 */

if(Meteor.isClient){
    removeFollower = function(followerId){
        try{
            Follower.remove(followerId)
        } catch(e){
            console.log(e)
            console.log('Exception when remove follower on client')
        }
    }
}