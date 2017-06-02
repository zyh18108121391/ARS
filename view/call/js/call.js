var EventsCalendar = AV.Object.extend('EventsCalendar');
var Doctor = AV.Object.extend('Doctor');
var EventType = AV.Object.extend("EventType");
var Hospital = AV.Object.extend("Hospital");
var ConsultingRoom = AV.Object.extend("ConsultingRoom");
var AgentConversationRecord = AV.Object.extend("AgentConversationRecord");



var resultArray = [],//保存云函数获取的值
    selectedOtherTime = 0,
    selectedValue = 0,
    MEMBER,
    MEMBERID,
    AGENT,
    HospitalName,
    PersonalButler,
    PhoneNo;//拨打热线的电话号码

$(document).ready(function () {
    if (!getUrlParam("callout")) {
        $(".call-showDiv").show();
        showCall(); //显示热线信息
    } else {
        $(".callOut-showDiv").show();
        $("#call-title").html('去电客户基本信息');
    }
    searchByUrlID(); //根据url
    bindEvent(); //绑定事件集合
    showDocotr(); //显示医生到待选列表
    searchStatu(getUrlParam("AgentID"));//
    createNew();
});
/*
 * 
 * 显示热线信息 根据url
 */
function showCall() {
    var AgentID = getUrlParam("AgentID");
    var callid = getUrlParam("callid");
    var query = new AV.Query("AgentConversationRecord");
    query.equalTo("CalIID", callid);
    query.equalTo("AgentID", AgentID);
    query.first({
        success: function (result) {
            var QID = result.get("QueueID");
            var IsQueue = result.get("IsQueue") ? "是" : "否";
            AGENT = result.get("Agent"); //顺便获取agent 方便后面新建咨询
            PhoneNo = result.get("ToTelNo");
            var query1 = new AV.Query("ServiceQueue");
            var AlertingTime = result.get("AlertingTime") ? result.get("AlertingTime") : null;
            var RecordID = result.id;
            query1.equalTo("QueueID", QID);
            query1.first({
                success: function (qu) {
                    var qName = qu.get("QueueName");
                    $("#QueueName").html(qName);
                    $("#QueueName").attr("data", RecordID);
                    $("#IsQueue").html(IsQueue);
                    if (AlertingTime) {
                        $("#AlertingTime").html(alertingTimeChange(AlertingTime));
                    } else {
                        //页面打开开始计时响铃
                        $('#AlertingTime').timer({
                            format: '%m 分 %s 秒'
                        });
                    }
                }
            });
        }
    });
}

/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
    if (data.agentid != getUrlParam("AgentID")) { //推送消息不是推送给当前客服 忽略此消息
        return;
    }
    if (data.callid == getUrlParam('callid') && data.connect) { //外呼 用户接通电话
        $(".calloutHpBtn").show();
    }
    var statu = data.agentstate;
    if (data.callid == getUrlParam('callid') && statu == '0' && getUrlParam("callout")) {//通话结束
        $(".calloutHpBtn").show();
        $(".calloutHpBtn").attr("value", "关闭页面");
        $(".calloutHpBtn").css('background-color', "#c9302c");
        $(".calloutHpBtn").css('border-color', "#ac2925");
        $(".calloutHpBtn").attr('onclick', 'backToCallOut()');

        var query = new AV.Query('AgentConversationRecord');
        query.equalTo('CalIID', getUrlParam('callid'));
        query.first().then(function (obj) {
            SetRecordMemo(obj.id, 'norush');
        });
    }
    if (statu == 3 || statu == 0 || statu == 4) {
        //响铃时间停止
        $('#AlertingTime').timer('remove');
        updateAlertingTime();
    }
}

/*
 * 挂断或者接通 记录振铃时间
 * 
 */
function updateAlertingTime() {
    var timeStr = $("#AlertingTime").html();
    var t = timeStr.split(' ');
    var minu = parseInt(t[0]) * 60 + parseInt(t[2]);
    var id = $("#QueueName").attr("data");
    var query = new AV.Query("AgentConversationRecord");
    query.get(id, {
        success: function (result) {
            result.set("AlertingTime", minu);
            result.save(null, {
                success: function (result) {
                    console.log("振铃时间记录成功");
                }
            });
        }
    });
}

/*
 * 
 * //显示医生到待选列表
 * 
 */
function showDocotr() {
    var query = new AV.Query('Doctor');
    query.find({
        success: function (results) {
            showDoctor(results);
        }
    });
}

