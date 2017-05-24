# 环境配置
使用之前确认安装了node 

# 如何使用

1. 进入`story_command_push` 目录 然后`npm install`
2. 修改`run_local.sh`文件：
```bash
POST_ID='5924e23ca7bfa6002900516f' \ # 帖子id
POST_TITLE='这个世界糟糕透了，真的吗？_张佳玮_腾讯大家' \ # 帖子标题
POST_AUTHOR='workai' \  # 帖子作者
POST_COMMAND_TEXT='用另一种眼光看世界' \  # 故事贴小秘推荐语
```

3. 在`story_command_push` 目录下运行`run_local.sh`文件
```bash
$ ./run_local.sh # 按ctrl + c 可结束发送
```

4. 指定要发送的平台
```
如果需要向ios或android单独发送
在run_local.sh中到数第2行添加'PLAT_FORM='iOS' \ '
iOS : iPhone,
JPush: Android
```