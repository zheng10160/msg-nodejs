

 module.exports = {
    "msg_write_log_path":'/home/www/',//错误日志地址
 	"appname": "senseplay:",//redis 前缀
     "local_userinfo_key":'global_node_userinfo:',//本地缓存用户登陆access_token
     "CLIENT_KEY":"F851C75F9F55610C2C321F1AC167B9CA",//系统颁发的key值
     "http_oauth_url":"test.auth.senseplay.com",//oauth服务器
     "http_account_url":"test.account.senseplay.com",//passport服务器
    //redis key start
     "msg_log_to_user_list":"msg_log_to_user_list:",//用户聊天的历史列表redis 键
     "msg_list_log":'msg_list_log',//消息队列 相当于备份 数据会被同步到db
     "msg_log_key":"msg_all_log:",//历史消息log 键  占存取消息绘本合并到这里
     "msg_to_user_key":'msg_receiver_user_key:',//接收者的key  推送消息时指定别人的userid 消息占存取消息占存取 会被合并到历史记录log中
     "subscribeRoomId":'gameAppId',//整个游戏的房间号 所有人都能看到
     "chat_log_hint":"chat_log_hint:",//每个用户的消息提示存储
     "redis_config":{
      "redis_host":'192.168.99.62',//主机
      "redis_pwd":'123456',//密码
      "redis_db":5//当前索引库
     }
 };