//把query后的结果集输出到table
function showDoctor(results) {
    var len = results.length;
    var html = '';
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function (i) {
            var obj = results[i];
            var doctorId = obj.id;
            var DoctorName = '';
            if (obj.get("DoctorName") != null) {
                DoctorName = obj.get("DoctorName");
            }
            var QRImage = '';
            if (obj.get("QRImage") != null) {
                QRImage = obj.get("QRImage");
            }
            var HospitalArray = [];
            var ConsultingRoomArray = [];
            //获取医院
            var Hospital = obj.relation('Hospitals');
            Hospital.query().find({
                success: function (results) {
                    var len1 = results.length;
                    for (var i = 0; i < len1; i++) {
                        tep = results[i];
                        var Name = tep.get("HospitalName");
                        HospitalArray.push(Name);
                    }
                    //获取诊室
                    var ConsultingRoom = obj.relation('ConsultingRooms');
                    ConsultingRoom.query().find({
                        success: function (results) {
                            var len2 = results.length;
                            for (var i = 0; i < len2; i++) {
                                tap = results[i];
                                var Name = tap.get("RoomName");
                                ConsultingRoomArray.push(Name);
                            }
                            html += '<tr>' +
                                '<td>' + '<input type="radio" name="doctor" id=\"' + doctorId + '\" value=\"' + DoctorName + '\" />' + '</td>' +
                                '<td><img src="' + QRImage + '" width="30px"></td>' +
                                '<td>' + DoctorName + '</td>' +
                                '<td>' + HospitalArray.toString() + '</td>' +
                                '<td>' + ConsultingRoomArray.toString() + '</td>' +
                                '<tr>';
                            count += 1;
                            if (count == len) {
                                $("#table-doctor").html(html);
                            }
                        }
                    });
                }
            });
        })(i);
    }
}

/*
 * 
 * 根据URL查询会员
 */
function searchByUrlID() {
    var memID = getUrlParam("id");
    if (memID) { //如果是otherCall跳转过来的 URL中包含ID
        var MemQuery = new AV.Query('Member');
        MemQuery.include("MemberLevel");
        MemQuery.include("City");
        MemQuery.include("PersonalDoctor");
        MemQuery.include("Hospital");
        MemQuery.include("Account");
        MemQuery.get(memID, {
            success: function (obj) {
                showMemberMain(obj);
            }
        });
    }
}

/*
 * 根据电话号码查询 显示
 * 
 */
function searchByNumber() {
    var num = $('#callInput').val();
    if (num.length != 11) {
        layer.msg('请输入正确的号码');
        return;
    }
    var MemQuery = new AV.Query('Member');
    MemQuery.equalTo("MobilePhoneNo", num);
    MemQuery.include("MemberLevel");
    MemQuery.include("City");
    MemQuery.include("PersonalDoctor");
    MemQuery.include("Account");
    MemQuery.first({
        success: function (obj) {
            if (!obj) { //如果不存在
                window.location.href = "otherCall.html?id=" + num;
                layer.msg('陌生来电');
            } else {
                $(".jy").css("display", "none");
                showMemberMain(obj);
            }
        }
    });
}
/*
 * 显示近期日程
 * 
 */
function recentlyCalender(member) {
    var query = new AV.Query('EventsCalendar');
    query.equalTo('Member', member);
    query.notEqualTo('Statu', -999); //取消了的日程不显示
    query.include('EventType');
    query.include('Hospital');
    query.include('ConsultingRoom');
    query.include('MedicalResult');
    query.greaterThan('ConfirmAT', new Date());
    query.descending('createdAt');

    query.find({
        success: function (results) {
            ShowObject(results);
        }
    });
}

/*
 * 显示5条最近历史通话记录
 * 
 */

