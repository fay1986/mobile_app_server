/**
 * Created by simba on 6/6/17.
 */

if(Meteor.isClient){
    initLoadMoreForListPosts = function(){
        var sl = new Scrollload({
            // container 和 content 两个配置的默认取的scrollload-container和scrollload-content类的dom。只要你按照以上的dom结构写，这两个配置是可以省略的
            container: document.querySelector('.home #wrapper'),
            content: document.querySelector('.home #list'),
            loadMore: function(sl) {
                // 没有数据的时候需要调用noMoreData
                //sl.noMoreData()
                //return
                toLoadFollowPost()
                console.log('Call toLoadFollowPost in Scrolllad');
                Deps.autorun(function(h){
                    if(Session.equals('followPostsCollection','loaded')){
                        h.stop()
                        sl.unLock()
                    }
                })
                // 加载出错，需要执行该方法。这样底部DOM会出现出现异常的样式。
                //sl.throwException()
            },
            // 你也可以关闭下拉刷新
            enablePullRefresh: false,
            /*pullRefresh: function (sl) {
                toLoadLatestFollowPost(function(result){
                    sl.refreshComplete()
                })
            }*/
        })
    }
}