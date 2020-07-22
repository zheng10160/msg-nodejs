/**
 * Created by localuser1 on 2018/11/12.
 */
/**
 * 获取公网ip地址
 * @param req
 * @returns {*}
 */
exports.getClientIP=function(req){
    var ipAddress;
    var headers = req.headers;

    var forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];

    forwardedIpsStr ? ipAddress = forwardedIpsStr:ipAddress=null;

    if(ipAddress){
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
};


exports.write_json=function(data){
    if(!data){
        return false;
    }

    return JSON.stringify(data);
};

/**
 * 判断该值是否为整数
 * @param obj
 * @returns {boolean}
 */
exports.isInteger = function(obj) {

    return Math.floor(obj) === parseInt(obj);
}

/**
 * 组织json返回信息
 * @param code 整数 0默认代表成功意思，其他code自定义
 * @param msg 'success'  and  'error'
 * @param data  可以是字符串 可以是是json对象
 */
exports.showJson = function(code,msg,data={}){

    if(!code){
        return 'error code';
    }

    if(!msg){
        return 'error msg';
    }

    var arr = {
        resultNo:code,//提示code码
        resultMsg:msg,//提示信息
        resultData:data,//返回数据信息，可以是字符串也可以是数组
    };

    return arr;
}


/**
 * 生成36位唯一的guid  注意：这里是系统生成的guid 一班同一台计算机很难出现两个相同的guid
 */
exports.guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


/**
 *  生成uuid 一班用作键值key使用
 * @param len 长度
 * @param radix 以二进制 十进制 十六禁止出现   用例
 *
 *  // 8 character ID (base=2)
 *   uuid(8, 2)  //  "01001010"
 *   // 8 character ID (base=10)
 *   uuid(8, 10) // "47473046"
 *   // 8 character ID (base=16)
 *   uuid(8, 16) // "098F4D35"
 */
exports.uuid = function(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}
/***************************************函数*************************************/