function RecentlyCallRecord(member) {
    var query = new AV.Query('AgentConversationRecord');
    query.equalTo('Member', member);
    query.descending('createdAt');
    query.include('Agent');
    query.limit(5);
    query.find({
        success: function (results) {
            var len = results.length;
            var html = '';
            for (var i = 0; i < len; i++) {
                var obj = results[i];
                var AgentName = obj.get('Agent') ? obj.get('Agent').get('AgentName') : '';
                var Duration = obj.get('Duration') ? obj.get('Duration') : '0';
                var RecordFile = '';
                var RecordFileURL = '';
                if (obj.get("RecordFile") != null) {
                    RecordFileURL = obj.get("RecordFile").url();
                    var leng = RecordFileURL.length;
                    RecordFile = '点击播放';
                }
                var Memo = obj.get('Memo') ? obj.get('Memo') : '';
                var Satisfaction = '';
                if (obj.get("Satisfaction") != null) {
                    Satisfaction = obj.get("Satisfaction");
                }
                var time = obj.createdAt;

                html += '<tr>' +
                    '<td>' + AgentName + '</td>' +
                    '<td>' + alertingTimeChange(Duration) + '</td>' +
                    '<td>' + '<span class="auto-text" data="' + RecordFileURL + '" onclick="play(this)">' + RecordFile + '</span>' + '</td>' +
                    '<td>' + Memo + '</td>' +
                    '<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' +
                    '<td>' + timeToString(time) + '</td>' +
                    '</tr>';

            }
            if (html != '') $("#CallRecordList").html(html);
        }
    });
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
        var Hospital = obj.get('Hospital') ? obj.get('Hospital').get('HospitalName') : '无';
        var ConsultingRoom = obj.get('ConsultingRoom') ? obj.get('ConsultingRoom').get('RoomName') : '无';
        var MedicalResult = obj.get('MedicalResult') ? obj.get('MedicalResult').get('MedicalResult') : '无';
        var Statu = obj.get('Statu');
        var DoctorConfirm = obj.get('DoctorConfirm');
        var MemberConfirm = obj.get('MemberConfirm');
        var RatingByMember = "未评分"
        var canstr = '';
        html += '<tr>' +
            '<td>' + EventType + '</td>' +
            '<td>' + timeToString(ConfirmAT) + '</td>' +
            '<td>' + Hospital + '</td>' +
            '<td>' + ConsultingRoom + '</td>' +
            '<td>' + MedicalResult + '</td>' +
            '<td>' + getStatus(Statu, DoctorConfirm, MemberConfirm) + '</td>' +
            '<td>' + RatingByMember + '</td>';
        html += '<td>';
        if (Statu == -969 || Statu == 1 || Statu == 11) {
            html += '<button class="btn btn-primary statuFuncs" data-btnName="' + getStatus(Statu, DoctorConfirm, MemberConfirm, 'dobtnName') + '" data-objId="' + Id + '" >' + getStatus(Statu, DoctorConfirm, MemberConfirm, 'dobtnString') + '</button>';
        }
        if (Statu != 31) {
            html += '<button class="btn btn-danger cancelBtn" data-objId="' + Id + '" >取消日程</button>';
        }
        html += '</td></tr>';
    }
    if (html != '') $("#tbody-list").html(html);

}
/*
 * 
 * 显示当前会员到整个页面 包括诊断历史 基本资料
 */
function showMemberMain(obj) {
    var doctorID = obj.get('PersonalDoctor').id;
    MEMBER = obj;
    MEMBERID = obj.id;

    recentlyCalender(obj); //查询最近日程
    RecentlyCallRecord(obj); //显示5条最近通话记录
    ShowEvent('EventType', "EventTypeName", "EventType"); //显示事件
    showTimeToSelect(doctorID); //查询当前会员的医生的时间安排到新建预约下拉列表
    showDocotrHosAndRoom(doctorID);

    var DoctorName = '';
    if (obj.get("PersonalDoctor") != null) {
        DoctorName = obj.get("PersonalDoctor").get('DoctorName');
        doctorHospital = obj.get('Hospital');
        HospitalName = obj.get('Hospital').get('HospitalName');
        doctorRomm = obj.get('PersonalDoctor').get("MainConsultingRoom");
    }
    if (obj.get("PersonalButler") != null) {
        PersonalButler = obj.get("PersonalButler");
    }
    var MemberName = '';
    if (obj.get("MemberName") != null) {
        MemberName = obj.get("MemberName");
    }

    var sex ='';
    if (obj.get("Sex") != null) {
        let sex1 = obj.get("Sex");
        if(sex1=='0'){
            sex = '男';
        }else if(sex1=='1'){
            sex = '女';
        }
    }
    var phoneNo = '';
    if (obj.get("AppendMobilePhoneNo") != null) {
        phoneNo = obj.get("AppendMobilePhoneNo");
    }
    var MobilePhoneNo = '';
    if (obj.get("MobilePhoneNo") != null) {
        MobilePhoneNo = obj.get("MobilePhoneNo");
    }

    var LevelName = '';
    if (obj.get("MemberLevel") != null) {
        LevelName = obj.get("MemberLevel").get("LevelName");
        if (LevelName == '普通用户') { //普通用户 不现实预约
            $(".member-div").css("display", "none");
        }
    }
    var JoinTime = '';
    if (obj.get("JoinTime") != null) {
        JoinTime = obj.get("JoinTime");
    }
    var LevelIconUrl = '';
    if (obj.get("MemberLevel") != null) {
        LevelIconUrl = obj.get("MemberLevel").get("LevelIcon").url();
    }
    var city = '';
    if (obj.get("City") != null) {
        city = obj.get("City").get("CityName");
    }

    var Activeness = '';
    if (obj.get("Activeness") != null) {
        Activeness = obj.get("Activeness");
    }
    var Satisfaction = '';
    if (obj.get("Satisfaction") != null) {
        Satisfaction = obj.get("Satisfaction");
    }
    var DiseaseArray = []; //疾病数组
    var Disease = obj.relation('Disease');
    Disease.query().find({
        success: function (result) {
            for (var j = 0; j < result.length; j++) {
                DiseaseArray.push(result[j].get('DiseaseName'));
            }
            $("#Name").html(MemberName+''+(sex?(" 【"+sex+"】"):''));
            $("#tellNo").html(MobilePhoneNo + (phoneNo?'(主),'+phoneNo:''));
            $(".phone-td").css('overflow-x','hidden');
            $("#Leval").html(LevelName + '<img src=\"' + LevelIconUrl + '\" width=\"15px\">');
            $("#JoinTime").html(timeToString(JoinTime));
            $("#Disease").html(DiseaseArray.toString());
            $("#City").html(city);
            $("#Satisfaction").html(getStartlevalDivPersonal(Satisfaction));
            $("#Activeness").html(getStartlevalDivPersonal(Activeness));

            $("#DoctorName").attr('data_id', doctorID);
            $("#DoctorName").html(DoctorName);

            //新建咨询窗口默认值设置
            $("#ask-doctor").attr("data", doctorID);
            $("#ask-doctor").html(DoctorName);
            $("#historyIframe").attr("src", "historyAdvisory.html?id=" + MEMBERID);
        }
    });
}

