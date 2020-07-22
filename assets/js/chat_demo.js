     // 顶部返回上一级目录
    $(".back_to").on("tap",function(){
        // history.go(-1);
        window.location.href = 'uniwebview://close';
    });
    
    screenFuc();
    function screenFuc() {
        var topHeight = $(".chatBox-head").innerHeight();//聊天头部高度
        //屏幕小于宽度768px时候,布局change
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


        }
    }
    (window.onresize = function () {
        screenFuc();
    })();

	//	消息撤回	
	// $('.chatBox-content-demo').delegate('.chat-message', 'click', function() {
	//     $(this).click(function(e){
	// 		e.preventDefault();
	// 		$(this).find('.chehui').toggle();
			
	// 	})
	// });
	// $('.chatBox-content-demo').delegate('.chehui','click',function(){
	// 	$(this).click(function(e){
	// 		e.preventDefault();
	// 		var cc=$(this).parent().parent().parent();
	// 		console.log(cc);
	// 		cc.remove(); 
			
	// 	})
		
	// })
	
    
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


// 弹出软键盘时  下面的输入框随着软件盘浮动  时期出现在可视范围内
// $('.div-textarea').focus(function(e) {
//     $(".chatBox-kuang").css("padding-bottom",15);
//     var viewHeight = window.innerHeight;
//     e.target.scrollIntoViewIfNeeded();
//     e.targfet.scrollIntoView(true);
//     test = document.querySelector('.chatBox');//获取聊天框体
//     test.scrollIntoView();//使其出现在可视区域内


// }).blur(function(){
//     $(".chatBox-kuang").css("padding-bottom",0);
//     var viewHeight = window.innerHeight;
  
// })

// // 页面高度变化时 即软键盘弹出来以后
// var winHeight = $(window).height(); //获取当前页面高度
// $(window).resize(function() {
//     alert($(window).height());
//     var thisHeight = $(this).height();
//         if (winHeight - thisHeight > 50) {
//         $('body').css('height', winHeight + 'px');
//         $('.chatBox').css('height', winHeight + 'px');
//     } else {

//         $('body').css('height', '100%');
//         $('.chatBox').css('height', '100%');
//     }
// });

