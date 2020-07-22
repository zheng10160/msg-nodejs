<?php

/**
 * Created by PhpStorm.
 * User: localuser1
 * Date: 2018/3/23
 * Time: 下午3:39
 */
class gameServer
{
    private $online_redis_key = 'senseplay';//在线列表的redis key

    /**
     * 通用获取在线列表
     */
    public function filter_online()
    {

        if($_POST && isset($_POST['user_list'])){

            try{
                $p_list = json_decode($_POST['user_list'],true);
                if(is_array($p_list) && !empty($p_list)){

                    $online_list = $this->getOnlineNum();//获取在线redis 列表

                    $this->show_json(0,'success',$this->filterOnlineList($p_list,$online_list));

                }

                $this->show_json(100000,'data can not be empty');
            }catch (Exception $e){
                echo "mmm\n";
            }

        }

        $this->show_json(100000,'request error');
    }

    /**
     * @param $code
     * @param string $mess
     * @param array $data
     */
    protected function show_json($code, $mess='', $data=array()) {
        header('Content-Type: application/json; charset=utf-8');
        $json = array('code'=>$code, 'message'=>$mess, 'data'=>$data);
        $json = json_encode($json);
        exit($json);
    }

    /**
     * 返回在线所有人的userid
     * @return array
     */
    protected function getOnlineNum()
    {
        $redis = new redis();
        $redis->connect('192.168.99.61',6379);
        $redis->auth('123456');

        $redis->select(5);

        $key = $this->online_redis_key.':onlinelist';

        $online_data = $redis->hGetAll($key);

        if($online_data && is_array($online_data)){
            return array_keys($online_data);//返回在线人数的uid
        }

        return [];//否则返回空数组 说明没有人在线

    }

    /**
     * 过滤不在线人数
     * @param $p_list
     * @param $online_list
     * @return array|bool
     */
    protected function filterOnlineList($p_list,$online_list)
    {

        if(is_array($p_list) && is_array($online_list)){

            $list =  array_intersect($online_list,$p_list);//取交集 就是在线人数列表

            return $list;
        }

        return false;
    }

    public function Test()
    {
        $redis = new redis();
        $redis->connect('192.168.99.61',6379);
        $redis->auth('123456');

        $redis->select(5);

       $data1 = $redis->zrange('senseplay:msg_receiver_user_key:152317434113219346152335943197773780152317434113219346',0,-1);




        $n = $redis->zunionstore('senseplay:msg_all_log:152317434113219346152335943197773780',array('senseplay:msg_receiver_user_key:152317434113219346152335943197773780152317434113219346'));

        $data2 = $redis->zrange('senseplay:msg_all_log:152317434113219346152335943197773780',0,-1);
        echo '<pre>';

        print_r(['data1'=>$data1,'data2'=>$data2,'n'=>$n]);

    }
}

$n = new gameServer;
$n->Test();
//$n->filter_online();

