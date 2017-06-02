//判断是否登陆 否则跳转至登陆页面
var TELNO; //客服电话号码
var AGENTID; //客服号
var RELATION; //所属列队

$(document).ready(
    function () {
        if (AV.User.current() == null) {
            window.location.href = "../index.html";
        } else {
            var user = AV.User.current();
            var query = new AV.Query('ServiceAgent');
            query.equalTo('Account', user);
            query.first().then(function (result) {
                $("#onlineAgent").attr('href','http://realtime.leanapp.cn/agent/'+result.id);
                var AgentName = result.get("AgentName");
                var AgentID = result.get("AgentID");
                $("#username").text(AgentName);
                var isMonitor = result.get("IsMonitor");
                //保存到全局变量 方便后面调用云函数改变状态等
                TELNO = result.get("TelNo");
                AGENTID = result.get("AgentID");
                RELATION = result.relation("WorkQueues");
                searchStatu(AGENTID); //查询当前客服状态
                if (isMonitor) ShowMonitorMenu(); //班长显示更多菜单功能
                // 每次调用生成一个聊天实例
                createNew(['1', '2']);
                bindEvent(); //权限menu生成后 再绑定event
            }, function (error) {
                layer.msg('查询错误', {
                    shift: 6,
                    time: 600
                })
            });
            timeDisplay(); //显示本地时间

            //动态设置左边导航栏高度 以便添加滑动效果
            var win_h = $(window).height();
            $(".left-menu").css("height", (win_h - 50) + "px");
            $(".left-menu").css("overflow-y", "scroll");
            var t = "http://www.91ebu.com/leancloudrealtime/worker.html?id=" + user.id;
            $("#chatRoomUrl").attr("href", t); //坐席聊天室url传入当前current userid参数
            laydate.skin('molv');

            //右边小浮窗显示待操作日程数量
            ScheduleReminderCount(false);

            Interval = setInterval(Intervalfuc,1000*10); //每20min再次提醒
        }
    }
);

/*
 * 
 * 显示班长权限的 菜单
 * 
 */
function ShowMonitorMenu() {
    var html = '';
    html += '<li class="menu-list"><a class="btn">坐席班长<i class="arrow"></i></a>' +
        '<ul>' +
        '<li><a href="view/Monitor/QueueList.html" target="menuFrame">队列管理</a></li>' +
        '<li><a href="view/ServiceAgent/AgentList.html" target="menuFrame">坐席管理</a></li>' +
        /*'<li><a href="view/AgentRecord/historyRecord.html" target="menuFrame">通话记录管理</a></li>' +
         '<li><a href="view/Monitor/WorkHistory.html" target="menuFrame">销售工单管理</a></li>' +
         '<li><a href="view/Monitor/ComplainHistory.html" target="menuFrame">投诉工单管理</a></li>' +*/
        '</ul>' +
        '</li>';
    $(".menu").append(html);
}

/*
 * 处理收到的所有push消息
 * 格式如下
 * 1：{"eventType":"she","_channel":"2"}
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
    console.log("index recive data = "+data);
    if (data._channel == '1') {

        if (data.agentid != AgentIDChange(AGENTID)) { //推送消息不是推送给当前客服 忽略此消息
            return;
        }
        var statu = data.agentstate;
        showStatu(statu); //根据返回状态 改变指示灯颜色和text
    } else if (data._channel == '2') {//有提醒事项 则播放提示音和闹铃震动
        openFloatSd();
        ScheduleReminderCount(true);
        shakeMain(data.eventType, true);
    }
}

//对应事项震动 t：string 事件类型  s:bool-是否增加震动
function shakeMain(t, s) {
    if (t == 'she' && s) {//预约事项
        $('.rs-content-1').addClass('shake-little');
    } else if (t == 'aler' && s) {
        $('.rs-content-2').addClass('shake-little');
    } else if (t == 'coun' && s) { //咨询事项
        $('.rs-content-3').addClass('shake-little');
    }
}

function play() {
    $('#audioDiv').html('<audio autoplay="autoplay"><source src="js/newMsg.mp3"'
        + 'type="audio/wav"/><source src="js/newMsg.mp3" type="audio/mpeg"/></audio>');
}

function arrowDirection(eleObj) {
    if (eleObj.attr('class') == 'arrow') {
        eleObj.attr('class', 'arrowDown');
    } else {
        eleObj.attr('class', 'arrow');
    }
}
/*
 * 
 * 绑定左边菜单栏点击展开子菜单事件
 */
