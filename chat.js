/**
 * Created by localuser1 on 2018/4/16.
 */

/**
 * 介绍：消息系统入口文件
 * 独立
 * Created by localuser1 on 2018/3/22.
 */
'use strict';
var config = require('./libraries/config');
var helper = require('./libraries/helper');
var com_help = require('./libraries/com_help');//公用函数

var express = require('express');

var app = express();

var ejs = require('ejs');

var path = require('path');

var fs = require('fs');//操作文件

var querystring = require('querystring');

const http = require('http');

const LOG_PATH = './request.log';//日志


/***********************接收方法**************************/

app.engine('.html', ejs.__express);
app.set('views', 'html');
app.set('view engine', 'html');
app.engine("html",ejs.renderFile);

app.use(express.static(path.join(__dirname,'assets')));

app.get('/chat',function(request,response){
    var client_id = request.query.client_id;//平台唯一client_id 44E7F9DC2DE558BFBC5D808E38267019
    var access_token = request.query.access_token;//
    var username = request.query.username;//

    var _response = response;
    if(!client_id || !access_token){
        response.status('200').send('clinet_id or access_token illegal');
    }

    if(username){
         response.render('chat',{'client_id':client_id,'access_token':access_token,'toUserInfo':username});
    }else{
        response.render('chat',{'client_id':client_id,'access_token':access_token,'toUserInfo':''});
    }

    response.end();
});


app.listen(3001);