/*
 * 
 * 绑定事件集合
 * 
 */
function bindEvent() {
    //moveDivEvent();//div拖动
    //重新协调
    $('#tbody-list').on('click', '.statuFuncs', function () {
        var id = $(this).attr('data-objId');
        var btnname = $(this).attr('data-btnname');
        switch (btnname) {
            case 'newEditTime': //修改预约时间
                openEditTimeDiv(id, 'newEditTime');
                break;
            case 'newConfirm': //医生发起  确认预约
                confirmTime(id);
                break;
            case 'oldEditTime': //重新协调后 医生没确认前修改时间
                openEditTimeDiv(id, 'oldEditTime');
                break;
            case 'coordinate': //重新协调
                openEditTimeDiv(id, 'coordinate');
                break;
            case 'oldConfirm': //医生重新协调  请确认
                confirmTime(id);
                break;
            default:
                break;
        }
    });
    //取消日程
    $('#tbody-list').on('click', '.cancelBtn', function () {
        var id = $(this).attr('data-objId');
        layer.prompt({
            formType: 2,
            title: '请输入取消原因'
        }, function (value, index, elem) {
            var updateEventsCalendar = AV.Object.createWithoutData('EventsCalendar', id);
            updateEventsCalendar.set('DoctorRefuseReason', value);
            updateEventsCalendar.set('Statu', -999);
            updateEventsCalendar.save().then(function (event) {
                AVCloudSaveOperRec(event.id, '会员取消日程', '取消日程成功');
            }, function () {
                layer.msg('取消日程出错', {
                    shift: 6,
                    time: 600
                }, function () {
                    window.location.reload();
                });
            });
            layer.close(index);
        });

    });

    $("input:radio[name=change]").change(function () {

        var value = $(this).val();
        if (value == '1') {
            document.getElementsByClassName('refuse-check')[0].style.display = "";
        } else {
            document.getElementsByClassName('refuse-check')[0].style.display = "none";
        }
    });
    //点击显示其它时间 绑定事件
    $('.span_select span').click(function () {
        var t = $(this);
        var status = t.attr('class');
        var other_time = $('.other_time');
        if (status == 'no_select_o_t') {
            selectedOtherTime = 1;
            t.attr('class', 'select_o_t').text('点击取消其它时间');
            other_time.show();
            showDocotrHosAndRoom(); //选择其他事件时 才增加诊室和医院下拉框
            $("#canOrderTime").attr("disabled","disabled");
            $("#canOrderTime").css("background-color","#ebebe4");
            $("#OrderSpecificTime").attr("disabled","disabled");
        } else {
            selectedOtherTime = 0;
            t.attr('class', 'no_select_o_t').text('点击选择其它时间');
            other_time.hide();
            $("#canOrderTime").removeAttr("disabled");
            $("#canOrderTime").css("background-color","#fff");
            $("#OrderSpecificTime").removeAttr("disabled");
        }
    });

    //自定义时间选择
    $('#times').click(function () {
        $('#showTime').html(
            '<div class="times_inner">' +
            '<a class="times_a">X</a>' +
            '<h5>请选择时间点</h5>' +
            '<button data-time="10:00:00">上午 10:00</button>' +
            '<button data-time="15:00:00">下午 03:00</button>' +
            '</div>'
        ).show();
    });
    $('#showTime').click(function () {
        $(this).fadeOut();
    }).on('click', 'button', function () {
        var t = $(this).attr('data-time');
        $('#times').val(t);
    });
    //选择可预约
    $('#canOrderTime').change(function () {
        selectedValue = this.value;
    });
}
/*
 *确认日程 
 */
function confirmTime(id) {
    //询问框
    layer.confirm('确认日程时间？', {
        btn: ['确认', '取消'] //按钮
    }, function () {
        var query = new AV.Query('EventsCalendar');
        query.get(id).then(function (updateEventsCalendar) {
            updateEventsCalendar.set('MemberConfirm', 1);
            updateEventsCalendar.set('Statu', 11);
            updateEventsCalendar.save().then(function (event) {
                AVCloudSaveOperRec(event.id, '会员确认日程', '确认日程成功');
            });
        });
    });
}
/*
 * 弹出修改时间div
 */
