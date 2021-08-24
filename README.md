# campushoy-auto-sign
今日校园自动签到

# 运行环境
 nodejs 14+

# 部署指南
请确保安装好了 nodejs 和 yarn
```bash
git clone https://github.com/AntaresQAQ/campushoy-auto-sign.git
cd campushoy-auto-submit
yarn
```
等待依赖包安装完成，如果速度过慢请酌情更换镜像源

```bash
yarn start
```

如果环境配置正确，应该会有如下输出：
```
[xxxx-xx-xx xx:xx:xx][WARNING]: 配置文件已生成，请完成 config.yaml
```

编辑文件`config.yaml`，样例如下：
```yaml
login:
  retry_times: 5 # 登录重试次数

users: #用户列表
  - school_name: # 用户1 学校名称
    username: # 用户1 用户名
    password: # 用户1 密码
    cron: 0 30 8 * * * # 用户1 计划任务规则
    qq: # 用户2 推送QQ号

  - school_name: # 用户2 学校名称
    username: # 用户2 用户名
    password: # 用户2 密码
    cron: 0 0 9 * * * # 用户2 计划任务规则
    qq: # 用户2 推送QQ号

noticer:
  enable: false
  secret_key: # Qmsg酱密钥，请前往 https://qmsg.zendee.cn/ 登录后获取

captcha: # 自动打码
  enable: false
  pd_id: # 请前往 http://www.fateadm.com 获取
  pd_key: # 请前往 http://www.fateadm.com 获取

log_level: info # 日志级别 debug/info/warning/error
```

如果不会填写cron规则，可以使用 <https://www.bejson.com/othertools/cron/> 来生成

完成后，再次执行

```bash
yarn start
```
此时输出如下：
```
[xxxx-xx-xx xx:xx:xx][WARNING]: 表单配置文件已生成，请完成 <school_name>-<user_name>.yaml
```
程序会根据你今日校园的信息收集表在`forms`目录下生成对应每个用户的配置文件`<school_name>-<user_name>.yaml`

生成的表单模板类似这样：
```yaml
- title: 每日健康监测及定位签到
  enable: true
  address: '' # 位置信息 
  position: # 填写经纬度
    lon: 0.0
    lat: 0.0
  abnormal_reason: '' # 异常原因，可不填
  need_photo: false # 是否需要照片
  photo_url: '' # 如果 need_photo 为 true 则需要填写图片地址
  need_extra: true # 是否需要附加问题
  extra_fields: # 如果 need_extra 为 true 则需要填写以下表单
    - title: 你的身体健康状况是否正常 # 问题
      options: # 选项
        - 是
        - 否
      answer: 是 # 请填写选项上的答案
    - title: 近14天你是否有过以下情况
      options:
        - 接触过新冠肺炎病例、疑似病例、无症状感染者
        - 接触过境外返回人士
        - 接触过中高风险区人士
        - 没有以上三种情况
      answer: 没有以上三种情况
```

请按照实际需求填写好表单配置文件，执行：

```bash
yarn start
```

程序开始运行。

## Q&A

### 如何后台运行

建议使用screen运行

```bash
screen -S jrxy
```

在新的终端内执行

```bash
yarn start
```

按下<kbd>Ctrl</kbd>+<kbd>A</kbd>后，按<kbd>D</kbd>即可将终端切后台运行。

### 没有按时运行

1. 请检查cron填写是否正确
2. 请检查电脑时间是否正确，时区在调整为东八区
3. 尝试重启进程

### 表单提交失败

1. 检查所有必填项是否已经填写
2. 检查是否打开了选填项开关但是未填写
3. 正确填写了经纬度和位置
4. 检查表单一致性，不一致请重新生成表单

