if(Meteor.isClient){
  window.showQrTips = function(touserId,dashboard,postId){
    if($('.wr-page')){
      $('.wr-page').remove();
    }
    return Blaze.renderWithData(Template.qrcodeTipPage, {
      touserId: touserId,
      dashboard:dashboard,
      postId:postId
    },document.body);
  };
  // 从 canvas 提取图片 image  
  var convertCanvasToImage = function(canvas) {  
    var image = document.getElementById('qrcodeImg');
    return image.src = canvas.toDataURL("image/png");
  };

  var drawQr2Canvas = function(canvas,text1,text2,touserId,dashboard,postId) {
    var ctx = canvas.getContext("2d");
    // var cH = document.body.clientHeight;
    var cW = document.body.clientWidth;
    var cH = cW * 1.2;
    $('.qr-foot').css('max-height',(document.body.clientHeight-cH-10)+'px');
    qrCodeUrl = 'http://'+server_domain_name+'/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId='+touserId+'&p='+dashboard+'&postId='+postId;
    // qrCodeUrl = '/restapi/webuser-qrcode?userId='+Meteor.userId()+'&touserId='+touserId+'&p='+dashboard+'&postId='+postId;

    canvas.height = cH;
    canvas.width = cW;

    ctx.rect(0,0,cW,cH);
    ctx.fillStyle="white";
    ctx.fill();
    ctx.fillStyle="rgb(241,86,113)";
    ctx.font = "16px Arial";
    ctx.textAlign="center";
    ctx.fillText(text1,parseInt(cW*0.5),parseInt(cH*0.9));
    ctx.fillText(text2,parseInt(cW*0.5),parseInt(cH*0.9+30));

    var qrTip1 = document.getElementById('qrTip1');
    var qrTip2 = document.getElementById('qrTip2');
    var count = 0;
    if(qrTip2.complete){
      ctx.drawImage(qrTip1,10,20,50,56);
      convertCanvasToImage(canvas);
    } else {
      qrTip1.onload =function(){ 
        ctx.drawImage(qrTip1,10,20,50,56);
        convertCanvasToImage(canvas);
      }
    }
    if(qrTip2.complete){
      ctx.drawImage(qrTip2,parseInt(cW*0.1),60,parseInt(cW*0.8),parseInt(cW*0.8));
      convertCanvasToImage(canvas);
    } else {
      qrTip2.onload =function(){ 
        ctx.drawImage(qrTip2,parseInt(cW*0.1),60,parseInt(cW*0.8),parseInt(cW*0.8));
        convertCanvasToImage(canvas);
      }
    }
    var qrImage = new Image();
    qrImage.src = qrCodeUrl;
    if(qrImage.complete){
      ctx.drawImage(qrImage,parseInt(cW*0.2),100,parseInt(cW*0.6),parseInt(cW*0.6));
      convertCanvasToImage(canvas);
    } else {
      qrImage.onload =function(){
        ctx.drawImage(qrImage,parseInt(cW*0.2),100,parseInt(cW*0.6),parseInt(cW*0.6));
        convertCanvasToImage(canvas);
      }
    }
  };

}

Template.qrcodeTipPage.onRendered(function () {
  window.qrCodeUrl = null;
  var canvas = document.getElementById('qrCanvas');
  var text1 = "保存这个二维码到系统相册";
  var text2 = "在APP中导入二维码，才能查看消息哦~";
  var data = this.data;
  drawQr2Canvas(canvas,text1,text2,data.touserId,data.dashboard,data.postId);

  // 消息转存
  var msgs = SimpleChat.Messages.find({is_read:false, 'to.id': Meteor.userId()}).fetch();
  Meteor.subscribe('webwaitreadmsg',Meteor.userId(),function(){
    var waitReadMsg = WebWaitReadMsg.findOne({_id: Meteor.userId()});
    if(waitReadMsg){
      msgs = waitReadMsg.messages.concat(msgs);
      WebWaitReadMsg.update({_id: Meteor.userId()},{$set:{qrcode: qrCodeUrl,messages:msgs}},function(err,num){
        if(err){
          console.log(err)
        }
      });
    } else {
      WebWaitReadMsg.insert({_id: Meteor.userId(),qrcode: qrCodeUrl,messages:msgs},function(err,_id){
        if(err){
          console.log(err)
        }
      });
    }
  });

  // 移除未读消息
  SimpleChat.Messages.remove({is_read:false,'to.id': Meteor.userId()},function(err,num){
    if(err){
      console.log(err)
    }
  });
});

Template.qrcodeTipPage.events({
  'click .close':function(){
    $('.qr-page').remove();
    qrCodeUrl = null;
  }
});

Template.qrcodeTipPage.onDestroyed(function () {
  qrCodeUrl = null;
});