function bindEvent() {
    $('.btn').click(function () {
        arrowDirection($(this).find('i'));
        $(this).next('ul').slideToggle('fast');
    });
    $('#ad_setting').click(function () {
        $('#ad_setting_ul').toggle();
    });
}

function setpass() {
    $('#menuFrame').attr('src', 'a.html');
}
//时间显示
function timeDisplay() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    var timeString = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    $('.time_display').text(timeString);
    setTimeout(timeDisplay, 1000);
}
//退出登录
function logout() {
    if (confirm("确定要注销吗？")) {
        var query = RELATION.query();
        query.find({
            success: function (work) {
                var len = work.length;
                for (var j = 0; j < len; j++) {
                    var obj = work[j];
                    var qID = obj.get("QueueID");
                    OffWork(TELNO, AgentIDChange(AGENTID), qID, len); //下班
                }
            }
        });
    }
}

/*
 * 
 * 查询状态 
 */
function searchStatu(agentID) {
    var agentID = AgentIDChange(agentID);
    var data = {
        'func': 'ivr',
        'funcdes': 'queryagentstate',
        'opernode': 'QueryAgentState',
        'operparam': {
            'agentid': agentID
        }
    }
    AV.Cloud.run('RLCallIvrApi', data, {
        success: function (data) {
            // 调用成功，得到成功的应答data
            var statu = data.Response.agents.agent.state;
            showStatu(statu);
        },
        error: function (err) { //查询状态为空
            // 处理调用失败
            console.log(err);
            AgentStartWorkAndGoToSystem(TELNO, AGENTID, RELATION);
        }
    });
}
/*
 * 下班
 * 
 */
var count = 0; //队列数
function OffWork(telNo, AgentID, agenttype, len) {
    var data = {
        'func': 'ivr',
        'funcdes': 'agentoffwork',
        'opernode': 'AgentOffWork',
        'operparam': {
            'number': telNo,
            'agentid': AgentID,
            'agenttype': agenttype
        }
    }
    AV.Cloud.run('RLCallIvrApi', data, {
        success: function (data) {
            // 调用成功，得到成功的应答data
            count += 1;
            if (count == len) {
                AV.User.logOut();
                window.location.href = "../index.html";
            }
        },
        error: function (err) {
            // 处理调用失败
            if (err.code == 1) {
                window.location.href = "../index.html";
            } else {
                layer.msg('操作失败，请联系管理员' + err.message, {});
            }
        }
    });
}
/*
 * 切换状态
 * th:当前点击dom对象  主要用户获取data值 即为当前状态
 */
function changeStatu(th) {
    if (!door) {
        layer.msg('当前网络异常，请稍后再试', {
            time: 20000, //20s后自动关闭
            btn: ['明白了']
        });
        return;
    }
    $(th).css("cursor", "wait"); //光标成等待状态
    var statu = $(th).attr("data");
    switch (parseInt(statu)) {
        case 0:
            changStatuByCloud(AgentIDChange(AGENTID), RELATION, true); //调用云函数改变状态
            break;
        case 1:
            changStatuByCloud(AgentIDChange(AGENTID), RELATION, false); //调用云函数改变状态
            break;
        default:
            break;
    }
}
/*
 * 根据状态显示指示灯颜色和文字
 * 
 */
