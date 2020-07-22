//时间戳转日期
function timestampToTime(timestamp) {
    var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    Y = date.getFullYear() + '-';
    M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
    D = date.getDate() + ' ';
    h = date.getHours() + ':';
    m = date.getMinutes() + ':';
    s = date.getSeconds();
    return Y+M+D+h+m+s;
}
//new
var active = true;
    $(function () {
        window.onblur = function () {
            active = false;
        }
        
        // onfocus
        window.onfocus = function () {
            active = true;
            document.title = document.title.replace("【您有新的消息】", "");
        };
        try{
            var socket = io.connect('http://192.168.99.62:3000');
        }catch (e){
            alert('io connect error');
        }

        //连接服务端 判断本地是否有登陆过缓存信息
        socket.emit('is_login', {'client_id':client_id,'access_token':access_token});
        socket.on('is_check', function (u) {
            console.log('--test--');

            if(u && u.userid && u.username){
                //var u = JSON.parse(msg);//转js 对象
                uid = u.userid;
                username = u.username;

                info = {"uid": u.userid, "username": u.username,"avatar":u.avatar,"sex":u.sex};
                console.log(info);
                socket.emit('on_load', info);
            }else{
                alert('异常登陆失败');
            }

        });

            socket.on('welcome', function (user_list) {
                console.log('cccc');
                //根据服务端的userid 对比客户端的 只更新自己的
                    //遍历循环对话用户列表
                    var str = '';
                    if(user_list.length > 0){

                        for(var i in user_list){
                            var data = JSON.parse(user_list[i]);
                            var default_avatar = data.avatar?data.avatar:'assets/img/Customer_Small.png';//头像不存在时的默认头像
                            str += '<div class="chat-list-people btn_chat">';
                            str +=  '<div>';
                            str += '<img src="'+ default_avatar+'" alt="头像"/>';
                            str += '<span></span>';
                            str += '</div>';
                            str += '<div class="chat-name">';
                            str += '<p id="user_id"  data-userid='+ data.userid +' data-avatar="'+data.avatar+'"  data-sex="'+data.sex+'">'+data.nickname+'</p>'
                            str += '</div>';
                            str += '</div>';
                        }


                    }else{
                        str += '<p>占无对话记录列表</p>';
                    }
                    $('#chat_list').html('');//先只空
                    $('#chat_list').append(str);//对话记录列表

               // $('.room-message').append('<p style="color: #ff0000;">系统消息 ' + getNowFormatDate() + ': <br>' + msg.username + ' 加入房间</p>');
            });

            //通知客户端 用户已存在对话列表 不需要在添加
            socket.on('return_chat_list',function(res){
                alert('该用户已存在对话列表，无需在添加');
            });

            socket.on('offline', function (msg) {
                $('.room-message').append(msg);
            });

            socket.on('room-message', function (msg) {
               console.log('--client--');
                var str = '';
                if (msg.type == 'private') {

                    if(msg.uid == uid){
                        str += '<div class="clearfloat">';
                        str += '<div class="author-name">';
                        str += '<small class="chat-date">'+msg.currentTime+'</small>';
                        str += '</div>';
                        str += '<div class="right">';

                        str += '<div class="chat-message">'+msg.content+'<div class="chehui">撤回</div></div>';

                        str += '<div class="chat-avatars"><img src="assets/img/Customer_Small.png" alt="头像"/></div>';

                        str += '</div>';
                        /*  str += '<p class="weidu">未读</p>';*/
                        str += '</div>';
                    }else{
                        str += '<div class="clearfloat">';
                        str += '<div class="author-name">';
                        str += '<small class="chat-date">'+msg.currentTime+'</small>';
                        str += '</div>';
                        str += '<div class="left">';
                        str += '<div class="chat-avatars"><img src="assets/img/Customer_Small.png" alt="头像"/></div>';
                        str += '<div class="chat-message">'+msg.content+'</div>';
                        str += '</div>';
                        str += '</div>';
                    }

                    $('#chatBox-content-demo').append(str);
                    //聊天框默认最底部
                    $(document).ready(function () {
                        $("#chatBox-content-demo").scrollTop($("#chatBox-content-demo")[0].scrollHeight);
                    });
                }

                // 滚动条保持贴在底部状态
              /*  $('.room-message').scrollTop(function() { return this.scrollHeight; });
                if (! active && document.title.indexOf('【您有新的消息】') < 0) {
                    document.title = '【您有新的消息】' + document.title;
                }*/

            });

            // 刷新在线用户列表
            socket.on('online-list', function (result) {

                // 右侧用户列表
                $('.online-number').html(result.count);

                if (result.users) {

                    // 当前dom树中用户列表
                    var domUserList = new Array();
                    $('.online-userlist .username-span').each(function (i, n) {
                        domUserList.push($(n).html());
                    });


                    var realUserList = new Array();
                    var content = '';
                    jQuery.each(result.users, function (i, value) {
                        content += '<p><span class="username-span">' + value + '</span><span class="action-js-buttons"><button type="button" class="private-chat-btn">私聊</button></span></p>';
                        realUserList.push(value);
                    });

                    // 首次加载
                    if (domUserList.length == 0) {
                        if (content) {
                            $('.online-userlist').append(content);
                        }
                    } else {
                        for (var j in domUserList) {
                            if (realUserList.indexOf(domUserList[j]) < 0) {
                                $('.online-userlist .username-span:contains("'+domUserList[j]+'")').parent().remove();
                            } else {
                                // 移除和页面相同的, 为此, 先得到索引
                                var index = realUserList.indexOf(domUserList[j]);
                                realUserList.splice(index, 1);
                            }
                        }

                        // 如果存在剩余的元素, 则代表新用户, 追加它到页面
                        if (realUserList.length > 0) {
                            var content = '';
                            for (var k in realUserList) {
                                content += '<p><span class="username-span">' + realUserList[k] + '</span><span class="action-js-buttons"><button type="button" class="private-chat-btn">私聊</button></span></p>';
                            }
                            $('.online-userlist').append(content);
                        }

                    }
                }

            });

            // jquery event.
            $("input[name='msg-content']").keydown(function (event) {
                var msg = $(this).val();
                if (msg && event.keyCode == 13) {
                    sendMsgToRoom(msg);
                }
            });

            $('.send-btn').on('click', function () {
                var msg = $("input[name='msg-content']").val();
                if (msg) {
                    sendMsgToRoom(msg);
                }
            });



            //切换用户后服务端 返回对话记录列表
            socket.on('msg_list',function(msg_log){
                var str = '';
                console.log('read log');
                if(msg_log.msg_read_log) {
                    var read_v = msg_log.msg_read_log;
                    for(var i in read_v){
                        var data = JSON.parse(read_v[i]);
                        if(data.userid == uid){
                            str += '<div class="clearfloat">';
                            str += '<div class="author-name">';
                            str += '<small class="chat-date">'+timestampToTime(data.ts)+'</small>';
                            str += '</div>';
                            str += '<div class="right">';

                            str += '<div class="chat-message">'+data.content+'<div class="chehui">撤回</div></div>';

                            str += '<div class="chat-avatars"><img src="assets/img/Customer_Small.png" alt="头像"/></div>';

                            str += '</div>';
                          /*  str += '<p class="weidu">未读</p>';*/
                            str += '</div>';
                        }else{
                            str += '<div class="clearfloat">';
                            str += '<div class="author-name">';
                            str += '<small class="chat-date">'+timestampToTime(data.ts)+'</small>';
                            str += '</div>';
                            str += '<div class="left">';
                            str += '<div class="chat-avatars"><img src="assets/img/Customer_Small.png" alt="头像"/></div>';
                            str += '<div class="chat-message">'+data.content+'</div>';
                            str += '</div>';
                            str += '</div>';
                        }

                    }
                }

                if(msg_log.msg_noread_log) {
                    var noread_v = msg_log.msg_noread_log;
                    for(var i in noread_v){
                        var data = JSON.parse(noread_v[i]);
                        if(data.userid == uid){
                            str += '<div class="clearfloat">';
                            str += '<div class="author-name">';
                            str += '<small class="chat-date">'+timestampToTime(data.ts)+'</small>';
                            str += '</div>';
                            str += '<div class="right">';

                            str += '<div class="chat-message">'+data.content+'<div class="chehui">撤回</div></div>';

                            str += '<div class="chat-avatars"><img src="assets/img/Customer_Small.png" alt="头像"/></div>';

                            str += '</div>';
                            str += '<p class="weidu">未读</p>';
                            str += '</div>';
                        }
                    }
                }

                if(!str){
                    str += '占无对话记录';
                }
                //把消息追加到展示消息列表中
                $('#chatBox-content-demo').html('');//先置为空
                $('#chatBox-content-demo').append(str);

                $(".chatBox-kuang").show();
                //聊天框默认最底部
                $(document).ready(function () {
                    $("#chatBox-content-demo").scrollTop($("#chatBox-content-demo")[0].scrollHeight);
                });
            });
            /******** end**********/

            var sendMsgToRoom = function (msg) {
                // clear the content
                $("input[name='msg-content']").val('');
                var type = 'public';
                socket.emit('room-message', {type: type, username: username, content: msg});
            };

            $('.close-box').on('click', function () {
                $('.input-message-box').slideUp(500);
                $('.private-chat-box').hide();
            });

            //点击切换聊天的用户
            $('#chat_list').on('click','p',function(){
                console.log('to chat');
                // 得到目标用户名的基本信息
                var toUsername = $(this).html();//昵称
                var toUserid = $(this).attr('data-userid');//userid
                var toUserAvatar = $(this).attr('data-avatar');//avatar
                var toUserSex = $(this).attr('data-sex');//sex

                //将当前需要建立聊天的用户值付于全局
                $("#toUser input[name='to_username']").val(toUsername);
                $("#toUser input[name='to_userid']").val(toUserid);
                $("#toUser input[name='to_avatar']").val(toUserAvatar);
                $("#toUser input[name='to_sex']").val(toUserSex);

                $(this).addClass('active').siblings().removeClass('active');
                socket.emit('to_user', {toUsername: toUsername,toUserid:toUserid,toUserAvatar:toUserAvatar,toUserSex:toUserSex});
            });

            //点击发送消息内容
            $('#chat-fasong').on('click', function () {
                var msg = $(".div-textarea").html();//消息内容
                var toUsername = $("#toUser input[name='to_username']").val();
                var toUserid = $("#toUser input[name='to_userid']").val();
                var toUserAvatar = $("#toUser input[name='to_avatar']").val();
                var toUserSex = $("#toUser input[name='to_sex']").val();
                console.log({toUsername: toUsername, content: msg,toUserid:toUserid,toUserAvatar:toUserAvatar,toUserSex:toUserSex});
                if (msg) {
                    if(msg.length > 512){
                        alert('发送的内容超出限制');
                        return false;
                    }
                    // 清空 消息区域
                    $(".div-textarea").html('');
                    /*
                     1. 目标用户名
                     2. 消息内容
                     */
                    socket.emit('private-msg', {toUsername: toUsername, content: msg,toUserid:toUserid,toUserAvatar:toUserAvatar,toUserSex:toUserSex});
                }

            });

            //根据用户手机／邮箱／昵称 搜索好友
            $('#s_btn').click(function(){
                var v = $('#u_value').val();
                if(!v){
                    return false;
                }
                $.ajax({
                    type:'POST',
                    url:'http://dev.account.senseplay.com/passport/get_friends',
                    dataType:'jsonp',
                    jsonp:'callback',
                    data:{'username':v},
                    success:function(data){
                        console.log(data);
                        if(data.userid){
                            var content = '<p><span class="username-span">' + data.nickname + '</span><span class="action-js-buttons">' +
                                '<button type="button" class="private-chat-btn" data-userid='+data.userid+' data-avatar="'+data.avatar+'" data-sex="'+data.sex+'">加入对话列表</button></span></p>';

                            if (content) {
                                $('#show_friends').append(content);

                                //搜索到的好友添加到对话列表 才能进行对话
                                $('.private-chat-btn').on('click',function () {
                                    console.log('kk_mm');
                                    // 得到目标用户名的基本信息
                                    var toUsername = $(this).parent().prev().html();//昵称
                                    var toUserid = $(this).attr('data-userid');//userid
                                    var toUserAvatar = $(this).attr('data-avatar');//avatar
                                    var toUserSex = $(this).attr('data-sex');//sex

                                    // 设置提示文字 处理服务端对话列表
                                    socket.emit('chat-list', {toUserid: toUserid, toUsername: toUsername, toUserAvatar: toUserAvatar,toUserSex:toUserSex});
                                    /*  $(".private-chat-box .to-username-span").html(toUsername);*/
                                });
                            }

                        }

                    },
                    error:function(e){
                        console.log(e);
                    }
                })
            })




    });
