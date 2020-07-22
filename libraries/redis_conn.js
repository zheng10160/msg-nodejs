/**
 * Created by localuser1 on 2018/11/12.
 */
const game_config = require('../conf/socket-config');//加载配置文件

const redis = require('redis');

const redisClient = redis.createClient(game_config.redis.port, game_config.redis.host);

redisClient.auth(game_config.redis.auth);//redis 密码



module.exports = redisClient;