function openEditTimeDiv(id, btnname) {
    jy(0.8);
    $(".refuse-div").css("display", "block");
    $("#refuse-btn").attr("onclick", "refuse(\'" + id + '\',\'' + btnname + "\')");
    if (btnname == 'newEditTime' || btnname == 'oldEditTime') {
        $(".refuse-div .title").html('修改预约时间');
        $("#refuse-name").html('修改日期');
    } else {
        $(".refuse-div .title").html('重新协调');
        $("#refuse-name").html('协调日期');
    }
}

/*
 * 重新协调
 * 
 */
function refuse(id, btnname) {
    subStart();
    var selectedValue = $("#canOrderTime2 option:selected").val();
    var time = new Date(resultArray[selectedValue].Time);
    var EventTypeId = resultArray[selectedValue].EventTypeId;
    var query = new AV.Query('EventsCalendar');
    var memo = '';
    var notice = '';
    query.get(id).then(function (updateEventsCalendar) {
        var oldConfirmAt = timeToString(updateEventsCalendar.get('ConfirmAT'));
        var TypeId = updateEventsCalendar.get('EventType').id;
        updateEventsCalendar.set("ConfirmAT", time);
        if (btnname == 'newEditTime') {
            memo = '会员修改预约时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
            notice = '修改成功';
        }
        if (btnname == 'oldEditTime') {
            memo = '会员修改重新协调时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
            notice = '修改成功';
        }
        if (btnname == 'coordinate') {
            memo = '会员希望重新协调时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
            notice = '重新协调成功';
            updateEventsCalendar.set('Statu', -969);
            updateEventsCalendar.set('DoctorConfirm', -969);
            updateEventsCalendar.set('MemberConfirm', 1);
        }
        if (oldConfirmAt == timeToString(time) && TypeId == EventTypeId) {
            layer.msg('新的时间或事项不能与旧的相同！', {
                time: 1000
            });
        } else {
            if (oldConfirmAt == timeToString(time) && TypeId != EventTypeId) {
                memo = '会员修改事项类型';
            }
            updateEventsCalendar.save().then(function (event) {
                AVCloudSaveOperRec(event.id, memo, notice);
            }, function () {
                layer.msg('重新协调出错', {
                    shift: 6,
                    time: 600
                }, function () {
                    window.location.reload();
                });
            });
        }
    });

}

function selectDoctor() {
    $(".doctor-div").css("display", "block");
    $(".call-div").css("display", "none");
}

function SelectBack() {
    $(".doctor-div").css("display", "none");
    $(".call-div").css("display", "block");
}

//选择新的医生 改变input框默认值
function SelectBtn() {
    if (!$("#list input[type=radio]:checked").length) {
        layer.msg("请选择一个医生", {
            shift: 6,
            time: 600
        });
        return;
    }
    var d_id = $("#list input[type=radio]:checked").attr("id");
    var d_name = $("#list input[type=radio]:checked").attr("value");
    $("#DoctorName").html(d_name);
    $("#DoctorName").attr("data_id", d_id);
    $(".doctor-div").css("display", "none");
    $(".call-div").css("display", "block");
    showTimeToSelect(d_id);
    showDocotrHosAndRoom(d_id);
}
/*
 * 
 * 根据医生查看医生的安排时间列表
 * @id：医生对象id
 */
function showTimeToSelect(id) {
    //获取可预约时间
    AV.Cloud.run('GetClinicCalendar', {
        id: id
    }, function (results) {
        resultArray = results;
        getCanOrderTimeHtml(results);
    });
}

//添加可预约时间
function getCanOrderTimeHtml(results) {
    var htmlTimes = '';
    for (var i = 0; i < results.length; i++) {
        htmlTimes += '<option value="' + i + '">' + results[i].TimeDescribe + results[i].EventType + '</option>';
    }
    $('#canOrderTime').html(htmlTimes);
    $('#canOrderTime2').html(htmlTimes);
}

/*
 * 显示事件函数
 * 
 */
function ShowEvent(className, typeName, id) {
    //载入产品类型下拉框列表
    var html_op = '<option value="all">---------请选择---------</option>';
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).html(html_op);
        }
    });
}
/*
 *
 *根据doct id 查询诊室和医院到下拉框
 */
function showDocotrHosAndRoom(d_id) {
    var query = new AV.Query('Doctor');
    query.include('MainHospital');
    query.include('MainConsultingRoom');
    query.get(d_id, {
        success: function (doc) {
            doctor = doc;
            var Hospital = doc.get('MainHospital').get('HospitalName');
            var RoomName = doc.get('MainConsultingRoom').get('RoomName');
            $("#Hospital").html("<option value='" + doc.get('MainHospital').id + "'>" + Hospital + "</option>");
            $("#ConsultingRoom").html("<option value='" + doc.get('MainConsultingRoom').id + "'>" + RoomName + "</option>");
        }
    });
}

