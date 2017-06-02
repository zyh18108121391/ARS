/**
 * Created by 郑银华 on 2017/4/12.
 */
var AGENT; //客服
var AgentID; //id
var CID;
var COUNSELID; //当前拨号的咨询记录的id
var THIS; //当前拨打电话对应的dom对象
var RECORDID;//通话记录ID
var Pageflag = false;//记录是否弹出备注输入框
$(document).ready(function () {
    //查询当前客服id
    var user = AV.User.current();
    var query = new AV.Query('ServiceAgent');
    query.equalTo('Account', user);
    query.first().then(function(result) {
        AGENT = result;
        AgentID = result.get("AgentID");
    }, function(error) {
    });

    createNew();
    //时间插件皮肤初始化
    laydate.skin('molv');

    //切换tab选项卡显示数据
    var tab = getUrlParam('tab');
    TabControl(tab);
    if(tab==1){
        ScheduleReminderList(1)
    }
});

//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber =10;//翻页大小默认为10
var query = new AV.Query('EventsCalendar');
//日程列表
function ScheduleReminderList(type) {
    console.log('1');
    if (type == 1) {//待确认
        query.equalTo('Statu', 1);
    } else { //待提醒
        query.equalTo('Statu', 11);
    }
    query.greaterThan('ConfirmAT',new Date());
    query.include('EventType');
    query.include('Doctor');
    query.include('Hospital');
    query.include('ConsultingRoom');
    query.include('Member');
    if (type == 1) {//待确认
        query.descending('createdAt');
    } else { //待提醒
        query.descending('RemindAT');
    }
    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query);//显示当前页数据

}


/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
    if(data.agentid != AgentIDChange(AgentID)) { //推送消息不是推送给当前客服 忽略此消息
        return;
    }
    var objectID = data.objectID; //agentconversation的id
    if(data.connect){ //外呼 用户接通电话
        changeCallBtn(THIS);//按钮改为挂断电话
    }
    if(objectID) {
        RECORDID = objectID;//保存通话记录id
    }
    var statu = data.agentstate;
    if(statu == '0') { //状态切换为0时执行
        //如果按钮已经是"拨打电话的情况 则不执行"
        var type = $(THIS).attr("date-type");
        if(type!='call'){
            changeCallBtn(THIS,true);
        }
        //如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
        if(RECORDID&&Pageflag){
            Pageflag=false;
            SetRecordMemo(RECORDID,'norush');
        }
    }
}

