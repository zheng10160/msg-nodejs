/**
 * Created by localuser1 on 2018/4/16.
 */
var express = require('express');

var app = express();
//加载自己的接口 module
var msg_interface = require('./routes/msg');

//   :3002/getm/chat
app.use('/getm',msg_interface);

app.use(function(req,res){
    console.log('cccccc');
});
app.listen(3002);