# campushoy-auto-sign
今日校园自动签到

## 运行环境
 nodejs 14+

## 部署指南
教程基于类UNIX操作系统，Windows操作系统请自行替换相关命令。

请确保安装好了 nodejs 和 yarn

```bash
git clone https://github.com/AntaresQAQ/campushoy-auto-sign.git
cd campushoy-auto-sign
yarn
yarn build
```
等待依赖包安装完成，如果速度过慢请酌情更换镜像源

复制一份模板配置文件

```bash
cp config-example.yaml config.yaml
```

编辑文件`config.yaml`，样例如下：

```yaml
users: #用户列表
  - school: # 用户1 学校名称
    username: # 用户1 用户名，必须是一个字符串，如果是数字学号请使用''或""
    password: # 用户1 密码，必须是一个字符串
    qq: # 用户2 推送QQ号，一个数字，选填

  - school: # 用户2 学校名称
    username: # 用户2 用户名
    password: # 用户2 密码
    qq: # 用户2 推送QQ号

login:
  retryTimes: 5 # 登录重试次数
  captcha: # 自动打码
    enable: false # 必须是 true 或 false
    pdId:  # 请前往 http://www.fateadm.com 获取，选填
    pdKey: # 请前往 http://www.fateadm.com 获取，选填

noticer: # QQ消息推送
  enable: false # 必须是 true 或 false
  qq: # 负责推送消息的QQ号，一个数字，选填
  password: # 负责推送消息的QQ密码，一个字符串，选填

logLevel: info # 日志级别 debug/info/warn/error
```

完成后，执行

```bash
yarn start
```

程序会根据你今日校园的信息收集表在`tasks`目录下生成对应每个用户的配置文件`<school_name>-<user_name>.yaml`

生成的表单模板类似这样：

```yaml
tasks:
  - enable: true
    titleRegex: '\d+月\d+日体温监测和定位签到' # 匹配任务名的正则表达式
    cron: 0 13 23 * * * # cron规则
    address: 'xx省xx市xx区xx路'
    position:
      latitude: 0.1234 # 纬度
      longitude: 5.6789 # 经度
    abnormalReason: '' # 异常原因，可不填
    needPhoto: false # 是否需要照片，无需修改
    photoPath: '' # 如果 needPhoto 为 true 则需要填写图片的绝对路径
    needExtra: true # 是否需要附加问题，无需修改
    extraFields: # 如果 needExtra 为 true 则需要填写以下表单
      - title: 你今天上午的体温是
        hasOther: true # 是否有其它选项
        answer: '36.5' # 填写下面的选项，如果 hasOther 为 true 可以按需填写
        options:
          - 其它
      - title: 你今天下午的体温是
        hasOther: true # 是否有其它选项
        answer: '36.5' # 填写下面的选项，如果 hasOther 为 true 可以按需填写
        options:
          - 其它
      - title: 近14天你是否有过以下情况
        hasOther: false # 是否有其它选项
        answer: 没有以上三种情况 # 填写下面的选项，如果 hasOther 为 true 可以按需填写
        options:
          - 接触过新冠肺炎病例、疑似病例、无症状感染者
          - 接触过境外返回人士
          - 接触过中高风险区人士
          - 没有以上三种情况
      - title: 目前你所在位置或校区
        hasOther: false # 是否有其它选项
        answer: B校区
        options:
          - 在校外
          - A校区
          - B校区
          - C校区

```
请按照实际需求填写表单配置文件，如果不会填写cron规则，可以使用 <https://www.bejson.com/othertools/cron/> 来生成

填写好以后重新执行：

```bash
yarn start
```

程序开始运行。

# Q&A

### 如何后台运行

建议使用screen运行

```bash
screen -S sign
```

在新的终端内执行

```bash
yarn start
```

按下<kbd>Ctrl</kbd>+<kbd>A</kbd>后，按<kbd>D</kbd>即可将终端切后台运行。

执行 `screen -r sign` 可再次进入。

### 推送QQ配置

正确填写推送QQ的相关配置后，执行：

```bash
yarn start
```

如果需要登陆验证，日志会输出一个url，打开即可扫码。

扫码后重新运行程序即可。

### 配置文件错误

1. 检查配置文件是否有漏项。
2. 检查类型是否一致，纯数字字符串务必使用`''`或`""`

### 没有按时运行

1. 请检查cron填写是否正确
2. 请检查电脑时间是否正确，时区在调整为东八区
3. 尝试重启进程

### 表单提交失败

1. 检查所有必填项是否已经填写
2. 检查是否打开了选填项开关但是未填写
3. 正确填写了经纬度和位置
4. 检查表单一致性，不一致请重新生成表单

### Error:  Require Enable Captcha Identify
- **解决方案一：**  
  配置好验证码识别

- **解决方案二：**  
  在`config.yaml`中修改`logLevel`为`debug`  
  在输出的日志内得到学校的登陆链接  
  浏览器打开链接输入验证码登陆一次


## Issues
### 准备
请在`config.yaml`中修改`logLevel`为`debug`

### 模板
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
