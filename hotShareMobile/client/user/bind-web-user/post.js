var view = null;
Template.bindWebUserPost.open = function(msg){
  if(view)
    Blaze.remove(view);
  view = Blaze.renderWithData(Template.bindWebUserPost, {msgs: msg}, document.body);
  
  var $html = $('.bind-web-user-post');
  $html.find('._mask').click(function(){
    Template.bindWebUserPost.close();
  });
  $html.find('.btn-post').click(function(){
    Template.bindWebUserPost.close();
  });
  $html.find('.btn-msg').click(function(){
    Template.bindWebUserPost.close();
    Router.go('/bell');
  });
  $html.find('._imgs img').click(function(){
    var img_url = $(this).attr('src');
    var selected = 0;
    var $img = $(this).parent();
    var imgs = [];
    var index = 0;
    $img.find('img').each(function(){
      if($(this).attr('src') == img_url)
        selected = index;
      imgs.push({href: $(this).attr('src')});
      index += 1;
    });
    console.log('imgs:', imgs);
    $.swipebox(imgs, {
      initialIndexOnArray: selected,
      hideCloseButtonOnMobile: true,
      loopAtEnd: false
    });
  });
};
Template.bindWebUserPost.close = function(){
  if(view)
    Blaze.remove(view);
  view = null;
};

Template.bindWebUserPost.helpers({
  time_diff_str: function(created){
    return GetTime0(new Date() - new Date(created));
  }
});