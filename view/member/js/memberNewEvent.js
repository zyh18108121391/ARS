var doctor = null;//保存医生
var doctorHospital;
var doctorRomm;
var PhoneNo;
//保存云函数获取的值
var resultArray=[],selectedOtherTime= 0,selectedValue=0;
var PersonalButler;
$(document).ready(
    function () {
        ShowSelectOption("MemberLevel", "LevelName", "level"); //显示会员等级下拉列表
        ShowSelectOption("Disease", "DiseaseName", "Disease"); //显示病情下拉列表
        ShowEvent('EventType', "EventTypeName", "EventType");//事件
        showMember();
    }
);
/*
 *
 *根据doct id 查询诊室和医院到下拉框
 */
function showDocotrHosAndRoom(d_id) {
    var query = new AV.Query('Doctor');
    query.include('MainHospital');
    query.include('MainConsultingRoom');
    query.get(d_id, {
        success: function(doc) {
            doctor = doc;
            var Hospital = doc.get('MainHospital').get('HospitalName');
            var RoomName = doc.get('MainConsultingRoom').get('RoomName');
            $("#Hospital").append("<option value='"+doc.get('MainHospital').id+"'>"+Hospital+"</option>");
            $("#ConsultingRoom").append("<option value='"+doc.get('MainConsultingRoom').id+"'>"+RoomName+"</option>");
        }
    });
}
//如果是会员列表过来的 则默认显示会员名称
function showMember() {
    var id = geturl();
    if (id) {
        var query = new AV.Query("Member");
        query.include("Account");
        query.include("Hospital");
        query.include("PersonalDoctor");
        query.get(id, {
            success: function (member) {
                $("#memberName").html(member.get("MemberName"));
                $("#memberName").attr("data_id", member.id);
                PhoneNo = member.get('MobilePhoneNo');
                if(member.get('PersonalButler')!=null){
                    PersonalButler = member.get('PersonalButler');
                }
                if(member.get('PersonalDoctor')){
                    doctorHospital = member.get('Hospital');
                    doctorRomm = member.get('PersonalDoctor').get("MainConsultingRoom");
                    var doctorID = member.get('PersonalDoctor').id;
                    showTimeToSelect(doctorID);
                    showDocotrHosAndRoom(doctorID);
                }
            }
        })
    }
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
    }, function(results) {
        resultArray = results;
        getCanOrderTimeHtml(results);
    });
}

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

function selectMember() {
    $(".memberList").css("display", "block");
    $(".NewEvent").css("display", "none");

}

function SelectBack() {
    $(".memberList").css("display", "none");
    $(".NewEvent").css("display", "block");
}

//选择新的会员 改变input框默认值
function SelectBtn() {
    if (!$("#list input[type=radio]:checked").length) {
        layer.msg("请选择一个会员", {shift: 6, time: 600});
        return;
    }
    var m_id = $("#list input[type=radio]:checked").attr("id");
    var m_name = $("#list input[type=radio]:checked").attr("value");
    $("#memberName").html(m_name);
    $("#memberName").attr("data_id", m_id);
    $(".memberList").css("display", "none");
    $(".NewEvent").css("display", "block");
}

//查询会员事件
$('#searchBtn').click(function(){
    Search('memberNewEvent');
});

