
const crypto = require('crypto');//加密模块
exports.getNowFormatDate = function () {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes()
    var seconds = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }

    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }

    if (hours >= 0 && hours <= 9) {
        hours = "0" + hours;
    }

    if (minutes >= 0 && minutes <= 9) {
        minutes = "0" + minutes;
    }

    if (seconds >= 0 && seconds <= 9) {
        seconds = "0" + seconds;
    }

    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + hours + seperator2 + minutes
            + seperator2 + seconds;
    return currentdate;
};

/**
 * 获取时间戳
 * @returns {number|Number}
 */
exports.getTime = function () {
    var date = new Date();
    return date.getTime();
};

/**
 * 写log日志文件名 前缀
 * @returns {string}
 */
exports.getWriteLogTimeStr= function () {
    var date = new Date();

    var seperator1 = "-";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();

    return date.getFullYear() + seperator1 + month + seperator1 + strDate;
};

/**
 * 根据两个用户的userid 加密算出一组唯一数据
 * @param arr
 * @returns {*}
 */
exports.getRKey= function (arr) {
    var arr = arr.sort();//paixu

    if(arr.length != 2){
        return false;
    }

    var content = String(arr[0]) + String(arr[1]);
   /* var md5 = crypto.createHash('md5');//加密方式
    md5.update(content);

    return md5.digest('hex');//加密后的值*/
   return content;

};

/**
 * post 函数
 * @param url 请求地址
 * @param method 请求方法
 * @param data 请求参数
 */
exports.httpPostFun = function(url,method,data){
    var http = require('http');
    var qs = require('querystring');

    var headers = {
        'Content-type':'application/x-www-form-urlencoded',
        'Content-Length':qs.stringify(data).length
    }
    //发送服务端 验证access_token有效性
    var opt = {
        method:"POST",
        host:'127.0.0.1',
        port:80,
        path:"/auth/check_userinfo",
        headers:headers
    }
    //发起请求
    var req = http.request(opt,function(res){
        res.setEncoding('utf-8');//设置字符集
        res.on('data',function(data){


        });

        res.on('end',function(res){
            console.log('111111');
        });

        res.on('error',function(e){
            console.log('22222222');
        });
    });
    req.write(qs.stringify(data));
    req.end();
}