/*
 *
 *预约函数 
 * 
 */
function NewEvent() {
    subStart(); //设置按钮禁用
    var d_id;
    var EventTypeId;
    var time;
    var times;
    var Remindtime;
    var HospitalId;
    var ConsultingRoomId;
    var notice;

    d_id = $('#DoctorName').attr("data_id");
    var DoctorName  = $('#DoctorName').html();
    EventTypeId = $('#EventType option:selected').val();
    notice = $('#notice').val();
    if (EventTypeId == '' || EventTypeId == "all") {
        subEnd();
        layer.msg('请选择预约事项', {
            shift: 6,
            time: 600
        });
        return false;
    }

    if (selectedOtherTime == 1) { //选择其他时间
        time = $('#time').val();
        times = $('#times').val();
        HospitalId = $('#Hospital option:selected').val();
        HospitalName = $('#Hospital option:selected').text();
        ConsultingRoomId = $('#ConsultingRoom option:selected').val();

        if (time == '' || times == '') {
            subEnd();
            layer.msg('请选择预约日期和时间', {
                shift: 6,
                time: 600
            });
            return false;
        }
        if (HospitalId == '' || HospitalId == "all") {
            subEnd();
            layer.msg('请选择医院', {
                shift: 6,
                time: 600
            });
            return false;
        }
    } else { //选择安排好的时间
        var speTime = $("#OrderSpecificTime").val();
        if(!resultArray){
            layer.msg('无可预约时间请选择其他时间', {
                shift: 6,
                time: 600
            });
            subEnd();
        }
        time = 1;
        times = 1;
        time1 = new Date(resultArray[selectedValue].Time);
        var h = speTime.split(":")[0]
        var m = speTime.split(":")[1]
        time1.setHours(h);
        time1.setMinutes(m);
        HospitalId = doctorHospital.id;
        ConsultingRoomId = doctorRomm.id;

    }
    Remindtime = $('#RemindTime').val();
    if (Remindtime == '') {
        layer.msg('请选择提醒日期', {
            shift: 6,
            time: 600
        });
        subEnd();
        return;
    }
    var NewDoctor = new AV.Object.createWithoutData('Doctor', d_id);
    var NewEventType = new AV.Object.createWithoutData('EventType', EventTypeId);
    if (HospitalId) var NewHospital = new AV.Object.createWithoutData('Hospital', HospitalId);
    if (ConsultingRoomId) var NewConsultingRoom = new AV.Object.createWithoutData('ConsultingRoom', ConsultingRoomId);

    if (selectedOtherTime == 1) {
        var time1 = time + ' ' + times;
        time1 = new Date(time1);
    }
    if (new Date(Remindtime) > time1) {
        layer.msg('提醒日期不能大于预约时间', {
            shift: 6,
            time: 600
        });
        subEnd();
        return;
    }

    var MyEvent = new EventsCalendar();

    MyEvent.set("Member", MEMBER);
    MyEvent.set("EventType", NewEventType);
    MyEvent.set("CreateBy", 0);
    MyEvent.set("Doctor", NewDoctor);
    if(PersonalButler){
        MyEvent.set("Butler", PersonalButler);
    }
    if (NewHospital)MyEvent.set("Hospital", NewHospital);
    MyEvent.set("FirstAT", time1);
    MyEvent.set("ConfirmAT", time1);
    MyEvent.set("RemindAT", new Date(Remindtime));
    MyEvent.set("DoctorConfirm", 1);
    MyEvent.set("MemberConfirm", 1);
    if (NewConsultingRoom)MyEvent.set("ConsultingRoom", NewConsultingRoom);
    MyEvent.set("Statu", 11);

    if (notice != '') {
        MyEvent.set("Notice", notice);
    }
    MyEvent.save(null, { //保存更新的对象
        success: function (event) {
            // 成功保存之后，执行其他逻辑.
            var opts={
                phoneno:PhoneNo,
                datas:timeToString(time1)+","+HospitalName+','+DoctorName,
            };
            AV.Cloud.run('sendmessageForAppointment', opts, function (data) {
                if(data){
                    AVCloudSaveOperRec(event.id, '会员新建预约', '预约成功,已发送短信');
                }
            },function () {
                layer.msg('发送失败');
            })
        }
    });
}
/*
 * 调用云函数 新增日程操作记录 共用
 * @evetID:日程id
 * @memo:'记录备注'
 * @layerMsg：成功后提示的语句
 */
function AVCloudSaveOperRec(evetID, memo, layerMsg) {
    var AgentID = parseInt(getUrlParam("AgentID")) - 1000;
    var data = {
        'operator': {
            'classname': 'ServiceAgent',
            'id': AgentID
        },
        'eventid': evetID,
        'memo': memo
    };
    AV.Cloud.run("NewEventsOperRec", data, {
        success: function () {
            layer.msg(layerMsg, {
                time: 800
            }, function () {
                window.location.reload();
            });
        },
        error: function (error) {
            subEnd(); //按钮设为可用
            console.log("失败" + JSON.stringify(error));
        }
    });
}