function showStatu(statu) {
    var statu = parseInt(statu);
    switch (statu) {
        case 0:
            $("#statu-div").attr("data", "0");
            $(".statu-icon").removeClass().addClass("statu-icon ready");
            $(".statu-text").html("准备中");
            $(".statu-div").css("cursor", "pointer");
            break;
        case 1:
            $("#statu-div").attr("data", "1");
            $(".statu-icon").removeClass().addClass("statu-icon start");
            $(".statu-text").html("准备就绪");
            $(".statu-div").css("cursor", "pointer");
            break;
        case 2:
            $("#statu-div").attr("data", "2");
            $(".statu-icon").removeClass().addClass("statu-icon locking");
            $(".statu-text").html("坐席锁定");
            $(".statu-div").css("cursor", "not-allowed");
            break;
        case 3:
            $("#statu-div").attr("data", "3");
            $(".statu-icon").removeClass().addClass("statu-icon calling");
            $(".statu-text").html("通话中");
            $(".statu-div").css("cursor", "not-allowed");
            break;
        default:
            break;
    }
}

/*
 * 
 * 调用云函数改变状态
 * statu：调用后的状态false true
 */
function changStatuByCloud(AgentID, relation, statu) {
    var query = relation.query();
    query.find({
        success: function (work) {
            var len = work.length;
            for (var j = 0; j < len; j++) {
                var obj = work[j];
                var qID = obj.get("QueueID");
                funca(AgentID, qID, statu, len);
            }
        }
    });
    var count = 0;

    function funca(AgentID, qID, statu, len) {
        var data = {
            'func': 'ivr',
            'funcdes': 'agentready',
            'opernode': 'AgentReady',
            'operparam': {
                'agentid': AgentID,
                'agenttype': qID,
                'state': statu,
                'priority': 'false'
            }
        }
        AV.Cloud.run('RLCallIvrApi', data, {
            success: function (data) {
                // 调用成功，得到成功的应答data
                count += 1;
                if (count == len) {
                    console.log("改变状态成功");
                }
            },
            error: function (err) {
                // 处理调用失败
                console.log(err);
            }
        });

    }
}

/*
 * 坐席上班
 * 
 */
function AgentStartWorkAndGoToSystem(telNo, AgentID, relation) {
    var query = relation.query();
    query.find({
        success: function (work) {
            var len = work.length;
            for (var j = 0; j < len; j++) {
                var obj = work[j];
                var qID = obj.get("QueueID");
                StartWork(telNo, AgentID + 1000, qID, len); //上班状态 加入列队
            }
        }
    });
}

/*
 * 
 * 登录后 获取所属列队 调用云函数，进入上班状态
 * @telNo:电话号码
 * @AgentID：客服号 格式0001
 * @qID：队列号
 */
var count = 0; //记录加入列队数
function StartWork(telNo, AgentID, qID, len) {
    var data = { //上班
        'func': 'ivr',
        'funcdes': 'agentonwork',
        'opernode': 'AgentOnWork',
        'operparam': {
            'number': telNo,
            'agentid': AgentID,
            'agenttype': qID,
            'agentstate': '0'
        }
    }
    //第一次调用上班接口 设置agentstate=0 准备中
    AV.Cloud.run('RLCallIvrApi', data, {
        success: function (data) {
            // 调用成功，得到成功的应答data
            count += 1;
            if (count == len) {
                showStatu(0); //上班成功后状态准备中
                console.log('上班成功');
            }
        },
        error: function (err) {
            // 处理调用失败
            if (err.code == 1) {
                //window.location.href = "Agent/index.html";
            } else {
                layer.msg('操作失败，请联系管理员' + err.message, {});
            }
            console.log(err);
        }
    });
}
/*
 统计待提醒和待确认日程数量 isAudio:是否播放声音
 */
