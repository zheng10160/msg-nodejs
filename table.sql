-- ----------------------------
--游戏聊天记录备份表
DROP TABLE IF EXISTS `chat_log`;
CREATE TABLE `chat_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `sign_key` varchar(50) NOT NULL COMMENT '两个用户的唯一userid 按小到大 拼接在一起的唯一值',
  `sender` bigint(18) NOT NULL COMMENT '发送者userid',
  `accept` bigint(18) NOT NULL COMMENT '接受者userid',
  `msg` VARCHAR (512) NOT NULL DEFAULT '' COMMENT '发送的文本消息内容',
  `created_ts` int(11) DEFAULT 0 COMMENT '创建时间',
   PRIMARY KEY (`id`),
   KEY `chat_log_sign_key` (`sign_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
