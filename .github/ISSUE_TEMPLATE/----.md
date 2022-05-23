---
name: 报告错误
about: 汇报一个错误以便于开发者解决和修复
title: ''
labels: ''
assignees: ''

---

环境
>MacOS 11.6 20G165 x86_64  
>Node.js v17.0.1

去掉敏感信息的日志
```
yarn run v1.22.17
$ node -r tsconfig-paths/register dist/main.js | bunyan -L
[2021-10-28T20:48:05.102+08:00] DEBUG: Auto Sign/65894 on Antares-Macbook.local: Loading School List...
[2021-10-28T20:48:05.311+08:00] DEBUG: Auto Sign/65894 on Antares-Macbook.local: Successfully Get 2888 Schools
[2021-10-28T20:48:05.311+08:00]  INFO: Auto Sign/65894 on Antares-Macbook.local: Initializing User 哈尔滨佛学院-这里是学号
[2021-10-28T20:48:05.311+08:00] ERROR: Auto Sign/65894 on Antares-Macbook.local: User 哈尔滨佛学院-这里是学号 initialization failed
[2021-10-28T20:48:05.312+08:00] ERROR: Auto Sign/65894 on Antares-Macbook.local: Could not find the school: 哈尔滨佛学院 
    Error: Could not find the school: 哈尔滨佛学院 
        at School.getSchoolItem (/Users/Antares/Repositories/campushoy-auto-sign/dist/school/school.js:28:19)
        at new School (/Users/Antares/Repositories/campushoy-auto-sign/dist/school/school.js:11:14)
        at User.init (/Users/Antares/Repositories/campushoy-auto-sign/dist/user/user.js:33:27)
        at App.start (/Users/Antares/Repositories/campushoy-auto-sign/dist/app.js:20:28)
        at processTicksAndRejections (node:internal/process/task_queues:96:5)
        at async bootstrap (/Users/Antares/Repositories/campushoy-auto-sign/dist/main.js:8:5)
✨  Done in 0.99s.
```

去掉敏感信息的 config.yaml
```yaml
users: #用户列表
  - school: 哈尔滨佛学院
    username: 这里是学号
    password: 这里是密码
    qq: 

login:
  retryTimes: 5
  captcha:
    enable: false
    pdId:
    pdKey: 

noticer:
  enable: false
  qq:
  password: 

logLevel: debug
```

描述：

我使用APP可以找到我的学校  
但脚本无法找到我的学校  
我的学校是：哈尔滨佛学院
