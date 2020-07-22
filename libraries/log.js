/**
 * Created by localuser1 on 2018/11/12.
 */
const fs = require('fs');

const help_fun = require('../helper/com_help');//加载帮助函数

const log_path = '../logs/';//log目录

/**
 *  写文件函数 通常用来写日志
 * @param file_prix 文件名前缀
 * @param str 写入文件内容
 */
exports.write_log = function (file_prix,str)
{
    var file_name = file_prix + '-' + (new Date()).getFullYear()+'-'+(new Date()).getMonth() + '-' + (new Date()).getDate() + '.log';//log名称

    var content = {
        'content':str,
        'created_ts': Date.now()
    }
    fs.appendFile(log_path + file_name,JSON.stringify(content) + '\n\r',(err)=>{
        if(!err) console.log('Additional content succeeded');//追加内容完成 log
    });
}
