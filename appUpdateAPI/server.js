var http = require('http');
var port = 18080;
var versionInfo = {
    latest_ios: '1.5.38', // 建议升级版本号
    stable_ios: '1.5.30',  // 强制升级版本号
    latest_android: '1.5.38',
    stable_android: '1.5.30',
    latest_release_ios: '1. 解决 首页关注相关的显示问题。\n2. 私信图片样式优化（同微信）\n3. 修复首页有数据后还会显示加载中\n4.  修复首页不自动刷新贴子的BUG\n5. 修复从草稿中编辑后无法发表。\n6. 修正：赞、踩、评论为我发出的私信时指示器样式\n7. 段落取消赞或取消踩时不发送私信消息',
    latest_release_android:'1. 解决 首页关注相关的显示问题。\n2. 私信图片样式优化（同微信）\n3. 修复首页有数据后还会显示加载中\n4.  修复首页不自动刷新贴子的BUG\n5. 修复从草稿中编辑后无法发表。\n6. 修正：赞、踩、评论为我发出的私信时指示器样式\n7. 段落取消赞或取消踩时不发送私信消息',
    stable_release_ios:'1. 解决 首页关注相关的显示问题。\n2. 私信图片样式优化（同微信）\n3. 修复首页有数据后还会显示加载中\n4.  修复首页不自动刷新贴子的BUG\n5. 修复从草稿中编辑后无法发表。\n6. 修正：赞、踩、评论为我发出的私信时指示器样式\n7. 段落取消赞或取消踩时不发送私信消息',
    stable_release_android:'1. 解决 首页关注相关的显示问题。\n2. 私信图片样式优化（同微信）\n3. 修复首页有数据后还会显示加载中\n4.  修复首页不自动刷新贴子的BUG\n5. 修复从草稿中编辑后无法发表。\n6. 修正：赞、踩、评论为我发出的私信时指示器样式\n7. 段落取消赞或取消踩时不发送私信消息',

    latest_times: 1, // 建议升级提醒频率

    stable_title:'升级到新版本',
    latest_title:'更新内容',
    stable_styles: {
        bgimg:'http://data.tiegushi.com/versions/bg.png',
        bg:'background: url(http://data.tiegushi.com/versions/bg.png) no-repeat center 100%;background-size: cover;',
        box: 'text-align: center;top: auto;transform: none;left: 10%;bottom: 40px;background: none;',
        head: 'font-size:24px;',
        body: 'text-align: center;height: 50%;min-height: 160px;',
        foot:'',
        upbtn:'color: #fff;border-radius: 6px; width: 100%; background: #1a78d7;margin:0; height:48px;line-height:48px;',
        laterbtn:''
    },
    latest_styles: {
        bgimg:'http://data.tiegushi.com/versions/bg2.png',
        bg:'',
        box: 'background: url(http://data.tiegushi.com/versions/bg2.png) no-repeat;background-size: cover;max-width: 320px;',
        head: 'margin-top: 112px;text-align: left;position: absolute;left: 24px;height: 30px;line-height: 30px;',
        body: 'margin: 10px 30px;margin-top: 126px;height: 140px;border: 1px dotted #000000;border-image: url(http://data.tiegushi.com/versions/border.png) 4; border-width: 2px;padding: 10px;',
        foot:'',
        upbtn:'color: #fff;background: #1a78d7;border-radius: 16px;',
        laterbtn:'border: none;'
    }
}
http.createServer(function(req, res) {
    // var reqOrigin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin','*');
    res.writeHead(200, {'Content-Type': 'application/json;charset=UTF-8'});
    res.end(JSON.stringify(versionInfo));
}).listen(port);