function ScheduleReminderCount(isAudio) {
    var queryCount = new AV.Query('EventsCalendar');
    var queryCount2 = new AV.Query('EventsCalendar');
    var queryCounsel1 = new AV.Query('Counsel');
    var queryCounsel2 = new AV.Query('Counsel');

    queryCount.equalTo('Statu', 1);
    queryCount2.equalTo('Statu', 11);

    queryCounsel1.equalTo('Statu', 1);
    queryCounsel2.equalTo('Statu', 3);

    var queryCounsel = new AV.Query.or(queryCounsel1, queryCounsel2);

    queryCount.greaterThan('ConfirmAT', new Date());
    queryCount2.greaterThan('ConfirmAT', new Date());
    queryCount.count().then(function (count) {
        queryCount2.count().then(function (count2) {
            queryCounsel.count().then(function (count3) {
                $('#sr-waitSure').html(count);
                $('#sr-waitAler').html(count2);
                $('#sr-waitReplay').html(count3);
                if (count || count2 || count3) { //有新提醒才弹出窗口
                    if(isAudio)play();
                    //openFloatSd();
                    if (count) shakeMain('she');
                    if (count2) shakeMain('aler');
                    if (count3) shakeMain('coun');
                }
            });
        });
    });
}
/**
 * 查询待提醒列表 如果有待处理日程 择弹出提醒框提醒
 * @constructor
 */
