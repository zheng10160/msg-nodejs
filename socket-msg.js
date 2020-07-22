/**
 * Created by localuser1 on 2018/11/12.
 */

const game_config = require('./conf/socket-config');//加载配置文件

const redisClient = require('./libraries/redis_conn');//加载redis连接实例

const helper = require('./libraries/helper');

const log = require('./libraries/log');//加载redis连接实例

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server);

//redis 选择索引库
redisClient.select(6,function(err){
    if(err){
        log.write_log('socket-log','redis db error');
    }
});



//目前逻辑都比较简单 完成最基本的功能为主
//目前所有消息处理逻辑为 先读取消息队列 ，用户上线会把消息队列的消息读取到每个用户的缓存当中，用户重自己的缓存消息中读取消息处理
/**
 * 功能分析
 * 1.当 php端接口推送消息到 node服务端时，服务端需要通知客户端有新消息，需要更新当前页面的显示状态，服务端无法知道哪些用户在线，所以只能让用户自己去垃取相关消息
 * 2.当node服务端收到新消息时，服务端什么都不处理，只会通知客户端有新新消息，让客户端自己发送请求事件来垃取新的消息，整个流程对用户是无感知的
 */
io.on('connection', function (socket){

    /**************************************客户端登陆验证 start*************************************/
    socket.on('is_login',function (info) {
        var global_userinfo_key = game_config.game_app_key + 'user_key:' + info.access_token;//redis 键

        socket.client_id = info.client_id;//client_id
        socket.access_token = info.access_token;//登陆的唯一凭证

        redisClient.get(global_userinfo_key,function(err,response){

            if(!response){
                var http = require('http');
                var qs = require('querystring');
                //组装数据
                var bodystr = {
                    'client_id':info.client_id,
                    'access_token':info.access_token
                }
                var headers = {
                    'Content-type':'application/x-www-form-urlencoded',
                    'Content-Length':qs.stringify(bodystr).length
                }
                //发送服务端 验证access_token有效性
                var opt = {
                    method:"POST",
                    host:config.http_oauth_url,
                    port:80,
                    path:"/auth/check_userinfo",
                    headers:headers
                }
                //发起请求
                var req = http.request(opt,function(res){
                    res.setEncoding('utf-8');//设置字符集
                    res.on('data',function(data){
                        console.log('-------');
                        console.log(data);
                        var data = JSON.parse(data);
                        if(data.code == 0){
                            console.log('mmm');
                            //建立本地用户信息存储 保持登陆状态
                            var set_data= {
                                'userid':data.data.user_id,//passport 的唯一用户id
                                'username':data.data.nickname,//昵称
                                'sex':data.data.sex,//性别
                                'avatar':data.data.avatar,//头像
                                'access_token':data.data.access_token//token
                            }//需要存储的数据
                            //严格注意 多个值 直接转字符串 ，拿出来的时候 JSON.parse转下
                            redisClient.set(global_userinfo_key,JSON.stringify(set_data),function(err,response){
                                console.log('test---');
                                if(response){
                                    //设置该值的有效期 30分钟
                                    redisClient.expire(global_userinfo_key,1800);
                                    onLoadUserInfo(set_data);//初始化登陆信息
                                    /* io.sockets.emit('is_check', set_data);//返回用户信息 前台设置全局变量*/
                                    io.sockets.to(socket.id).emit('is_check', set_data);//返回用户信息 前台设置全局变量
                                }
                            });

                        }else{
                            io.sockets.to(socket.id).emit('is_check', {'userid':'','username':''});//错误的时候 返回空
                        }

                    });

                    res.on('end',function(res){
                        console.log('111111');
                    });

                    res.on('error',function(e){
                        console.log('22222222');
                    });
                });
                req.write(qs.stringify(bodystr));
                req.end();
            }else {

                if(!err){
                    redisClient.expire(global_userinfo_key,1800);
                    var check_userinfo = JSON.parse(response);//需要转成对象
                    onLoadUserInfo(set_data);//初始化登陆信息
                    io.sockets.to(socket.id).emit('is_check', check_userinfo);//返回用户信息 前台设置全局变量
                    //io.sockets.emit('is_check', check_userinfo);
                    console.log('bbb');
                }else{
                    console.log('ccc');
                    io.sockets.to(socket.id).emit('is_check', {'userid':'','username':''});//错误的时候 返回空
                }


            }

        });
    });
    /**************************************客户端登陆验证 end*************************************/


    /*********************************客户端连接服务端 需要初始化一些用户相关的信息 start*******************************************/
    //登陆成功后初始化用户数据
    socket.on('on_load',function (info) {
        //组织初始化的一些数据
        // level
        socket.level = 0;
        socket.username = info.username;
        socket.uid = info.uid;//用户的唯一userid
        socket.avatar = info.avatar;//用户头像
        socket.sex = info.sex;//用户性别

        // 用户在线列表的rediskey
        /* socket.onlineList = config.appname + ':' + socket.subscribeRoomId + ':onlinelist';*/
        socket.onlineList = config.appname + ':onlinelist';
        socket.jsonInfo = JSON.stringify(info);

        // 主房间 相当于群聊
        socket.join(socket.subscribeRoomId); //注意当前只支持一对以聊，所有当前功能不开放

        // 创建一个只包含当前用户的空房间, 并订阅该房间
        socket.join(config.subscribeRoomId + ':' + socket.uid);


        // 入hash列 当前房间里的所有人
        //2018-03-22 update为了满足对游戏接口提供服务所有需要修改存储的键值
        redisClient.hset(socket.onlineList, socket.uid, socket.jsonInfo, function (err, reply) {
            //在线用户数据结构使用hash
            //console.log(reply);
        });
        //初始化通训列表

        //如果用户存在toUserInfo 说明用户直接从地图进来的 多一步操作
        if(info.toUserInfo){
            chatToUserInfo(info.toUserInfo);
        }

        sendWelcome(info);
    });
    /*********************************客户端连接服务端 需要初始化一些用户相关的信息 end*******************************************/

    /***************************public msg 处理 start*************************/
    /**
     * 处理公共消息 通知客户端
     */
    socket.on('public_msg',function(msgData){
        if(msgData){//消息不为空时需要通知客户端，让客户端自己来垃取新的消息
            io.sockets.emit('client_public_msg', data);//通知客户端该用户已存在对话列表
        }else{
            //发生错误时记录请求log
            log.write_log('socket-app','public msg request empty');
        }
    });

    /**
     * 用户自己来服务端垃取公共消息
     * 监听客户端的响应
     */
    socket.on('server_public_msg',function(info){

        if(!info) return;
        console.log('-=========');
        console.log(info);

        /**
         * 当用户第一次登陆注册 用户的系统消息接收 只能以当前时间往前推两天去接收
         * 获取上一次公共消息的记录时间戳  微妙
         * @param req
         * @returns {*}
         */
        var key = 'global_msg_key:last_time' + info.userid;//记录每个用户的最后一次拉取公共消息的时间搓，方便下一次获取最新的记录条数
        redisClient.get(key,function(err,res){
            var lasttime;
            if(res){
                console.log('--==='+res);
                 lasttime = parseInt(res);//获取最后垃取的时间戳
            }else{
                //如果用户第一次更新时间 需要以当前的时间戳往前推30天 转成毫秒计算
                 lasttime = helper.getTime() - 60 * 60 * 24 * 1000 * 2;//当前时间戳 毫秒 往前推两天
            }

            getPublicMsg(info.userid,lasttime);//获取系统消息
        });

    });

    /***************************public msg 处理 end*************************/

    /**************************粉丝关注 start focus*******************************/
    socket.on('private_focus_msg',function(msgData){
        if(msgData){//消息不为空时需要通知客户端，让客户端自己来垃取新的消息
            //io.sockets.emit('client_public_focus_msg', data);//通知客户端该用户已存在对话列表

            //获取整个消息计数器 返回客户端
            redisClient.hgetall(game_config.game_app_message_count_hash_key,function(err,res){

                if(res.length > 0){//有消息未读取
                    var total_count = getMessageCount(res);//获取消息计数器总数量

                    if(res.hasOwnProperty(msgData.source_type) && res[msgData.source_type] > 0){//当前类消息必须 有新的 才会触发对应事件
                        io.sockets.to(socket.userid).emit('socket_focus_message_count', res[msgData.source_type]);//通知关注 分类消息数量显示
                        io.sockets.to(socket.userid).emit('socket_notice_message_count', total_count);//通知关注 分类消息数量显示
                    }
                }

            });
        }else{
            //发生错误时记录请求log
            log.write_log('socket-app','focus msg request empty');
        }
    });

    socket.on('server_private_focus_msg',function(info){
        if(!info) return;
        console.log('-=========');
        console.log(info);

        var action_name = 'focus';//操作类型名称

        var starttime = helper.getTime() - 60 * 60 * 24 * 1000 * 7;//开始时间 默认往前推一个礼拜

        var key = 'socket_private_msg:' + action_name + ':' + info.userid;//关注key值
        redisClient.zrangebyscore(key,starttime,helper.getTime(),function(err,res){
            if(res){
                //需要清除 关注的消息计数器
                redisClient.hdel(key,action_name,function(err,ress){
                    if(!err){
                        io.sockets.emit('send_focus_msg', res);//推送关注消息到客户端
                    }
                });

            }
        });
    });

    /**************************粉丝关注 end pravite*******************************/

    /****************************点赞 操作 praise start**************************************/
    socket.on('private_praise_msg',function(msgData){
        if(msgData){//消息不为空时需要通知客户端，让客户端自己来垃取新的消息

            //获取整个消息计数器 返回客户端
            redisClient.hgetall(game_config.game_app_message_count_hash_key,function(err,res){

                if(res.length > 0){//有消息未读取
                    var total_count = getMessageCount(res);//获取消息计数器总数量

                    if(res.hasOwnProperty(msgData.source_type) && res[msgData.source_type] > 0){//当前类消息必须 有新的 才会触发对应事件
                        io.sockets.to(socket.userid).emit('socket_praise_message_count', res[msgData.source_type]);//通知点赞 分类消息数量显示
                        io.sockets.to(socket.userid).emit('socket_notice_message_count', total_count);// 分类消息数量显示
                    }
                }

            });
        }else{
            //发生错误时记录请求log
            log.write_log('socket-app','praise msg request empty');
        }
    });

    socket.on('server_private_praise_msg',function(info){
        if(!info) return;
        console.log('-=========');
        console.log(info);

        var action_name = 'praise';//操作类型名称

        var starttime = helper.getTime() - 60 * 60 * 24 * 1000 * 7;//开始时间 默认往前推一个礼拜

        var key = 'socket_private_msg:' + action_name + ':' + info.userid;//点赞key值
        redisClient.zrangebyscore(key,starttime,helper.getTime(),function(err,res){
            if(res){
                //需要清除 点赞的消息计数器
                redisClient.hdel(key,action_name,function(err,ress){
                    if(!err){
                        io.sockets.emit('send_praise_msg', res);//推送点赞消息到客户端
                    }
                });

            }
        });
    });

    /****************************点赞 操作 end**************************************/


    /****************************@我的 操作 myself start**************************************/
    socket.on('private_myself_msg',function(msgData){
        if(msgData){//消息不为空时需要通知客户端，让客户端自己来垃取新的消息

            //获取整个消息计数器 返回客户端
            redisClient.hgetall(game_config.game_app_message_count_hash_key,function(err,res){

                if(res.length > 0){//有消息未读取
                    var total_count = getMessageCount(res);//获取消息计数器总数量

                    if(res.hasOwnProperty(msgData.source_type) && res[msgData.source_type] > 0){//当前类消息必须 有新的 才会触发对应事件
                        io.sockets.to(socket.userid).emit('socket_myself_message_count', res[msgData.source_type]);//通知@我的 分类消息数量显示
                        io.sockets.to(socket.userid).emit('socket_notice_message_count', total_count);// 分类消息数量显示
                    }
                }

            });
        }else{
            //发生错误时记录请求log
            log.write_log('socket-app','myself msg request empty');
        }
    });

    socket.on('server_private_myself_msg',function(info){
        if(!info) return;
        console.log('-=========');
        console.log(info);

        var action_name = 'myself';//操作类型名称

        var starttime = helper.getTime() - 60 * 60 * 24 * 1000 * 7;//开始时间 默认往前推一个礼拜

        var key = 'socket_private_msg:' + action_name + ':' + info.userid;//点赞key值
        redisClient.zrangebyscore(key,starttime,helper.getTime(),function(err,res){
            if(res){
                //需要清除 点赞的消息计数器
                redisClient.hdel(key,action_name,function(err,ress){
                    if(!err){
                        io.sockets.emit('send_myself_msg', res);//推送点赞消息到客户端
                    }
                });

            }
        });
    });


    /****************************@我的 操作 myself end**************************************/


    /****************************评论 操作 comments start**************************************/
    socket.on('private_comments_msg',function(msgData){
        if(msgData){//消息不为空时需要通知客户端，让客户端自己来垃取新的消息

            //获取整个消息计数器 返回客户端
            redisClient.hgetall(game_config.game_app_message_count_hash_key,function(err,res){

                if(res.length > 0){//有消息未读取
                    var total_count = getMessageCount(res);//获取消息计数器总数量

                    if(res.hasOwnProperty(msgData.source_type) && res[msgData.source_type] > 0){//当前类消息必须 有新的 才会触发对应事件
                        io.sockets.to(socket.userid).emit('socket_comments_message_count', res[msgData.source_type]);//通知评论 分类消息数量显示
                        io.sockets.to(socket.userid).emit('socket_notice_message_count', total_count);// 分类消息数量显示
                    }
                }

            });
        }else{
            //发生错误时记录请求log
            log.write_log('socket-app','comments msg request empty');
        }
    });

    socket.on('server_private_comments_msg',function(info){
        if(!info) return;
        console.log('-=========');
        console.log(info);

        var action_name = 'comments';//操作类型名称

        var starttime = helper.getTime() - 60 * 60 * 24 * 1000 * 7;//开始时间 默认往前推一个礼拜

        var key = 'socket_private_msg:' + action_name + ':' + info.userid;//点赞key值
        redisClient.zrangebyscore(key,starttime,helper.getTime(),function(err,res){
            if(res){
                //需要清除 点赞的消息计数器
                redisClient.hdel(key,action_name,function(err,ress){
                    if(!err){
                        io.sockets.emit('send_comments_msg', res);//推送点赞消息到客户端
                    }
                });

            }
        });
    });

    /****************************评论 操作 comments end**************************************/

    /**
     * 用户断开socket连接触发的方法
     */
    socket.on('disconnect', function () {
        console.log('--client-- end');
     /*   logger.info('SocketIO : Received ' + nb + ' messages');
        logger.info('SocketIO > Disconnected socket ' + socket.id);*/
    });

    /*********************自定义函数 start**************************/
    /**
     * 用户登陆成功后 需要初始化用户数据 建立socket通信信息数据
     */
    var onLoadUserInfo = function(info){
        //组织初始化的一些数据
        socket.level = 0;
        socket.username = info.username;
        socket.userid = info.userid;//用户的唯一userid
        socket.avatar = info.avatar;//用户头像
        socket.sex = info.sex;//用户性别

        // 用户在线列表的rediskey
        socket.onlineList = game_config.game_app_key + 'onlinelist';
        socket.jsonInfo = JSON.stringify(info);

        // 主房间 相当于群聊
        socket.join(socket.subscribeRoomId); //公开消息  整个游戏系统房间

        // 创建一个只包含当前用户的空房间, 并订阅该房间
        socket.join(game_config.game_app_key + ':' + socket.userid);//存在私法消息 需要建立 每个用户的独立房间


        // 入hash列 当前房间里的所有人
        //2018-03-22 update为了满足对游戏接口提供服务所有需要修改存储的键值
        redisClient.hset(socket.onlineList, socket.uid, socket.jsonInfo, function (err, reply) {
            //在线用户数据结构使用hash
            //console.log(reply);
        });
        //初始化通训列表
    }


    /**
     *
     * 消息模式是获取公开消息  每个用户有自己的消息缓存   用户只需要从自己的缓存数据读取数据
     * 获取公共消息 并合并到自己的私有消息集合中 读取通知只需要读取自己的私有集合
     * @param userid
     * @param lasttime
     * @param msgData
     */
    var getPublicMsg = function(userid,lasttime,info){
        var key = 'socket_global_public_msg';//公共消息的key值
        //先判断该用户是否已经存在对话列表
        redisClient.zrangebyscore(key,lasttime,helper.getTime(),function(err,res){

            setPublicInfoToMyRedis(userid,res);//设置存入自己集合

            console.log(res);
            var total = 0;//默认没有未读消息
            if(res && res.length > 0){

                 total = res.length;//未读数量
            }

            var data = {
                'total':total,
                'data':msgData
            }

            sendTpdata(data);//发送消息到前端
        });
    };

    //public 发送到前端数据
    var sendPublicTpdata = function (data){

        io.sockets.emit('send_public_msg', data);//将用户自己的公开消息发送到客户端
    }


    /**
     * 将系统公开的消息缓存到每个用户自己的缓存当中 用户读取只需读取自己的数据集合
     */
   var setPublicInfoToMyRedis = function (userid,data)
   {
       var vals = [];//定义新的容器
        if(data && data.length > 0){//遍历集合数据 存入到自己的集合当中
            for(var i=0;i<data.length;i++){
                vals.push(JSON.parse(data[i]).send_time);//score值 集合中缓存的是json字符串  所以需要解析成json对象 js方可处理
                vals.push(JSON.parse(data[i]));//数据member值
            }
        }else{
            return;
        }

       var key = 'socket_global_public_msg:my:' + userid;//每个用户自己的集合键值

       redisClient.zadd(key,vals,function(err,res){
            if(!err){
                var starttime = helper.getTime() - 60 * 60 * 24 * 1000 * 7;//开始时间
                redisClient.zrangebyscore(key,starttime,helper.getTime(),function(err,res){
                    if(!err) sendPublicTpdata(res);
                });
            }else{
                log.write_log('socket-app',JSON.stringify(vals));
            }
       });
   }

   var getMessageCount = function (data){

       //official
       var official_count = 0;//计数器
       if(res.hasOwnProperty('official') && res['official'] > 0){//官方系统消息
           official_count = res['official'];
       }

       //focus
       var focus_count = 0;//计数器
       if(res.hasOwnProperty('focus') && res['focus'] > 0){//关注
           focus_count = res['focus'];
       }

       //praise
       var praise_count = 0;//计数器
       if(res.hasOwnProperty('praise') && res['praise'] > 0){//点赞
           praise_count = res['praise'];
       }

       //myself
       var myself_count = 0;//计数器
       if(res.hasOwnProperty('myself') && res['myself'] > 0){//@我的
           myself_count = res['myself'];
       }

       //comments
       var comments_count = 0;//计数器
       if(res.hasOwnProperty('comments') && res['comments'] > 0){//评论
           comments_count = res['comments'];
       }

       return focus_count+praise_count+myself_count+comments_count+official_count;

   }

});

server.listen(game_config.port);