/*
 * 新建日程操作记录
 * operator操作人 格式如{"doctor"："57ff48815bbb50005b4e11fc"}
 * memo:操作备注 
 * refresh：bool 是否刷新页面
 */
var EventsOperRec = AV.Object.extend("EventsOperRec");

function newEventsOperRecFun(operator, memo, refresh) {
    var newObj = new EventsOperRec();
    newObj.set("Operator", operator);
    newObj.set("Memo", memo);
    newObj.set("OperateTime", new Date());
    newObj.save(null, {
        success: function () {
            console.log("保存成功");
            if (refresh) {
                window.location.reload();
            }
        },
        error: function (error) {
            console.log("保存失败error=" + error);
        }
    });
}
/*
 * 打开投诉新建div
 */
function openNewComplainDiv() {
    var window_height = $('body').height(); //当前窗口的宽高
    var window_width = $("body").width();
    $(".newComplain-div").css("left", window_width * 0.1 + "px");
    $(".newComplain-div").css("top", window_height * 0.075 + "px");
    jy(0.8);
    var t = 'CallNewComplain.html?id=' + MEMBERID;
    $("#newComplainIframe").attr('src', t);
    $(".newComplain-div").css("display", "block");
}

/*
 * 打开历史诊断div
 */
function openMedicalResultDiv() {
    var window_height = $('body').height(); //当前窗口的宽高
    var window_width = $("body").width();
    $(".MedicalResult-div").css("left", window_width * 0.075 + "px");
    $(".MedicalResult-div").css("top", window_height * 0.1 + "px");
    jy(0.8);
    var t = 'MedicalResultList.html?id=' + MEMBERID;
    $("#MedicalResultIframe").attr('src', t);
    $(".MedicalResult-div").css("display", "block");
}

/*
 * 打开知识库div
 */
function openWiki() {
    var window_height = $(window).height(); //当前窗口的宽高
    var window_width = $(window).width();

    $(".wiki-div").css("left", window_width * 0.1 + "px");
    $(".wiki-div").css("top", window_height * 0.08 + "px");
    jy(0.8);
    $(".wiki-div").css("display", "block");
}

/*
 * 打开历史咨询div
 */
function openHistory() {
    var window_height = $('body').height(); //当前窗口的宽高
    var window_width = $("body").width();
    $(".historyAsk-div").css("left", window_width * 0.1 + "px");
    $(".historyAsk-div").css("top", window_height * 0.1 + "px");
    jy(0.8);
    var t = 'historyAdvisory.html?id=' + MEMBERID;
    $("#historyIframe").attr('src', t);
    $(".historyAsk-div").css("display", "block");
}
/*
 * 打开ask div
 */
function newAsk() {
    ShowSelectOption("CounselType", "TypeName", "CounselType")
    jy(0.8);
    $(".newAsk").css("display", "block");
}

/*
 * 新建咨询
 */
function newAskBtn() {
    subStart();
    var doctorID = $('#ask-doctor').attr('data');
    var typeID = $('#CounselType option:selected').val();
    var content = $("#ask-content").val();

    if (content == '') {
        layer.msg('咨询内容不能为空', {
            time: 600
        });
        subStart();
        return;
    }
    var AgentID = getUrlParam("AgentID");

    var myDoctor = AV.Object.createWithoutData("Doctor", doctorID);
    var myType = AV.Object.createWithoutData("CounselType", typeID);
    var newCounsel = new Counsel();
    newCounsel.set("CounselContent", content);
    newCounsel.set("Statu", 1);
    newCounsel.set("Doctor", myDoctor);
    newCounsel.set("CounselType", myType);
    newCounsel.set("Member", MEMBER);
    newCounsel.set("FollowAgent", AGENT);
    newCounsel.save(null, {
        success: function (res) {
            layer.msg('新建成功', {});
            closeAsk();
        }
    });
}

/*
 * div 拖动是事件绑定
 * 
 */
