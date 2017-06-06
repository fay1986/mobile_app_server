/**
 * Created by simba on 5/19/17.
 */
if(Meteor.isClient){
    PostFriends = new Meteor.Collection("postfriends");
    PostFriendsCount = new Meteor.Collection("postfriendsCount");
    Newfriends = new Meteor.Collection("newfriends");
    ViewLists = new Meteor.Collection("viewlists");
    //User detail has duplicated information with postfriends, so only leave one to save traffic
    //UserDetail = new Meteor.Collection("userDetail");
    DynamicMoments = new Meteor.Collection('dynamicmoments');
    NewDynamicMoments = new Meteor.Collection('newdynamicmoments');
    SuggestPosts = new Meteor.Collection('suggestposts');

    // ClientPostFriends（groundDB）记录： 新朋友点过的，且count=1的数据
    ClientPostFriends = new Ground.Collection('ClientPostFriends', { connection: null });
}


if(Meteor.isClient){
    FOLLOWPOSTS_ITEMS_INCREMENT = 30;
    var FEEDS_ITEMS_INCREMENT = 20;
    var FOLLOWS_ITEMS_INCREMENT = 10;
    var MYPOSTS_ITEMS_INCREMENT = 15;
    var MOMENTS_ITEMS_INCREMENT = 10;
    var FAVOURITE_POSTS_INCREMENT = 10;
    var POSTFRIENDS_ITEMS_INCREMENT = 10;
    var SERIES_ITEMS_INCREMENT = 10;
    var SUGGEST_POSTS_INCREMENT = 15;
    var FOLLOW_SERIES_INCREMENT = 6;
    var POST_ID = null;
    Session.setDefault('followpostsitemsLimit', FOLLOWPOSTS_ITEMS_INCREMENT);
    Session.setDefault('feedsitemsLimit', FEEDS_ITEMS_INCREMENT);
    Session.setDefault('followersitemsLimit', FOLLOWS_ITEMS_INCREMENT);
    Session.setDefault('followeesitemsLimit', FOLLOWS_ITEMS_INCREMENT);
    Session.setDefault('mypostsitemsLimit', MYPOSTS_ITEMS_INCREMENT);
    Session.setDefault('momentsitemsLimit', MOMENTS_ITEMS_INCREMENT);
    Session.setDefault('favouritepostsLimit', FAVOURITE_POSTS_INCREMENT);
    Session.setDefault('favouritepostsLimit1', FAVOURITE_POSTS_INCREMENT);
    Session.setDefault('favouritepostsLimit2', FAVOURITE_POSTS_INCREMENT);
    Session.setDefault('favouritepostsLimit3', FAVOURITE_POSTS_INCREMENT);
    Session.setDefault('postfriendsitemsLimit', POSTFRIENDS_ITEMS_INCREMENT);
    Session.setDefault("momentsitemsLimit",MOMENTS_ITEMS_INCREMENT);
    Session.setDefault("suggestpostsLimit",SUGGEST_POSTS_INCREMENT);
    Session.setDefault("seriesitemsLimit",SERIES_ITEMS_INCREMENT);
    Session.setDefault("followSeriesLimit",FOLLOW_SERIES_INCREMENT);
    Session.set('followSeriesCollection','loading');
    Session.set('seriesCollection','loading');
    Session.set('followPostsCollection','loaded');
    Session.set('feedsCollection','loading');
    Session.set('followersCollection','loading');
    Session.set('followeesCollection','loading');
    Session.set('myPostsCollection','loading');
    Session.set('momentsCollection','loading');
    Session.set('postfriendsCollection','loaded');
    var subscribeFollowSeriesOnError = function(err){
        Session.set('followSeriesCollection','error');
        if(Meteor.user())
        {
            Meteor.setTimeout(function(){
                Session.set('followSeriesCollection','loading');
                Meteor.subscribe('followSeries',Session.get('followSeriesLimit'),{
                    onError: subscribeFollowSeriesOnError,
                    onReady: function(){
                        Session.set('followSeriesCollection','loaded');
                    }
                });
            },2000);
        }
    };
    var subscribeMySeriesOnError = function(err){
        Session.set('seriesCollection','error');
        if(Meteor.user())
        {
            Meteor.setTimeout(function(){
                Session.set('seriesCollection','loading');
                Meteor.subscribe('followSeries', Session.get('seriesitemsLimit'), {
                    onError: subscribeMySeriesOnError,
                    onReady: function(){
                        Session.set('seriesCollection','loaded');
                    }
                });
            },2000);
        }
    };
    var subscribeFeedsOnError = function(err){
        console.log('feedsCollection ' + err);
        Session.set('feedsCollection','error');
        if(Meteor.user())
        {
            Meteor.setTimeout(function(){
                Session.set('feedsCollection','loading');
                Meteor.subscribe('feeds', Session.get('feedsitemsLimit'), {
                    onError: subscribeFeedsOnError,
                    onReady: function(){
                        console.log('feedsCollection loaded');
                        Session.set('feedsCollection','loaded');
                    }
                });
            },2000);
        }
    };
    window.refreshMainDataSource = function(){
        Meteor.subscribe('waitreadcount');
        //Meteor.subscribe('shareURLs');
    };
    if(Meteor.isCordova){
        var options = {
            keepHistory: 1000 * 60 * 5,
            localSearch: true
        };
        var followPostsInMemory = 0;
        var fields = ['username', 'profile.fullname'];
        FollowUsersSearch = new SearchSource('followusers', fields, options);
        var topicsfields = ['text'];
        TopicsSearch = new SearchSource('topics', topicsfields, options);
        var postsfields = ['title'];
        PostsSearch = new SearchSource('posts', postsfields, options);

        followPostStatus = 'loaded'
        subscribeFollowPostsOnError = function(err){
            console.log('followPostsCollection ' + err);
            if(Meteor.user()){
                followPostStatus = 'loaded'
                Session.set('followPostsCollection','error')

                Session.set("followpostsitemsLimit",FollowPosts.find({followby:Meteor.userId()}).count())
                Meteor.setTimeout(toLoadFollowPost,2000);
            }
        };
        toLoadLatestFollowPost = function(){
            latestPost = FollowPosts.findOne({},{sort:{createdAt:-1}})
            since = 0
            if(latestPost){
                since = latestPost.createdAt
            }
            Meteor.call('pullLatestPosts', since, 10,function(err,result){
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
                }
            });
        }
        toLoadFollowPost = function(){
            if( followPostStatus === 'loaded'){
                console.log('Called here')
                followPostStatus = 'loading'
                Session.set('followPostsCollection','loading')
                Session.set("followpostsitemsLimit", FOLLOWPOSTS_ITEMS_INCREMENT+followPostsInMemory);
                Meteor.subscribe('followposts', FOLLOWPOSTS_ITEMS_INCREMENT, followPostsInMemory,true, {
                    onError: subscribeFollowPostsOnError,
                    onStop:function(){
                        if (followPostStatus === 'loading'){
                            followPostStatus = 'loaded'
                            Session.set('followPostsCollection','loaded')
                            Session.set("followpostsitemsLimit",FollowPosts.find({followby:Meteor.userId()}).count())
                        }
                    },
                    onReady: function () {
                        console.log('followPostsCollection loaded');
                        followPostStatus = 'loaded'
                        Session.set("followpostsitemsLimit",FollowPosts.find({followby:Meteor.userId()}).count())
                        Session.set('followPostsCollection','loaded')
                    }
                });
            }
        }
        Tracker.autorun(function(){
            if(Meteor.userId()){
                followPostsInMemory = FollowPosts.find({followby:Meteor.userId()}).count()
                if(followPostsInMemory === 0){
                    toLoadFollowPost();
                }
            }
        })
        Tracker.autorun(function(){
            if (Meteor.userId()) {
                Meteor.subscribe('followSeries', Session.get('followSeriesLimit'), {
                    onError: subscribeMySeriesOnError,
                    onReady: function () {
                        console.log('followSeriesCollection loaded');
                        Session.set('followSeriesCollection', 'loaded');
                    }
                });
                Meteor.subscribe('mySeries', Session.get('seriesitemsLimit'), {
                    onError: subscribeMySeriesOnError,
                    onReady: function () {
                        console.log('seriesCollection loaded');
                        Session.set('seriesCollection', 'loaded');
                    }
                });
                Meteor.subscribe('feeds', Session.get('feedsitemsLimit'), {
                    onError: subscribeFeedsOnError,
                    onReady: function () {
                        console.log('feedsCollection loaded');
                        Session.set('feedsCollection', 'loaded');
                    }
                });
                Meteor.subscribe('followToWithLimit', Session.get('followersitemsLimit'), {
                    onReady: function () {
                        console.log('followersCollection loaded');
                        Session.set('followersCollection', 'loaded');
                    }
                });
                Meteor.subscribe('followedByWithLimit', Session.get('followeesitemsLimit'), {
                    onReady: function () {
                        console.log('followeesCollection loaded');
                        Session.set('followeesCollection', 'loaded');
                    }
                });
                Meteor.subscribe('postsWithLimit', Session.get('mypostsitemsLimit'), {
                    onReady: function(){
                        console.log('myPostsCollection loaded');
                        Meteor.setTimeout(function(){
                            Session.set('myPostsCollection','loaded');
                        },500);
                    }
                });

                Meteor.subscribe('readerpopularposts', {
                    onReady: function(){
                        //Session.set('momentsCollection','loaded');
                    }
                });
            }
        });
        Tracker.autorun(function(){
            if (Meteor.userId()){
                Meteor.subscribe('suggestPosts', 15, {
                    onReady: function(){
                        Session.set('momentsCollection','loaded');
                    }
                });

                Meteor.subscribe('associatedusers', {
                    onReady: function() {

                    }
                });
            }
        });

        // Tracker.autorun(function() {
        //     if(Meteor.isCordova) {
        //         Meteor.subscribe('versions');
        //     }
        // })
        Tracker.autorun(function() {
            if (Meteor.userId()) {
                if (Meteor.isCordova) {
                    console.log('Refresh Main Data Source when logon');
                    window.refreshMainDataSource();
                }
            }
        });
        Tracker.autorun(function() {
            if (Meteor.userId()) {
                Meteor.subscribe('authorPostsWithLimit',Session.get('seriesAuthorPostsLimit'),{
                    onReady: function(){
                        console.log('author publish posts loaded');
                        count = Posts.find({owner:Meteor.userId(),publish:{"$ne":false}}).count();
                        if (count < Session.get('seriesAuthorPostsLimit')) {
                            Session.set('authorPublishPostForSeries','loadedall');
                        }
                        else if(count === Session.get('seriesAuthorPostsCount')){
                            Session.set('authorPublishPostForSeries','loadedall');
                        } else {
                            Session.set('authorPublishPostForSeries','loaded');
                        }
                        console.log('count ==',count);
                        console.log('session count==', Session.get('seriesAuthorPostsCount'));
                        Session.set('seriesAuthorPostsCount',count)
                    },
                    onError: function(){
                        console.log('get author publish posts error');
                        count = Posts.find({owner:Meteor.userId(),publish:{"$ne":false}}).count();
                        Session.set('seriesAuthorPostsCount',count);
                        Session.set('authorPublishPostForSeries','loaded');
                    }
                });
            }
        });
    }
    Meteor.setTimeout(function(){
        Tracker.autorun(function(){
            if( Session.get("postContent") && Session.get("postContent")._id && Meteor.userId() && Session.get('postfriendsitemsLimit')){
                //Session.set('postfriendsCollection','loading')
                Meteor.subscribe('postFriendsV2', Meteor.userId(), Session.get("postContent")._id, Session.get('postfriendsitemsLimit'), {
                    onReady: function () {
                        console.log('postfriendsCollection loaded')
                        Session.set('postfriendsCollection', 'loaded')
                    }
                })
            }
        });
    },2000);

    Tracker.autorun(function() {
        if (Meteor.userId()) {/*
             if(withChat) {
             // 消息会话、最近联系人
             Meteor.subscribe("msgSession");
             //群信息
             Meteor.subscribe("msgGroup");
             }*/
            if(Session.get("postContent")){
                if(POST_ID !== Session.get("postContent")._id)
                {
                    POST_ID = Session.get("postContent")._id;
                    Session.set('momentsitemsLimit', MOMENTS_ITEMS_INCREMENT);
                }
                Meteor.subscribe('newDynamicMoments', Session.get("postContent")._id, Session.get('momentsitemsLimit'), {
                    onReady: function(){
                        console.log('momentsCollection loaded');
                        window.momentsCollection_getmore = 'done';
                        Session.set('momentsCollection','loaded');
                        Session.set('momentsCollection_getmore','done');
                    },
                    onError: function(){
                        console.log('momentsCollection Error');
                        window.momentsCollection_getmore = 'done';
                        Session.set('momentsCollection','loaded');
                        Session.set('momentsCollection_getmore','done');
                    }
                });
            }
        }
    });


    Tracker.autorun(function() {
        if (Meteor.userId()) {
            Meteor.subscribe('favouriteposts', Session.get('favouritepostsLimit'), {
                onReady: function(){
                    console.log('Favourite Posts Collection loaded');
                    window.favouritepostsCollection_getmore = 'done';
                    Session.set('favouritepostsCollection','loaded');
                    Session.set('favouritepostsCollection_getmore','done');
                },
                onError: function(){
                    console.log('Favourite Posts Collection Error');
                    window.favouritepostsCollection_getmore = 'done';
                    Session.set('favouritepostsCollection','loaded');
                    Session.set('favouritepostsCollection_getmore','done');
                }
            });
        }
    });

    Tracker.autorun(function() {
        if (Session.get("ProfileUserId1")) {
            Meteor.subscribe('userfavouriteposts', Session.get("ProfileUserId1"), Session.get('favouritepostsLimit1'), {
                onReady: function(){
                    console.log('Favourite Posts Collection loaded');
                    window.favouritepostsCollection1_getmore = 'done';
                    Session.set('favouritepostsCollection1','loaded');
                    Session.set('favouritepostsCollection1_getmore','done');
                },
                onError: function(){
                    console.log('Favourite Posts Collection Error');
                    window.favouritepostsCollection1_getmore = 'done';
                    Session.set('favouritepostsCollection1','loaded');
                    Session.set('favouritepostsCollection1_getmore','done');
                }
            });
        }
    });

    Tracker.autorun(function() {
        if (Session.get("ProfileUserId2")) {
            Meteor.subscribe('userfavouriteposts', Session.get("ProfileUserId2"), Session.get('favouritepostsLimit2'), {
                onReady: function(){
                    console.log('Favourite Posts Collection loaded');
                    window.favouritepostsCollection2_getmore = 'done';
                    Session.set('favouritepostsCollection2','loaded');
                    Session.set('favouritepostsCollection2_getmore','done');
                },
                onError: function(){
                    console.log('Favourite Posts Collection Error');
                    window.favouritepostsCollection2_getmore = 'done';
                    Session.set('favouritepostsCollection2','loaded');
                    Session.set('favouritepostsCollection2_getmore','done');
                }
            });
        }
    });

    Tracker.autorun(function() {
        if (Session.get("ProfileUserId3")) {
            Meteor.subscribe('userfavouriteposts', Session.get("ProfileUserId3"), Session.get('favouritepostsLimit3'), {
                onReady: function(){
                    console.log('Favourite Posts Collection loaded');
                    window.favouritepostsCollection3_getmore = 'done';
                    Session.set('favouritepostsCollection3','loaded');
                    Session.set('favouritepostsCollection3_getmore','done');
                },
                onError: function(){
                    console.log('Favourite Posts Collection Error');
                    window.favouritepostsCollection3_getmore = 'done';
                    Session.set('favouritepostsCollection3','loaded');
                    Session.set('favouritepostsCollection3_getmore','done');
                }
            });
        }
    });
    Tracker.autorun(function() {
        if (Session.get('storyListsType') === 'publishedStories') {
            Meteor.subscribe('userRecommendStory', Session.get('storyListsLimit'), {
                onReady: function(){
                    count = Posts.find({owner: Meteor.userId()}).count()
                    Session.set('storyListsCounts',count)
                    Session.set('storyListsLoaded',true)
                },
                onError: function(){
                    count = Posts.find({owner: Meteor.userId()}).count()
                    Session.set('storyListsCounts',count)
                    Session.set('storyListsLoaded',true)
                }
            });
        }
    });
}