//预约
function NewEvent() {
    subStart(); //设置按钮禁用
    var m_id;
    var EventTypeId;
    var time;
    var times;
    var HospitalId;
    var ConsultingRoomId;
    var notice;
    var Remindtime;
    var Image;
    m_id = $('#memberName').attr("data_id");
    EventTypeId = $('#EventType option:selected').val();
    notice = $('#notice').val();
    if(EventTypeId == '' || EventTypeId == "all") {
        subEnd();
        layer.msg('请选择预约事项', {
            shift: 6,
            time: 600
        });
        return false;
    }
    if(selectedOtherTime==1){
        time = $('#time').val();
        times = $('#times').val();
        HospitalId = $('#Hospital option:selected').val();
        var HospitalName = $('#Hospital option:selected').text();
        if(time == '' || times == '') {
            subEnd();
            layer.msg('请选择预约日期和时间', {
                shift: 6,
                time: 600
            });
            return false;
        }
        if(HospitalId == '' || HospitalId == "all") {
            subEnd();
            layer.msg('请选择医院', {
                shift: 6,
                time: 600
            });
            return false;
        }
    }else{
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
        time1= new Date(resultArray[selectedValue].Time);
        var h = speTime.split(":")[0]
        var m = speTime.split(":")[1]
        time1.setHours(h);
        time1.setMinutes(m);
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
    Image = $(".Image");
    if(selectedOtherTime==1){
        var time1 = time + ' ' + times;
        time1=new Date(time1);
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
    if(m_id) MyEvent.set("Member", AV.Object.createWithoutData('Member',m_id));
    if(EventTypeId) MyEvent.set("EventType", AV.Object.createWithoutData('EventType',EventTypeId));
    MyEvent.set("CreateBy", 0);
    MyEvent.set("Doctor", doctor);
    if(doctorHospital){
        MyEvent.set("Hospital", doctorHospital);
        var HospitalName = doctorHospital.get('HospitalName');
    }
    if(doctorRomm)MyEvent.set("ConsultingRoom",doctorRomm);
    if(PersonalButler)MyEvent.set("Butler",PersonalButler);
    MyEvent.set("FirstAT", time1);
    MyEvent.set("ConfirmAT", time1);
    MyEvent.set("Statu", 11);
    MyEvent.set("RemindAT", new Date(Remindtime));
    MyEvent.set("DoctorConfirm", 1);
    MyEvent.set("MemberConfirm", 1);
    if (notice != '') {
        MyEvent.set("Notice", notice);
    }
    if (Image[0].files.length > 0) { //如果上传图片 则更新图片
        var relation = MyEvent.relation("PreRecords");
        var j = 0;
        f1();
        function f1() {
            var file = Image[0].files[j];
            var name = "tt" + j + ".jpg";
            var avFile = new AV.File(name, file);
            var File = new EventFiles();
            File.set("File", avFile);
            File.save(null, {
                success: function (file) {
                    relation.add(file);
                    j++;
                    if (j < Image[0].files.length) {
                        f1();
                    } else {
                        MyEvent.save(null, { //保存更新的对象
                            success: function (post) {
                                // 成功保存之后，执行其他逻辑.
                                var opts={
                                    phoneno:PhoneNo,
                                    datas:timeToString(time1)+","+HospitalName+','+doctor.get('DoctorName'),
                                };
                                AV.Cloud.run('sendmessageForAppointment', opts, function (data) {
                                    if(data){
                                        subEnd(); //按钮设为可用
                                        layer.msg('预约成功，已发送短信', {time: 1500},function(){
                                            history.go(-1);
                                        });
                                    }
                                },function () {
                                    layer.msg('发送失败');
                                })
                            },
                            error: function (post, error) {
                                layer.msg('预约失败，请重试', {shift: 6, time: 600});
                                subEnd(); //按钮设为可用
                            }
                        });
                    }
                }
            });
        }
    } else { //如果没有更新图片 则更新其他字段
        MyEvent.save(null, { //保存更新的对象
            success: function (post) {
                // 成功保存之后，执行其他逻辑.
                var opts={
                    phoneno:PhoneNo,
                    datas:timeToString(time1)+","+HospitalName+','+doctor.get('DoctorName'),
                };
                AV.Cloud.run('sendmessageForAppointment', opts, function (data) {
                    if(data){
                        subEnd(); //按钮设为可用
                        layer.msg('预约成功，已发送短信', {time: 1500},function(){
                            history.go(-1);
                        });
                    }
                },function () {
                    layer.msg('发送失败');
                });
            },
            error: function (post, error) {
                layer.msg('预约失败，请重试', {shift: 6, time: 600});
                subEnd(); //按钮设为可用
            }
        });
    }
}

//添加多张图片图片预览
disImg();
function disImg() {
    $(".Image").change(function () {
        var imgHtml = '', names = '';
        for (var i = 0; i < this.files.length; i++) {
            var objUrl = getURL(this.files[i]);
            if (objUrl) {
                imgHtml += '<img src="' + objUrl + '" width="155" height="125"/>';
                names += ' ' + this.files[i].name;
            }
        }
        $('.img_container').html(imgHtml);
        $('.input_img label').html(names);
    });
    //建立一个可存取到该file的url
    function getURL(file) {
        var url = null;
        if (window.createObjectURL != undefined) { // basic
            url = window.createObjectURL(file);
        } else if (window.URL != undefined) { // mozilla(firefox)
            url = window.URL.createObjectURL(file);
        } else if (window.webkitURL != undefined) { // webkit or chrome
            url = window.webkitURL.createObjectURL(file);
        }
        return url;
    }
}

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

//添加可预约时间
function getCanOrderTimeHtml(results){
    var htmlTimes='';
    for(var i=0;i<results.length;i++){
        htmlTimes+='<option value="'+i+'">'+results[i].TimeDescribe+results[i].EventType+'</option>';
    }
    $('#canOrderTime').html(htmlTimes);
}

//选择可预约
$('#canOrderTime').change(function(){
    selectedValue=this.value;
});

//点击显示其它时间
$('.span_select span').click(function(){
    var t=$(this);
    var status=t.attr('class');
    var other_time=$('.other_time');
    if(status=='no_select_o_t'){
        selectedOtherTime=1;
        t.attr('class','select_o_t').text('点击取消其它时间');
        other_time.show();
        $("#canOrderTime").attr("disabled","disabled");
        $("#canOrderTime").css("background-color","#ebebe4");
        $("#OrderSpecificTime").attr("disabled","disabled");
    }else{
        selectedOtherTime=0;
        t.attr('class','no_select_o_t').text('点击选择其它时间');
        other_time.hide();
        $("#canOrderTime").removeAttr("disabled");
        $("#canOrderTime").css("background-color","#fff");
        $("#OrderSpecificTime").removeAttr("disabled");
    }
});

