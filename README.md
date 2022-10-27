# Campushoy Auto Sign
今日校园自动签到

目前仅支持以 CLOUD 方式接入的学校

**本项目仅供学习用途，禁止用于任何违法行为，因违规使用造成一切不良后果由用户自行负责，与本作者无关。**

## 运行环境
[Node.js](https://nodejs.org) 16+

## 部署指南

### 本地构建

教程基于类UNIX操作系统，Windows操作系统请自行替换相关命令。

请确保安装好了 [Node.js](https://nodejs.org/zh-cn/download/) 和 [Yarn](https://yarn.bootcss.com/docs/install)

对于服务器位于中国大陆的用户，建议使用下面的命令更换更换镜像源
```bash
yarn config set registry https://registry.npm.taobao.org
```

执行以下命令
```bash
git clone https://github.com/AntaresQAQ/campushoy-auto-sign.git
cd campushoy-auto-sign
yarn
yarn build
```
等待依赖包安装完成

<a name="mkcfg"></a>复制一份模板配置文件

```bash
cp config-example.yaml config.yaml
```

编辑文件`config.yaml`，样例如下：

```yaml
users: #用户列表
  - school: # 用户1 学校名称
    username: # 用户1 用户名，一个字符串
    password: # 用户1 密码，一个字符串
    qq: # 用户2 接收推送QQ号，一个数字，选填

  - school: # 用户2 格式同上，没有请删掉，但不可留空
    username:
    password:
    qq:

login:
  retryTimes: 5 # 登录重试次数，必须是大于0的数字
  captcha: # 自动打码
    enable: false # 必须是 true 或 false
    pdId:  # 请前往 http://www.fateadm.com 获取，一个字符串，选填
    pdKey: # 请前往 http://www.fateadm.com 获取，一个字符串，选填

noticer: # QQ消息推送
  enable: false # 必须是 true 或 false
  qq: # 负责推送消息的QQ号，一个数字，选填
  password: # 负责推送消息的QQ密码，一个字符串，选填

proxy: http://username:password@127.0.0.1:8080 # 代理，一个URL，支持http或https，选填

logLevel: info # 日志级别 debug/info/warn/error
```

完成后，执行

```bash
yarn start
```

程序会根据你今日校园的信息收集表在`tasks`目录下生成对应每个用户的配置文件`<school_name>-<user_name>.yaml`

<a name="mktsk"></a>生成的表单模板类似这样：

```yaml
tasks:
  - enable: true
    titleRegex: '\d+月\d+日体温监测和定位签到' # 匹配任务名的正则表达式
    cron: 10 0 12 * * ? # 不带年的cron规则，每天 12:00:10 执行
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
请按照实际需求填写表单配置文件，如果不会填写cron规则，可以使用 <https://cron.qqe2.com/> 来生成，不要填写年（去掉最后一项）

关于经纬度，要填写 [**BD-09坐标系**](https://lbsyun.baidu.com/index.php?title=coordinate) 的坐标，可以从百度提供的 [拾取坐标系统](https://api.map.baidu.com/lbsapi/getpoint/index.html) 获取，坐标尽量精确。

填写好以后重新执行：

```bash
yarn start
```

程序开始运行。

### 使用Docker

项目提供一个docker公共镜像，也可根据`Dockerfile`自行构建。

这里提供公共镜像使用指南。

请确保安装好Docker，以ubuntu为例，执行`apt install docker.io`即可安装。

```bash
docker pull antaresqaq/campushoy-auto-sign:current
```

在宿主机准备好`config.yaml`和`tasks`文件夹，`config.yaml`填写方式见[本地构建](#mkcfg),`tasks`留空即可。

```bash
docker run -d --name auto-sign \
           -v /path/to/config.yaml:/app/config.yaml \
           -v /path/to/tasks:/app/tasks \
      antaresqaq/campushoy-auto-sign:current
```

PS: 如果使用了消息推送，你可能需要检查docker日志获取验证链接完成设备认证.

完成`tasks`文件夹内的配置，填写方式见[本地构建](#mktsk)。

完成后执行以下命令重启容器即可。

```bash
docker restart auto-sign
```

### 自行构建Docker容器

先执行 `yarn build` 编译 TypeScript，然后执行 `docker build` 命令。

```bash
git clone https://github.com/AntaresQAQ/campushoy-auto-sign.git
cd campushoy-auto-sign
yarn
yarn build
docker build --tag yourname/campushoy-auto-sign:current .
```

## Q&A

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
2. 检查类型是否一致，纯数字字符串务必使用`''`或`""`。

### 没有按时运行

1. 请检查cron填写是否正确，必须是不带年份的合法规则
2. 请检查电脑时间是否正确，时区在调整为东八区
3. 尝试重启进程

### 表单提交失败

1. 检查所有必填项是否已经填写
2. 检查是否打开了选填项开关但是未填写
3. 正确填写了**BD-09坐标系**经纬度和位置
4. 检查表单一致性，不一致请重新生成表单

### Error:  Require Enable Captcha Identify
- **解决方案一：**  
  去[斐斐打码](http://www.fateadm.com)注册账号获取ID和KEY  
  在`config.yaml`中配置好验证码识别

- **解决方案二：**  
  在`config.yaml`中修改`logLevel`为`debug`  
  在输出的日志内得到学校的登录链接  
  浏览器打开链接输入验证码登录一次

### HTTP ERROR CODE 418
原因：目前推测是IP地址被今日校园加入了黑名单，解决方案如下：
- 方案一：使用代理
- 方案二：换一个IP

### 设置环境变量代理后出现400
axios的bug，目前通过其他方式绕过，请拉取最新代码并重新构建运行。 
最新版本会忽略系统环境变量代理，并以`config.yaml`内代理设置作为唯一依据。

## 提出 Issues
### 准备
请在`config.yaml`中修改`logLevel`为`debug`

### 模板
请您**严格按照模板**填写您遇到的问题。
