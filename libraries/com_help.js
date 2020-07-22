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

/***************************************函数*************************************/