function TabControl(type) {
    page = 0;
    if (type == '1') {
        $(".addQueBtn1").addClass("check-active");
        $(".addQueBtn2").addClass("active2");
        $(".addQueBtn2").removeClass("check-active");
        $(".addQueBtn1").removeClass("active1");
        $("h1").html('预约:待确认列表');
        $("#tabControl").attr('type', '1');
    } else {
        $(".addQueBtn2").addClass("check-active");
        $(".addQueBtn1").addClass("active1");
        $(".addQueBtn1").removeClass("check-active");
        $(".addQueBtn2").removeClass("active2");
        $("h1").html('预约:待提醒列表');
        $("#tabControl").attr('type', '2');
    }
    ScheduleReminderList(type);
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
        var RemindAT = obj.get('RemindAT') ? obj.get('RemindAT') : '';
        var Hospital = obj.get('Hospital') ? obj.get('Hospital').get('HospitalName') : '无';
        var ConsultingRoom = obj.get('ConsultingRoom') ? obj.get('ConsultingRoom').get('RoomName') : '无';
        var Doctor = obj.get('Doctor') ? obj.get('Doctor').get('DoctorName') : '无';
        var MemberName = obj.get('Member') ? obj.get('Member').get('MemberName') : '无';
        var Statu = obj.get('Statu');
        var tellNo =obj.get('Member') ? obj.get('Member').get('MobilePhoneNo') : '无';
        if (Statu == '1') {
            var str = '<a href="javascirpt:;" id="' + Id + '" onclick="confirmTime(this)" class="btn btn-success btn-xs">确认</a>' +
                '<span class="btn btn-primary btn-xs remind-call" date-type="call" name="' + tellNo + '" onclick="call(this,\'' + Id + '\')">拨打电话</span>';
            var remindTr = '<td>待设置</td>';
        } else if(Statu == '11'){
            var str = '<a href="javascirpt:;" id="' + Id + '" onclick="remindFNshed(this)" class="btn btn-primary btn-xs">已提醒</a>' +
                '<a href="javascirpt:;" id="' + Id + '" onclick="editTime(this)" class="r-editTime-a">编辑</a>' +
                '<span class="btn btn-primary btn-xs remind-call" date-type="call" name="' + tellNo + '" onclick="call(this)">拨打电话</span>';
            var remindTr ='<td time="'+timeToString(RemindAT)+'">' + changeTime(RemindAT) + '</td>';
        }
        html += '<tr>' +
            '<td class="table-doctor" title="'+Doctor+'">' + Doctor + '</td>' +
            '<td class="table-MemberName" title="'+MemberName+'">' + MemberName + '</td>' +
            '<td class="table-Hospital" title="'+Hospital+'">' + Hospital + '</td>' +
            '<td class="table-Roo" title="'+ConsultingRoom+'">' + ConsultingRoom + '</td>' +
            '<td><label>' + EventType + '</label></td>'+
            '<td>' + timeToString(ConfirmAT) + '</td>' +
                remindTr+
            '<td>' + str + '</td>';
        html += '</tr>';
    }
    if (html != '') {
        $("#table-body").html(html);
    } else {
        $("#table-body").html('<tr><td class="null-td" colspan="8">暂无记录</td></tr>');
    }
}
//确认日程弹出层
function confirmTime(th) {
    var id = $(th).attr('id');
    var confirm  = $(th).parent().prev().prev().html();
    //页面层
    layer.open({
        title: '确认预约',
        type: 1,
        skin: 'layui-layer-rim', //加上边框
        area: ['300px', '230px'], //宽高
        content: '<div class="marginB10"><p>确认预约时间</p>' +
        '<div class="my-layer-input"><input id="confirm-time" value="'+confirm+'" data=' + id + ' placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>'+
        '<p>选择提醒时间</p>' +
        '<div class="my-layer-input"><input id="cf-time" data=' + id + ' placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>' +
        '<div class="text-center margintop10"><input type="button" class="btn btn-danger" value="确认" onclick="confirmEvent()"></div></div>'
    });
}
/**
 * 修改时间
 */
function editTime(th) {
    var id = $(th).attr('id');
    var confirm  = $(th).parent().prev().prev().html();
    var remind = $(th).parent().prev().attr('time');
    //页面层
    layer.open({
        title: '编辑预约',
        type: 1,
        skin: 'layui-layer-rim', //加上边框
        area: ['300px', '230px'], //宽高
        content: '<div class="marginB10"><p>确认预约时间</p>' +
        '<div class="my-layer-input"><input id="confirm-time" value="'+confirm+'" data=' + id + ' placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>'+
        '<p>提醒时间</p>' +
        '<div class="my-layer-input"><input id="cf-time" value="'+remind+'" data=' + id + ' placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>' +
        '<div class="text-center margintop10"><input type="button" class="btn btn-danger" value="确认" onclick="confirmEvent()"></div></div>'
    });
}
//确认日程
function confirmEvent() {
    var confirmvalue = $('#confirm-time').val();
    var confirmTime = new Date(confirmvalue);
    var value = $('#cf-time').val();
    var time = new Date(value);
    if(confirmvalue == ''){
        layer.msg('请输入预约时间');
        return;
    }
    if (value == '') {
        layer.msg('请输入提醒时间');
        return;
    } else if (time < new Date()) {
        layer.msg('提醒时间不能小于当前时间');
        return;
    }else if(time>confirmTime){
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
            ScheduleReminderList($("#tabControl").attr('type'));
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
                ScheduleReminderList($("#tabControl").attr('type'));
            });
        })
    });
}
/****************翻页********************/
/*
 * 全局变量     page query
 * 调用函数    ShowObject(results);
 * pageNumber：翻页大小
 */
/*
 * 翻页主函数
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

/*
 *
 * 获取url参数
 */
function getUrlParam(name) {
    //构造一个含有目标参数的正则表达式对象
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    //匹配目标参数
    var r = window.location.search.substr(1).match(reg);
    //返回参数值
    if(r != null) return unescape(r[2]);
    return null;
}
/*
 *
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
    return id + 1000;
}