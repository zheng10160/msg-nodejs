<?php

if(!isset($_GET['access_token'])){
    show_json('100000','access_token error');
}
//$access_token = '257ccddbd33c5ac7262d7b207618923238bc8987';//65f3419d7a5bc10738167918bd7a97ac1a5b353a
$access_token = $_GET['access_token'];
$client_id = '44E7F9DC2DE558BFBC5D808E38267019';//3F5AA95E0B66ADC5CF7085D522A90C2C

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="stylesheet" type="text/css" href="assets/css/chat1.css">
    <link rel="stylesheet" type="text/css" href="assets/css/message.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="assets/js/functions.js"></script>
    <script src="assets/js/jquery.js"></script>
    <script src="http://192.168.99.62:3000/socket.io/socket.io.js"></script>
</head>
<body>

<div class="chatContainer big-wrap">

    <div class="chatBox" ref="chatBox">
        <header class="mui-bar mui-bar-nav head chatBox-head">
                <!--左侧-->
                <div class="head-left">
                    <img src="assets/img/Nearby_white.png" alt="" style="width:32px;"/>
                    <h4>对话列表</h4>
                </div>
                <!--右侧-->
                <div class="head-right sousuo">
                    <div class="box">
                        <input type="text" id="u_value" placeholder="昵称/手机/邮箱" class="ss-val"/>
                        <button id="s_btn" class="search">搜索</button>

                   <!--      <div id="show_friends" style="display:block;background:grey;z-index:100;width:100px;height:40px">

                        </div> -->
                    </div>
                </div>
            </header>



        <div class="chatBox-info" style="display:flex;justify-content: space-between;">
            <!-- 好友列表 -->
            <div class="chatBox-list" id="chat_list" ref="chatBoxlist" style="width:24%">

               
            </div>



            <!--搜索框提示-->
                <!--用户不存在的情况下-->
            <div class="search-tips none" style="width: 340px;display: none;line-height: 72px">
                该昵称用户不存在，请重新搜索！
            </div>
            
                <!--用户存在的情况下-->
            <div class="tip-wrap tip-wrap-cunzai" style="display:none;">
                <div class="search-tips cunzai" style="width: 340px;display: flex;justify-content: space-around;">
                    <h4>提示</h4>
                   <!--  <span>确认要与<span class="niname">xxx</span>*/进行聊天吗？</span> -->
                   <div class="show_friends" id="show_friends" style="width: 80%;height: 40%;margin: 0 auto;overflow: hidden;text-align: center;    line-height: 30px;font-size: 16px；color:#3C84A0;">
                       
                   </div>
                    <div class="operate" style="margin-bottom: 5%">
                        <div class="queren private-chat-btn " data_username=""  data_userid="" data_avatar="" data_sex="">确认</div>
                        <div class="quxiao">取消</div>
                    </div>
                </div>
                
             </div>



            <!-- 聊天界面 -->
            <div class="chatBox-kuang" ref="chatBoxkuang" style="width:76%">
                <div class="chatBox-content">
                    <div class="chatBox-content-demo" id="chatBox-content-demo">



                    </div>
                </div>
                <div class="chatBox-send">
                    <div class="div-textarea" contenteditable="true" style="width:60%"></div>
                   	<div id="toUser">
                        <input type="hidden" name="to_username" value="">
                        <input type="hidden" name="to_userid" value="">
                        <input type="hidden" name="to_avatar" value="">
                        <input type="hidden" name="to_sex" value="">
                        <button id="chat-fasong" class="btn-default-styles">发送
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
</div>
<script src="assets/js/iscroll.js"></script>
<script>

    var uid;
    var username;

    var info={};//空对象

    var client_id = '<?php echo $client_id;?>';
    var access_token = '<?php echo $access_token;?>';

    screenFuc();
    function screenFuc() {
        var topHeight = $(".chatBox-head").innerHeight();//聊天头部高度
        //屏幕小于768px时候,布局change
        var winWidth = $(window).innerWidth();
        if (winWidth <= 768) {
            var totalHeight = $(window).height(); //页面整体高度
            $(".chatBox-info").css("height", totalHeight - topHeight);
            var infoHeight = $(".chatBox-info").innerHeight();//聊天头部以下高度
            //中间内容高度
            $(".chatBox-content").css("height", infoHeight - 60);
            $(".chatBox-content-demo").css("height", infoHeight -60);

            $(".chatBox-list").css("height", totalHeight - topHeight);
            $(".chatBox-kuang").css("height", totalHeight - topHeight);
            // $(".div-textarea").css("width", winWidth - 106);
        } else {
            $(".chatBox-info").css("height", '92%');
            $(".chatBox-content").css("height", '80%');
            $(".chatBox-content-demo").css("height", '100%');
            $(".chatBox-list").css("height", '100%');
            $(".chatBox-kuang").css("height", '100%');
			//$(".div-textarea").css("width", '80%');
        }
    }
    (window.onresize = function () {
        screenFuc();
    })();

	//	消息撤回	
	$('.chatBox-content-demo').delegate('.chat-message', 'click', function() {
	    $(this).click(function(e){
			e.preventDefault();
			$(this).find('.chehui').toggle();
			
		})
	});
	$('.chatBox-content-demo').delegate('.chehui','click',function(){
		$(this).click(function(e){
			e.preventDefault();
			var cc=$(this).parent().parent().parent();
			console.log(cc);
			cc.remove(); 
			
		})
		
	})
	


	   
//点击 搜索功能的实现
    $('.search').click(function(){
        var val=$('.ss-val').val();
        //当搜索昵称存在的时候
        if(val!=""){
            $('.tip-wrap').find('span.niname').html(val);
            $('.tip-wrap').show();
        }
    })
    
    
    //  点击取消 
    $('.tip-wrap').find('div.quxiao').click(function(){
        $('.tip-wrap').hide();
        
    })
    
// 搜索完毕
	var  pullRefreshss = true;
    $(window).scroll(
        function () {
            /*当前滚动条到顶部的距离*/
            var top = $(document).scrollTop();
            /*当前浏览器的可是高度*/
            var height = document.body.clientHeight;
            /*当前网页（body）的高度*/
            var z_height = $(document).height();
            /*判断（网页的body高度减去当前浏览器的可视高度是否等于滚动条到顶部的距离）
             * 相等：则判定当前页面在底部
             * 不相等：判定当前页面不在底部
             * */
            var stats = ( z_height - height-top < 5) ;
                $("#show_s").html("top:"+top+",z_height:"+z_height+",height:"+height+",是否底部:"+stats);

            if (stats) {
                /*当前网页在最底部，执行该函数*/
                upPullfreshFunction();
            }else {
                if (!pullRefreshss) {
                    $("#show_view").html("没有更多的数据");
                }
            }
        }
);
</script>
<script type="text/javascript" src="assets/js/core.js"></script>
</body>
</html>
