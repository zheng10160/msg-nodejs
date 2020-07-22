/**
 * Created by localuser1 on 2018/11/12.
 */
const redisClient = require('../libraries/redis_conn');//加载redis连接实例

const log = require('../libraries/log');//加载redis连接实例
//redis 选择索引库
redisClient.select(6,function(err){
    if(err){
        log.write_log('socket-log','redis db error');
    }
});

/**
 * 获取上一次公共消息的记录时间戳  微妙
 * @param req
 * @returns {*}
 */
exports.getPublicLastTime=function(){

};