var ISREMIND = false;
function Intervalfuc() {
    var query = new AV.Query('EventsCalendar');
    query.equalTo('Statu',11);
    var now = new Date();
    query.greaterThan('ConfirmAT',now);
    query.lessThanOrEqualTo('RemindAT',now);
    query.equalTo('IsRemind',false);
    query.find().then(function (results) {
        var len = results.length;
        for(var i = 0 ;i<len;i++){
            results[i].set('IsRemind',true);
            results[i].save();
        }
        if(len){
            ScheduleReminderCount(true);
            if(!$('.rs-content-2').hasClass('shake-little')){
                shakeMain('aler',true);
            }
            openFloatSd();
        }
    })
}
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10;//翻页大小默认为10
var query = new AV.Query('EventsCalendar');
//日程列表
function ScheduleReminderList(type) {
    var queryA = new AV.Query('EventsCalendar');
    var queryB = new AV.Query('EventsCalendar');
    queryA.equalTo('Statu', 1);
    queryB.equalTo('Statu', 11);
    if (type == 1) {//待确认
        query.equalTo('Statu', 1);
    } else { //待提醒
        query.equalTo('Statu', 11);
    }
    query.greaterThan('ConfirmAT', new Date());
    query.include('EventType');
    query.include('Doctor');
    query.include('Hospital');
    query.include('Member');
    if (type == 1) {//待确认
        query.descending('createdAt');
    } else { //待提醒
        query.descending('RemindAT');
    }
    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query);//显示当前页数据

}
//把query后的结果集输出到table中便于公用
function ShowObject(results) {
    var len = results.length;
    var html = '';
    for (var i = 0; i < len; i++) {
        var obj = results[i];
        var Id = obj.id;
        var EventType = obj.get('EventType') ? obj.get('EventType').get('EventTypeName') : '无';
        var ConfirmAT = obj.get('ConfirmAT');
        var RemindAT = obj.get('RemindAT') ? obj.get('RemindAT') : '待设置';
        var Hospital = obj.get('Hospital') ? obj.get('Hospital').get('HospitalName') : '无';
        var Doctor = obj.get('Doctor') ? obj.get('Doctor').get('DoctorName') : '无';
        var MemberName = obj.get('Member') ? obj.get('Member').get('MemberName') : '无';
        var Statu = obj.get('Statu');
        if (Statu == '1') {
            var str = '<a href="javascirpt:;" id="' + Id + '" onclick="confirmTime(this)" class="btn btn-success btn-xs">确认</a>';
        } else if (Statu == '11') {
            var str = '<a href="javascirpt:;" id="' + Id + '" onclick="remindFNshed(this)" class="btn btn-primary btn-xs">已提醒</a>';
        }
        html += '<tr>' +
            '<td>' + str + '</td>' +
            '<td>' + changeTime(RemindAT) + '</td>' +
            '<td>' + timeToString(ConfirmAT) + '</td>' +
            '<td class="table-doctor" title="' + Doctor + '">' + Doctor + '</td>' +
            '<td class="table-MemberName" title="' + MemberName + '">' + MemberName + '</td>' +
            '<td class="table-Hospital" title="' + Hospital + '">' + Hospital + '</td>' +
            '<td><label>' + EventType + '</label></td>';
        html += '</tr>';
    }
    if (html != '') {
        $("#table-body").html(html);
    } else {
        $("#table-body").html('<td class="null-td" colspan="7">暂无记录</td>');
    }
    $("#dtBox").DateTimePicker({
        dateFormat: "yyyy-mm-dd"
    });
}
//确认日程弹出层
function confirmTime(th) {
    var id = $(th).attr('id');
    var confirm = $(th).parent().next().next().html();
    //页面层
    layer.open({
        title: '确认预约',
        type: 1,
        skin: 'layui-layer-rim', //加上边框
        area: ['300px', '230px'], //宽高
        content: '<div class="marginB10"><p>确认预约时间</p>' +
        '<div class="my-layer-input"><input id="confirm-time"value="' + confirm + '" data=' + id + ' placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>' +
        '<p>选择提醒时间</p>' +
        '<div class="my-layer-input"><input id="cf-time" data=' + id + ' placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>' +
        '<div class="text-center margintop10"><input type="button" class="btn btn-danger" value="确认" onclick="confirmEvent()"></div></div>'
    });
}
//确认日程
function confirmEvent() {
    var confirmvalue = $('#confirm-time').val();
    var confirmTime = new Date(confirmvalue);
    var value = $('#cf-time').val();
    var time = new Date(value);
    if (confirmvalue == '') {
        layer.msg('请输入预约时间');
        return;
    }
    if (value == '') {
        layer.msg('请输入提醒时间');
        return;
    } else if (time < new Date()) {
        layer.msg('提醒时间不能小于当前时间');
        return;
    } else if (time > confirmTime) {
        layer.msg('提醒时间不能在预约时间之后');
        return;
    }
    var id = $('#cf-time').attr('data');
    var myEvent = AV.Object.createWithoutData('EventsCalendar', id);
    myEvent.set('RemindAT', time);
    myEvent.set('ConfirmAT', confirmTime);
    myEvent.set("MemberConfirm", 1);
    myEvent.set('Statu', 11);
    myEvent.save().then(function (event) {
        layer.msg('操作成功', {time: 800}, function () {
            $(".layui-layer-close1").click();
            ScheduleReminderList($('#eventType').val());
        });
    })
}
function remindFNshed(th) {
    layer.confirm('确认已提醒？', {
        btn: ['确认', '取消'] //按钮
    }, function () {
        var id = $(th).attr('id');
        var myEvent = AV.Object.createWithoutData('EventsCalendar', id);
        myEvent.set('Statu', 21);
        myEvent.save().then(function (event) {
            layer.msg('操作成功', {time: 800}, function () {
                ScheduleReminderList($('#eventType').val());
            });
        })
    }, function () {

    });

}
function closeRemindDiv() {
    $(".ScheduleReminder-div").css('right', "-570px");
}
/****************翻页********************/
/*
 * 全局变量     page query
 * 调用函数    ShowObject(results);
 * pageNumber：翻页大小
 */
/*
 * 翻也主函数
 */
