var loading = function(text, time){
  var obj = new Object();
  var timeout = null;
  var $loading = $('.simple-loading-v1');
  
  obj.close = function(){
    if(timeout)
      clearTimeout(timeout);
    $('.simple-loading-v1').remove();
  };

  if ($loading.length > 0)
    $loading.find('.simple-loading-text').html(text);
  else
    $('body').append('\
      <div class="simple-loading-v1">\
        <div style="position: fixed;left: 0;right: 0;bottom: 0;top: 0;z-index: 998;"></div>\
        <div style="position: fixed;left: 50%;top: 50%;width: 120px;height: 100px;background-color: rgba(0, 0, 0, 0.72);border-radius: 5px;margin-left: -60px;margin-top: -50px;text-align: center;padding: 15px;box-sizing: border-box;">\
          <i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>\
          <div class="simple-loading-text" style="padding-top: 10px;overflow: hidden;white-space: nowrap;">'+text+'</div>\
        </div>\
      </div>\
    ');

  if(time)
    timeout = setTimeout(function(){
      timeout = null;
      obj.close();
    }, time);

  return obj;
}

$.loading = function(text, time){
  return new loading(text, time);
};