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
  }
});

Template.bellPostTips.events({
  'click .msg-box': function(){
    trackEvent("blkMsgBox", "clickBlkMsgBox");
    Session.set('showBellPostTips',false);
    Meteor.call('updataFeedsWithMe', Meteor.userId());
    if(withQRTips){
      return showQrTips('','message',Session.get('postContent')._id);
    }else{
      Router.go('/bell');
    }
  }
});
