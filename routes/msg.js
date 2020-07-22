/**
 * 聊天的常用接口
 * Created by localuser1 on 2018/4/16.
 */
var express = require('express');
var config = require('../libraries/config');
var router = express.Router();
/*var redis = require('redis');

const redisClient = redis.createClient('6379', config.redis_config.redis_host);
/!*const redisClient = redis.createClient('6379', '106.75.122.206');*!/
/!*redisClient.auth('HelloSenseThink');//redis 密码*!/
redisClient.auth(config.redis_config.redis_pwd);//redis 密码

redisClient.select(config.redis_config.redis_db,function(error){
    if(error){
        console.log(error);
    }
});//选择redis 库*/

router.get('/chat',function(request,response){
    console.log('ssss');
});

module.exports = router;

