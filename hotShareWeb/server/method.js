if (Meteor.isServer) {
  Meteor.startup(function () {
    Array.prototype.minus = function (arr) {
        var result = new Array();
        var obj = {};
        for (var i = 0; i < arr.length; i++) {
            obj[arr[i]] = 1;
        }
        for (var j = 0; j < this.length; j++) {
            if (!obj[this[j]])
            {
                obj[this[j]] = 1;
                result.push(this[j]);
            }
        }
        return result;
    };
    Meteor.methods({
      'addTopicsAtReview': function (postId, topicIds) {
        Meteor.defer(function () {
          try {
            if (postId && topicIds && topicIds.length > 0) {
              var post = Posts.findOne({ _id: postId });
              var topicPosts = TopicPosts.find({ postId: postId }).fetch();
              var topicPostsIds = [];
              var topicPostObj = {
                postId: post._id,
                title: post.title,
                addontitle: post.addontitle,
                mainImage: post.mainImage,
                heart: 0,
                retweet: 0,
                comment: 1,
                owner: post.owner,
                ownerName: post.ownerName,
                ownerIcon: post.ownerIcon,
                createdAt: new Date()
              };
              for (var i = 0; i < topicPosts.length; i++) {
                topicPostsIds.push(topicPosts[i].topicId);
              }

              topicIds = topicIds.minus(topicPostsIds);
              
              for (var k = 0; k < topicIds.length; k++) {
                topicPostObj.topicId = topicIds[k];
                TopicPosts.insert(topicPostObj)
                Topics.update({ _id: topicIds[k] }, { $inc: { posts: 1 } });
              }
            }
          } catch (error) {
            console.log('addTopicsAtReview ERR=', error)
          }
        });
      }
    });
  })

}