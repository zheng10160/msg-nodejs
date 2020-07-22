
'use strict';
var config = require('./libraries/config');
var helper = require('./libraries/helper');
var fs = require('fs');//操作文件

// 监听
var app = require('http').createServer().listen('3000');
/*var http = require('http');
var app = http.createServer().listen('3000');*/
var io = require('socket.io')(app);

// redis 
var redis = require('redis');

const redisClient = redis.createClient('6379', config.redis_config.redis_host);
/*const redisClient = redis.createClient('6379', '106.75.122.206');*/

/*redisClient.auth('HelloSenseThink');//redis 密码*/
redisClient.auth(config.redis_config.redis_pwd);//redis 密码

redisClient.select('5',function(error){
    if(error){
        console.log('vfvfv');
        console.log(error);
    }
});//选择redis 库

io.sockets.on('connection', function (socket) {
    //验证本地是否有登陆过
    socket.on('is_login',function (info) {
        var global_userinfo_key = config.local_userinfo_key + info.access_token;//redis 键

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
                                   /* io.sockets.emit('is_check', set_data);//返回用户信息 前台设置全局变量*/
                                    io.sockets.to(socket.id).emit('is_check', set_data);//返回用户信息 前台设置全局变量
                                    console.log('mmm123');
                                }
                            });

                        }else{
                            io.sockets.to(socket.id).emit('is_check', {'userid':'','username':''});//错误的时候 返回空
                           // console.log('gain userinfo error');//请求用户信息错误
                        }

                    });

                    res.on('end',function(res){
                        console.log('111111');
                    });

                    res.on('error',function(e){
                        console.log('22222222');
                        /*io.sockets.emit('is_check', {'userid':'','username':''});//错误的时候 返回空*/
                    });
                });
                req.write(qs.stringify(bodystr));
                req.end();
            }else {

                if(!err){
                    redisClient.expire(global_userinfo_key,1800);
                   var check_userinfo = JSON.parse(response);//需要转成对象
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
    /**************************************************检测登陆end**********************************************************/
    //2018-03-22 update
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

    //点击某个用户 进入msg聊天模式
    socket.on('to_user',function(info){
        delChatToUserHintLog(info);
        //初次进入需要建立与某个用户独立的房间号
        var user_list = [socket.uid,info.toUserid];//组装获取加密key
        socket.join(config.subscribeRoomId + ':' + helper.getRKey(user_list));//一对一的独立房间号

        console.log('--touser--');
        var toUserInfo = {'toUsername': info.toUsername,'toUserid':info.toUserid,'toUserAvatar':info.toUserAvatar,'toUserSex':info.toUserSex};
        //先获取一对一窗口必须经过的缓存记录 需要把记录合并到历史对话记录中

        //每个用户一旦进入与某个用户聊天时，需要查看占存区用户是否给自己留言 如果存在需要合并到历史记录中
        var get_my_msg_log_key = config.appname + config.msg_to_user_key + helper.getRKey(user_list) + socket.uid;//自己占存区 别人给自己留言
        var get_other_msg_log_key = config.appname + config.msg_to_user_key + helper.getRKey(user_list) + info.toUserid;//自己给别人留言 别人未读

        var msg_log = config.appname + config.msg_log_key + helper.getRKey(user_list);//历史log key

        //这里注意：需要读取自己的缓存区 ，同时也需要读区别人的占存区

        /**读取自己给别人留言的别人未读取取需要取出来 start**/
        var other_data = [];//自己给别人留的言 别人未读取
        redisClient.zrange(get_other_msg_log_key,0,-1,function(err,res){
            if(res.length > 0){
                other_data = res;//
            }
        });

        /********************end*************************/
       // delChatToUserHintLog(info);//移除该用户的消息提示
        /*********************请求php 云端接口 因为node不建议for循环处理数据，都是异步操作，会使内存异出 start*********************/
        //重小到大返回所有聊天数据 临时占存区 自己缓存区
        //将自己占存区信息 直接复制到 自己的历史记录中
        redisClient.zunionstore(msg_log,2,msg_log,get_my_msg_log_key,function(err,res){

            console.log('--sun--');
            //判断占存区是否有记录 有就大于0
            if(res){
                redisClient.del(get_my_msg_log_key,function(err,res){//将自己的占存取key删掉
                    if(res){
                        console.log('--del key--');
                    }
                });
            }

            //插入成功后 读取历史聊天log
            redisClient.zrange(msg_log,0,-1,function(err,res){
                if(res.length > 0){
                    //var res_msg = res.concat(other_data);
                    var res_msg = {'msg_read_log':res,'msg_noread_log':other_data,'toUserInfo':toUserInfo};
                    console.log('--msg1');
                    console.log(res_msg);
                    io.sockets.to(socket.id).emit('msg_list', res_msg);//返回用户聊天信息

                }else{
                    io.sockets.to(socket.id).emit('msg_list', {'msg_read_log':[],'msg_noread_log':other_data,'toUserInfo':toUserInfo});//返回用户聊天信息
                }
                sendWelcome(info);//初始化对话列表
            });
        });

        /*****************end*****************/
    });

    /*****************特殊处理 独立从地图上切换过来的 start*******************/

    /*****************特殊处理 独立从地图上切换过来的 end*******************/
    var chatToUserInfo = function(info){
        var http = require('http');
        var qs = require('querystring');
        //组装数据
        var bodystr = {
            'username':info
        }
        var headers = {
            'Content-type':'application/x-www-form-urlencoded',
            'Content-Length':qs.stringify(bodystr).length
        }
        //发送服务端 验证access_token有效性
        var opt = {
            method:"POST",
            host:config.http_account_url,
            port:80,
            path:"/passport/node_friends",
            headers:headers
        }
        console.log('-----vvvv------');
        console.log(opt);
        //发起请求
        var req = http.request(opt,function(res){
            res.setEncoding('utf-8');//设置字符集
            res.on('data',function(data){
                console.log('-----------------------');
                console.log(data);
                var data = JSON.parse(data);
                if(data.code == 0){
                    var touserInfo = {
                        'userid':data.data.userid,
                        'nickname':data.data.nickname,
                        'avatar':data.data.avatar,
                        'sex':data.data.sex
                    };
                    //将接收者添加为自己的通讯列表
                    redisClient.zadd(config.appname + config.msg_log_to_user_list + socket.uid,helper.getTime(),JSON.stringify(touserInfo),function(err,res){
                        if(err){
                            console.log('--error--');
                        }
                    });
                    io.sockets.to(socket.id).emit('to-chat-user', {'toUserid':data.data.userid,'toUsername':data.data.nickname,'toUserAvatar':data.data.avatar,'toUserSex':data.data.sex});//错误的时候 返回空
                }else{
                    io.sockets.to(socket.id).emit('to-chat-user', '');//错误的时候 返回空
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
    }
    /************************搜索到的好友添加到对话列表 start*************************/
    socket.on('chat-list',function(info){
        /************************1 首先将接收者用户添加到自己的历史聊天名单列表中 方便进入msg中直接展示***************************/
        var touserInfo = {
            'userid':info.toUserid,
            'nickname':info.toUsername,
            'avatar':info.toUserAvatar,
            'sex':info.toUserSex,
        };
        //自己不能添加自己未好友
        if(info.toUserid == socket.uid){
            io.sockets.to(socket.id).emit('return_chat_list', 'unable add self');//通知客户端该用户已存在对话列表
            return ;
        }
        //先判断该用户是否已经存在对话列表
        redisClient.zrange(config.appname + config.msg_log_to_user_list + socket.uid,0,-1,function(err,res){
            if(res.length > 0){
                for(var i in res){
                    if(JSON.parse(res[i]).userid == info.toUserid){
                        io.sockets.to(socket.id).emit('return_chat_list', 'to user already exist list');//通知客户端该用户已存在对话列表
                        return ;
                    }
                }
            }
            redisClient.zadd(config.appname + config.msg_log_to_user_list + socket.uid,helper.getTime(),JSON.stringify(touserInfo),function(err,res){
                sendWelcome(info);//重新加载列表
            });
        });

        //redisClient.expire(config.msg_log_to_user_list,0);
        /*****************************end****************************************/
    });

    /**********************************添加对话列表 end******************************************/
    
    // 初始化通讯列表
    var sendWelcome = function (info) {
        /*****查询自己是否存在对话记录表 start***********/
        redisClient.zrevrange(config.appname + config.msg_log_to_user_list + socket.uid,0,-1,function(err,res){
            console.log(res);
            if(res){
               // io.sockets.to(socket.id).emit('welcome', {'data':res,'chat_hint':getCountHintChatLog()})
                getCountHintChatLog(socket.id,res,socket.uid);
            }else{
                //io.sockets.to(socket.id).emit('welcome', '');
                getCountHintChatLog(socket.id,'',socket.uid);
            }
        });
        /************end************/


        
    }
    
    // 房间内消息
    socket.on('room-message', function (msg) {
        
        var info = {};
        info.fromUsername = msg.username;
        info.toUsername = '';
        info.content = msg.content;
        info.currentTime = helper.getNowFormatDate();
        info.type = 'public';
        io.sockets.to(config.subscribeRoomId).emit('room-message', info);
    });

    /**
     * 当点击某个用户进行聊天时首先展示与该用户最新的聊天记录 如有留言信息 需要将留言信息合并到历史聊天记录下
     *
     * 对发送者来说 接收人未读取消息或者不在线时 只需把log读取出来消失未读取
     */
    // 私有消息
    socket.on('private-msg', function (data) {
        console.log('private');
        var info = {};
        info.fromUsername = socket.username;//发送者昵称
        info.fromUid = socket.uid;//发送者昵称
        info.toUsername = data.toUsername;//接收者昵称
        info.toUserid = data.toUserid;//接收者useid
        info.toUserAvatar = data.toUserAvatar;//接收者头像
        info.toUserSex = data.toUserSex;//接收者性别
        info.content = data.content;

        /************************1 首先将接收者用户添加到自己的历史聊天名单列表中 方便进入msg中直接展示***************************/
        var touserInfo = {
            'userid':info.toUserid,
            'nickname':info.toUsername,
            'avatar':info.toUserAvatar,
            'sex':info.toUserSex,
        };
        //将接收者添加为自己的通讯列表
       /* redisClient.zadd(config.appname + config.msg_log_to_user_list + socket.uid,helper.getTime(),JSON.stringify(touserInfo),function(err,res){
            if(err){
                console.log('--error--');
            }
        });*/
        //先判断自己的列表中是否已存在接收者
        redisClient.zrange(config.appname + config.msg_log_to_user_list + socket.uid,0,-1,function(err,res){
            if(res.length > 0){
                for(var i in res){
                    console.log(JSON.parse(res[i]).userid+'____'+info.toUserid);
                    if(JSON.parse(res[i]).userid == info.toUserid){
                        return ;//退出操作 自己已经是别人的好友
                    }
                }
            }
            redisClient.zadd(config.appname + config.msg_log_to_user_list + socket.uid,helper.getTime(),JSON.stringify(touserInfo),function(err,res){
                console.log('add friends ok');
            });
        });

        //将发送者添加到对方的通讯列表
        var myuserInfo = {
            'userid':socket.uid,//自己
            'nickname':socket.username,
            'avatar': socket.avatar,
            'sex':socket.sex
        };
        /*
        redisClient.zadd(config.appname + config.msg_log_to_user_list + info.toUserid,helper.getTime(),JSON.stringify(myuserInfo),function(err,res){
            if(res){
                //写log
                if(err){
                    console.log('--error--');
                }
            }
        });*/
        //先判断自己是否已经在对方的通讯列表中，不能多次添加重复的好友
        redisClient.zrange(config.appname + config.msg_log_to_user_list + info.toUserid,0,-1,function(err,res){
            if(res.length > 0){
                for(var i in res){
                    console.log(JSON.parse(res[i]).userid+'____'+socket.uid);
                    if(JSON.parse(res[i]).userid == socket.uid){
                        return ;//退出操作 自己已经是别人的好友
                    }
                }
            }
            redisClient.zadd(config.appname + config.msg_log_to_user_list + info.toUserid,helper.getTime(),JSON.stringify(myuserInfo),function(err,res){
                console.log('add friends ok');
            });
        });

        //redisClient.expire(config.msg_log_to_user_list,0);
        /*****************************end****************************************/

        //写log
       /* fs.appendFile(config.msg_write_log_path + helper.getWriteLogTimeStr+'.log',JSON.stringify(touserInfo),{flag:'w',encoding:'utf-8',mode:'0666'},function(err){
            if(err){
                console.log('vf');
            }
        });*/
        /*******************************2 未读消息缓存 一对一聊天窗口记录 注意用户每次发送消息必须经过该缓存 临时占存区****************************************/
        var user_list = [info.fromUid,info.toUserid];//组装获取加密key
    /*    var msg_current_log_key = config.appname + config.msg_list_log + helper.getRKey(user_list);//key 队列 同步备份到db*/
        var msg_current_log_key = config.appname + config.msg_list_log;//key 队列 同步备份到db

        var msg_to_user_key = config.appname + config.msg_to_user_key + helper.getRKey(user_list) + info.toUserid;//将自己发送的消息推送到指定用户的redis键值中

        //占存取 缓存自己的留言
        var c_ts = helper.getTime();//当前时间戳
        redisClient.zadd(msg_to_user_key,c_ts,
            JSON.stringify({
                'userid':socket.uid,
                'nickname':socket.username,
                'avatar':socket.avatar,
                'sex':socket.sex,
                'content':data.content,
                'ts':c_ts,
                'is_del':0,
            }),function(err,res){
           if(err){
               console.log('chat log');
           }
        });
        /****************************end****************************/
        pushDataTORedis(info,msg_current_log_key);//推送消息到消息队列 db备份

        setCountHintChatLog(user_list,info,touserInfo);//未读消息计数器

        // fromUsername(发送消息者)
        var return_my_msg = {
            uid:socket.uid,
            nickname:socket.username,
            avatar:socket.avatar,//用户头像
            sex:socket.sex,//用户性别
            content:info.content,
            type:'private',
           /* other_userinfo:info,*/
            other_userinfo:{'userid':info.toUserid,'toUserid':info.toUserid},
            currentTime:helper.getNowFormatDate()
        };
        //发送私有消息时 需要建立独立的房间号

        // socket.emit('room-message', return_my_msg);
        // toUsername(接收消息者), 因为会话开始时, 每个用户订阅了一个只包含自己的房间, 所以直接推消息到该房间 一对一独立的房间号
        io.sockets.to(config.subscribeRoomId + ':' + helper.getRKey(user_list)).emit('room-message', return_my_msg);

        //toUserSendWelcome(touserInfo);//更新接收者的通讯列表
        
    });

    //一对一时时聊天时需要手动清除一些消息 如：记录未读条数log 对方的未读消息占存区，因为时时在聊天不可能存在这些未读消息 所以触发方法在前台，当用户接收到消息时，自己清除
    socket.on('del-state', function (info) {
        console.log('-----jhdh----');
        console.log(info);
        delChatToUserHintLog(info);//记录未读条数log

        emptyMychatLog(info);//晴空对方的占存区

    });

    // 时时通讯时 发送完消息需要更新通讯列表的红点
    var updateRedBj = function (info) {
        /*****查询自己是否存在对话记录表 start***********/
        redisClient.zrevrange(config.appname + config.msg_log_to_user_list + info.toUserid,0,-1,function(err,r){
            var key = config.appname + 'hash_list_key:'+info.toUserid;

            redisClient.hgetall(key,function(err,res){
                if(res){
                    io.sockets.to(config.subscribeRoomId + ':' + info.toUserid).emit('welcome', {'data':r,'chat_hint':res});
                }else{

                    io.sockets.to(config.subscribeRoomId + ':' + info.toUserid).emit('welcome', {'data':r,'chat_hint':{}});
                }
            });

        });
        /************end************/



    }
    /*******************每次发送消息给对方 对方列表需要更新 提示有消息展示 start****************************************************/
    var toUserSendWelcome = function (info) {

        /*****查询自己是否存在对话记录表 start***********/
        //info.uid 接收者的uid
        redisClient.zrevrange(config.appname + config.msg_log_to_user_list + info.userid,0,-1,function(err,res){
            console.log('--tosend---');
            if(res){

                /*io.sockets.to(config.subscribeRoomId + ':' + info.userid).emit('welcome', res);*/
                //io.sockets.to(config.subscribeRoomId + ':' + info.userid).emit('welcome', {'data':res,'chat_hint':getCountHintChatLog()});
                getCountHintChatLog(config.subscribeRoomId + ':' + info.userid,res,info.userid);
            }else{
                //io.sockets.emit('welcome', {'data':'','userid':socket.uid});//空列表
                //io.sockets.to(config.subscribeRoomId + ':' + info.userid).emit('welcome', '');
                getCountHintChatLog(config.subscribeRoomId + ':' + info.userid,'',info.userid);
            }
        });
        /************end************/



    }


    //点击切换进入该用户的来聊天页面时需要 移除该用户的未读消息提示
    var delChatToUserHintLog = function(info)
    {
        //移除该用户的消息提示
        var field_key = info.toUserid;//JI路多少条消息未读

        var key = config.appname + 'hash_list_key:'+socket.uid;
        redisClient.del(key,field_key,function(err,res){
            if(err){
                console.log('--mm--');
            }

        });

    }
    /***************end************/
    /*******************************************end********************************************/

    /**
     * 当用户一对一发送消息时，每次消息会先存入自己的缓存区，缓存区的数据只有自己点击切换用户聊天时才会清空，所有会出现用户信息一直处于未阅读的状态，
     * 所以这里的方法 需要在用户发送消息时，自己手动清除对方的缓存区消息
     * @param info toUser的相关消息
     */
    var emptyMychatLog = function(info)
    {

        var user_list = [socket.uid,info.toUserid];//组装获取加密key

        //每个用户一旦进入与某个用户聊天时，需要查看占存区用户是否给自己留言 如果存在需要合并到历史记录中
        var get_other_msg_log_key = config.appname + config.msg_to_user_key + helper.getRKey(user_list) + info.toUserid;//自己占存区 别人给自己留言

        var msg_log = config.appname + config.msg_log_key + helper.getRKey(user_list);//历史log key

        console.log('--qc----');
        console.log(info);
        redisClient.zunionstore(msg_log,2,msg_log,get_other_msg_log_key,function(err,res){
            //判断占存区是否有记录 有就大于0
            if(res){
               /* redisClient.del(get_my_msg_log_key,function(err,res){//将自己的占存取key删掉*/
                redisClient.del(get_other_msg_log_key,function(err,res){//将自己的占存取key删掉
                    if(res){
                        console.log('--del key--');
                        updateRedBj(info);
                    }
                });
            }
        });

    }

    // 每个用户的唯独消息计数器 redis
    var setCountHintChatLog = function(user_list_key,info,touserInfo)
    {//每次累计加1条
        var field_key = socket.uid;//JI路多少条消息未读

        var key = config.appname + 'hash_list_key:'+info.toUserid;
        redisClient.hget(key,field_key,function(err,res){
            if(res){
                console.log('dd--dd');
                console.log(res);
                redisClient.hset(key,field_key,parseInt(res)+1,function(err,res){//每次记录总数加1
                    if(err){
                        console.log('set chat count error');
                    }

                    toUserSendWelcome(touserInfo);//更新接收者的通讯列表
                });

            }else{
                console.log('dddaaa');
                redisClient.hset(key,field_key,1,function(err,res){//每次记录总数加1
                    if(err){
                        console.log('set chat count error');
                    }

                    toUserSendWelcome(touserInfo);//更新接收者的通讯列表
                });
            }
        });
    }

    //读取自己未读hash 中所有的未读消息
    var getCountHintChatLog = function(RoomId,data,userid){

        var key = config.appname + 'hash_list_key:'+userid;

        redisClient.hgetall(key,function(err,res){
            if(res){
                io.sockets.to(RoomId).emit('welcome', {'data':data,'chat_hint':res});
            }else{

                io.sockets.to(RoomId).emit('welcome', {'data':data,'chat_hint':{}});
            }
        });

    }

    //将用户的每条信息都推送到消息队列 同步db
    var pushDataTORedis = function(info,msg_current_log_key){
        /*****************************3 消息队列用户同步备份db start******************************/
        redisClient.lpush(msg_current_log_key,JSON.stringify({
            'sender':socket.uid,//发送者userid
            'accept':info.toUserid,//接收者userid
            'msg':info.content,
            'ts':helper.getTime()
        }),function(err,res){
            if(err){
                console.log('list start');
            }
        });
    }

    // 在线用户列表, 此处可优化，设置全局变量代替
    var realTimeUserlist = function () {
        
        if (socket.onlineList) {
            // 得到所有的用户
            redisClient.hkeys(socket.onlineList, function (err, list) {
                var number = 0;
                var userlist = {};
                if (list) {
                    for (var index in list) {
                        userlist[index] = list[index];
                        ++number;
                    }
                }
                io.sockets.to(config.subscribeRoomId).emit('online-list', {count: number, users: userlist});
            });
        }
        
    };
    
    // 定时取消息
    var stopTimer = setInterval(realTimeUserlist, 5000);
    
    // 监听退出
    socket.on('disconnect', function () {
           // 真退出
           redisClient.hdel(socket.onlineList, socket.uid, function (err, reply) {});
           //io.sockets.to(socket.subscribeRoomId).emit('room-message', '<span style="color: #ff0000;">系统消息 ' + helper.getNowFormatDate() + ' : <br>' + socket.username + ' 离开房间</span>');
           io.sockets.to(config.subscribeRoomId).emit('offline', '<span style="color: #ff0000;">系统消息 ' + helper.getNowFormatDate() + ' : <br>' + socket.username + ' 离开房间</span>');
           //离开房间
           socket.leave(config.subscribeRoomId);

    });
})
