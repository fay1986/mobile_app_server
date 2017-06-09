var renderPage = function(){
  // Meteor.setTimeout(function(){
  //   var $box = $('.show-post-new-message');
  //   var $wrapper = $('#wrapper');
  //   var $gridster = $('.gridster');
  //   var $span = $('.bell-post-tips-span');
  //   var $test = $('.gridster #test');
  //   var $post_abstract = $('.post_abstract');

  //   console.log('render post-tips:', $box.length > 0 ? 'show' : 'hide');
  //   if($box.length > 0){
  //     $box.css('top', (($post_abstract.length > 0 ? $post_abstract.height() + $wrapper.height() : $wrapper.height()) + 50) + 'px');
  //     $span.css('height', '70px');
  //     $test.css({
  //       'position': 'position',
  //       'top': '70px'
  //     });
  //   }else{
  //     $span.css('height', '0px');
  //     $test.css({
  //       'position': 'position',
  //       'top': '0px'
  //     });
  //   }
  // }, 300);
};

Session.setDefault("TEST_AAA", true);
Session.setDefault('showBellPostTips',true);
Template.bellPostTips.helpers({
  hasNew: function(){
    var feedsCount = Template.bellPostTips.__helpers.get('feedsCount')();
    var showBellPostTips = Session.get('showBellPostTips');
    // var imageMarginPixel=5;
    // var $test = $('.gridster #test');
    // var test = $('.gridster #test')[0];
    // if (test == undefined || test == null)
    //   return false;
    // var firstChild = $('.gridster #test .element').first()[0];
    // console.log("feedsCount = "+feedsCount);
    // if (firstChild && firstChild.style && test.style) {
    //     if (feedsCount > 0) {
    //         if ($test && (parseInt(firstChild.style.top) <= test.offsetTop+imageMarginPixel)) {
    //             $test.children('.element').each(function () {
    //                 if (this.style && this.style.top) {
    //                     if (this.style.top.indexOf('px') >= 0) {
    //                         this.style.top = (parseInt(this.style.top)+65).toString() + 'px';
    //                     }
    //                 }
    //             });
    //             test.style.height = (parseInt(test.style.height)+65).toString() + 'px';
    //         }
    //     } else {
    //         if ($test && (parseInt(firstChild.style.top) > test.offsetTop+imageMarginPixel)) {
    //             $test.children('.element').each(function () {
    //                 if (this.style && this.style.top) {
    //                     if (this.style.top.indexOf('px') >= 0) {
    //                         this.style.top = (parseInt(this.style.top)-65).toString() + 'px';
    //                     }
    //                 }
    //             });
    //             test.style.height = (parseInt(test.style.height)-65).toString() + 'px';
    //         }
    //     }
    // }
    // return feedsCount > 0 && showBellPostTips;
    return feedsCount > 0
  },
  feedsCount: function(){

    // return Feeds.find({followby: Meteor.userId(), isRead:{$ne: true}, checked:{$ne: true}}).count();
    return SimpleChat.Messages.find({'to.id':Meteor.userId(),is_read:false}).count();
  },
  lsatFeed: function(){
    return Feeds.findOne({followby: Meteor.userId(), isRead:{$ne: true}, checked:{$ne: true}}, {sort: {createdAt: -1}});
  },
  lastIcon: function(){
    var lastMsg = SimpleChat.Messages.findOne({'to.id':Meteor.userId(),is_read:false},{sort:{create_time:-1}});
    if(lastMsg && lastMsg.form && lastMsg.form.icon){
      return lastMsg.form.icon
    } else {
      return '/userPicture.png'
    }
  },
  onLoadData: function(){
    renderPage();
  },
  associatedUserName: function(){
    var user = Meteor.user();
    if(user && user.profile && user.profile.associated && user.profile.associated[0] && user.profile.associated[0].name){
      return user.profile.associated[0].name;
    }
    return '';
  }
});

Template.bellPostTips.events({
  'click .msg-box': function(){
    trackEvent("blkMsgBox", "clickBlkMsgBox");
    Session.set('showBellPostTips',false);
    Meteor.call('updataFeedsWithMe', Meteor.userId());
    var user = Meteor.user();
    if(withQRTips){
      if(user && user.profile && user.profile.associated && user.profile.associated.length > 0){
        return $('#bellPostDialog').fadeIn();
      }
      return showQrTips('','post',Session.get('postContent')._id);
    }else{
      Router.go('/bell');
    }
  },
  'click #closeBellPostDialog': function(){
    // 移除未读消息
    SimpleChat.Messages.remove({is_read:false,'to.id': Meteor.userId()},function(err,num){
      if(err){
        console.log(err)
      }
    });
    $('#bellPostDialog').fadeOut();
  }
});