function moveDivEvent() {
    var className = ".wiki-div";
    var window_height = $(window).height(); //当前窗口的宽高
    var window_width = $(window).width();
    var mydiv_height = $(className).height(); //弹出框口的宽高
    var mydiv_width = $(className).width();
    var _move = false; //移动标记
    var _x, _y; //鼠标离控件左上角的相对位置
    $(className).mousedown(function (e) {
        _move = true;
        _x = e.pageX - parseInt($(className).css("left"));
        _y = e.pageY - parseInt($(className).css("top"));
    }).mouseup(function () {
        _move = false;
    });
    $(document).mousemove(function (e) {
        if (_move) {
            var x = e.pageX - _x; //移动时根据鼠标位置计算控件左上角的绝对位置
            var y = e.pageY - _y;
            var margin_left = parseInt($(className).css("margin-left"));
            var margin_top = parseInt($(className).css("margin-top"));

            if (x >= window_width - mydiv_width - margin_left - 20) {
                x = window_width - mydiv_width - margin_left - 20;
            }
            if (y >= window_height - mydiv_height - margin_top - 40) {
                y = window_height - mydiv_height - margin_top - 40;
            }
            if (x <= -margin_left) {
                x = -margin_left;
            }
            if (y <= -margin_top) {
                y = -margin_top;
            }
            $(className).css({
                top: y,
                left: x
            }); //控件新位置

        }
    });
}
/*
 * 关闭wikidiv
 */
function closeWiki() {
    $(".jy").css("display", "none");
    $(".wiki-div").css("display", "none");
}
/*
 * 关闭NewComplain
 */
function closeNewComplainDiv() {
    $(".jy").css("display", "none");
    $(".newComplain-div").css("display", "none");
}
/*
 * 关闭
 */
function closeMedicalResultDiv() {
    $(".jy").css("display", "none");
    $(".MedicalResult-div").css("display", "none");
}
/*
 * 关闭ask window
 */
function closeAsk() {
    $(".jy").css("display", "none");
    $(".newAsk").css("display", "none");
}
/*
 * 关闭refuse window
 */
function closeRefuse() {
    $(".jy").css("display", "none");
    $(".refuse-div").css("display", "none");
}

/*
 * 关闭ask window
 */
function closehistory() {
    $(".jy").css("display", "none");
    $(".historyAsk-div").css("display", "none");
}

function closeEditTime() {
    $(".jy").css("display", "none");
    $(".editTime-div").css("display", "none");
}

//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
    var html_op = '',
        obj;
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).html(html_op);
        }
    });
}

/*
 * 播放录音文件
 */
function play(th) {
    $(".audio-div").show();
    var top = $(th).position().top;
    var left = $(th).position().left;
    var w = $(th).width();
    $(".audio-div").css({
        top: (top - 10) + "px",
        left: (left + w + 30) + "px"
    })
    var audioUrl = $(th).attr("data");
    $("#audio").attr("src", audioUrl);
    /*var aud = document.getElementById("audio");
     aud.reload();*/
}
/*
 * 
 * 关闭播放窗口
 */
function closeBtn() {
    $(".audio-div").hide();
    $("#audio").attr("src", "");
}

//状态
function getStatus(status, DoctorConfirm, MemberConfirm, tep) {
    var statusString = "";
    var dobtnString = ''; //状态对应的操作按钮名称
    var dobtnName = ''; //状态对应的标识
    if (status == 1 || status == -969) {
        if (status == 1) { //新建状态 判断会员和医生确认状态
            if (DoctorConfirm == -1) {
                statusString = "待医生确认";
                dobtnName = "newEditTime";
                dobtnString = "更改时间";
            }
            if (MemberConfirm == -1) {
                statusString = "请确认日程";
                dobtnName = "newConfirm";
                dobtnString = "确认日程";
            }
        } else {
            if (DoctorConfirm == -969) {
                statusString = "待医生确认";
                dobtnName = "oldEditTime";
                dobtnString = "更改时间";
            }
            if (MemberConfirm == -969) {
                statusString = "日程已变更，请确认";
                dobtnName = "oldConfirm";
                dobtnString = "确认日程";
            }
        }

    } else {
        switch (status) {
            case -999:
                statusString = "已取消";
                break;
            case -989:
                statusString = "会员未履约";
                break;
            case -979:
                statusString = "医生未履约";
                break;
            case 11:
                statusString = "已确认";
                dobtnName = "coordinate";
                dobtnString = "重新协调";
                break;
            case 21:
                statusString = "已提醒";
                break;
            case 31:
                statusString = "已完成";
                break;
            default:
                statusString = "未知状态";
                break;
        }
    }
    if (tep) {
        if (tep == 'dobtnString') return dobtnString;
        if (tep == 'dobtnName') return dobtnName;
    } else {
        return statusString;
    }
}
/*
 * 挂断
 */
function callOutHangUp() {
    $(".calloutHpBtn").attr("value", "挂断中...");
    var cid = getUrlParam('callid');
    var AgentID = getUrlParam("AgentID");
    var data = {
        'func': 'ivr',
        'funcdes': 'call',
        'opernode': 'AgentServiceEnd',
        'callid': cid,
        'operparam': {
            'agentid': AgentID,
            'callid': cid,
            'action': ''
        }
    }
    AV.Cloud.run('RLCallIvrApi', data, {
        success: function (data) {
            // 调用成功，得到成功的应答data
        },
        error: function (err) {
            // 处理调用失败
            if (err.code == 1) {
            } else {
                layer.msg('操作失败，请联系管理员' + err.message, {});
            }
        }
    });
}
