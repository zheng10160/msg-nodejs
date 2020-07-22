/**
 * Created by localuser1 on 2018/11/12.
 */
module.exports = {
    port:3000,//服务监听端口
    redis:{
        port:6379,
        host:'106.75.122.206',
        auth:'HelloSenseThink'
    },
    prefix:'game_api:',//该项目所有redis存储的总前缀
    game_people_count:4,//当局游戏上限人数
    cookie_userid_key: 'game_userid_info',//cookie缓存用户的userid的键
    http_oauth_url:"test.auth.senseplay.com",//oauth服务器 用户授权信息
    //redis 缓存的消息数据
    global_msg_key:'global_msg_key',//公开消息key
    group_msg_key:'group_msg_key',//组消息key
    private_msg_key:'private_msg_key',//私有消息key
    game_app_key:'global_game_app_key:',//用户登陆成功后缓存的键 前缀
    game_app_message_count_hash_key:'socket_global_message_count_hash_key',//消息计数器
};