function pageChange(tag) {
    if (tag == "nextpage") {
        page++;
        if (page * pageNumber >= maincount) {
            layer.msg("没有了", {
                shift: 6,
                time: 600
            });
            page--;
            return false;
        }
    }
    if (tag == "pastpage") {
        if (page > 0) {
            page--;
        } else {
            layer.msg("没有了", {
                shift: 6,
                time: 600
            });
            return false;
        }
    }
    if (tag == "index") {
        page = 0;
    }
    if (tag == "end") {
        page = totlePage - 1;
    }
    $("#now").text(page + 1); //显示当前页数
    showNowPageResults(query);
}
/*
 * 显示页数和总数
 *
 */
function showPages(qu) {
    qu.count({
        success: function (count) {
            maincount = count;
            totlePage = Math.ceil(maincount / pageNumber); //向上取整 获取总页数
            $("#maincount").text(maincount);
            $("#totle").text(totlePage); //显示总页数
            $("#now").text(page + 1); //显示当前页数
        }
    });
}
/*
 * 显示当前页数据
 *
 */
function showNowPageResults(qu, pageName) {
    qu.limit(pageNumber);
    qu.skip(pageNumber * page);
    qu.find({
        success: function (results) {
            ShowObject(results, pageName);
        }
    });
}

function eventTypeChange(th) {
    page = 0;
    ScheduleReminderList($(th).val());
}
/*
 *
 * 国际标准时间 转换为2016-01-01 15:50:00格式
 *
 */
function timeToString(time) {
    if (time) {
        return time.getFullYear() + '-' + ToTime(time.getMonth() + 1) + "-" + ToTime(time.getDate()) + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes()) + ":" + ToTime(time.getSeconds());
    } else {
        return " ";
    }
}
/*
 * 时间装换函数
 *
 *
 *
 */
function ToTime(time) {
    if (time >= 0 && time < 10) {
        time = "0" + time;
    }
    return time;
}
//更据时间戳 算出离现在时间的差  用文字体现 比如  10分钟前
function changeTime(time) {
    if (time == '待设置') {
        return '待设置';
    }
    var nowDate = new Date();
    var date3 = time - nowDate.getTime(); //时间差的毫秒数
    //计算出相差天数
    var days = Math.floor(date3 / (24 * 3600 * 1000));

    //计算出小时数
    var leave1 = date3 % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000));
    //计算相差分钟数
    var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
    var minutes = Math.floor(leave2 / (60 * 1000));
    //计算相差秒数
    var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
    var seconds = Math.round(leave3 / 1000);
    if (days > 0) {
        return '<label class="text-color-2">' + days + '天后' + '</label>';
    }
    if (hours > 0) {
        return '<label class="text-color-1">' + hours + "小时后" + '</label>';
    }
    if (minutes > 0) {
        return '<label class="text-color-1">' + minutes + "分钟后" + '</label>';

    }
    if (seconds > 0) {
        return '<label class="text-color-1">' + seconds + "秒后" + '</label>';

    } else {
        return '<label class="text-color-3">已超时</label>';

    }
}
function openSRFloat() {
    ScheduleReminderCount(false);
    openFloatSd();
}
function openFloatSd() {
    if($(".ScheduleReminder-float").css('right')!='0px'){
        $(".ScheduleReminder-float").css({
            right: '0px',
        });
    }
}
function closeSRFloat() {
    $(".ScheduleReminder-float").css({
        right: '-270px',
    });
    $('.sr-icon').removeClass('shake-little');
}
//打开对应的提醒窗口
function openNewWind(t) {
    var url;
    if (t == 1) {//待确认
        $('.rs-content-1').removeClass('shake-little');
        url = 'view/Reminder/ReminderList.html?tab=1';
    } else if (t == 2) {//待提醒
        $('.rs-content-2').removeClass('shake-little');
        url = 'view/Reminder/ReminderList.html?tab=2';
    } else if (t == 3) {//新咨询
        $('.rs-content-3').removeClass('shake-little');
        url = 'view/Counsel/CounselList.html';
    }

    $("#menuFrame").attr('src', url);
}