var doctor;
var AgentID = null; //客服ID 外呼需用到
var CID = null; //拨打成功后返回的cid 挂断用掉

var THIS;
var RECORDID; //通话记录ID
var Pageflag = false; //记录是否弹出备注输入框 
var DiseaseIDArray = []; //记录会员所属疾病ID 编辑时可用
var MouseFlag = false;//鼠标是否进入搜索下拉列表
$(document).ready(
    function () {
        ShowSelectOption("Hospital", "HospitalName", "Hospital");
        var user = AV.User.current();
        var query = new AV.Query('ServiceAgent');
        query.equalTo('Account', user);
        query.first().then(function (result) {
            AgentID = result.get("AgentID");
            main();
            // 每次调用生成一个聊天实例
        }, function (error) {
            layer.msg('查询错误', {
                shift: 6,
                time: 600
            })
        });
        laydate.skin('molv');
        createNew();
        //绑定疾病修改中搜索input框focus事件
        bindSearchDieaseInputEvent();
        $("#backbtn").attr('data', document.referrer);
    }
);
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小默认为10
var query; //翻页用到的全局query对象


var MEMBER;//保存当前页会员对象方便后面编辑

//主函数f
function main() {
    var MemberID = geturl();
    var MemQuery = new AV.Query("Member");
    MemQuery.equalTo("PersonalDoctor", doctor);
    MemQuery.include("MemberLevel");
    MemQuery.include("City");
    MemQuery.include("PersonalDoctor");
    MemQuery.include("Hospital");
    MemQuery.include("PersonalButler");
    MemQuery.include("PersonalAgent");
    MemQuery.include("Account");
    MemQuery.get(MemberID, {
        success: function (obj) {
            MEMBER = obj;
            var menberId = obj.id;
            memberMoreData(obj);
            CallRecord(obj);
            recentlyCalender(obj);
            var MemberName = '';
            if (obj.get("MemberName") != null) {
                MemberName = obj.get("MemberName");
            }
            var phoneNo = '';
            if (obj.get("MobilePhoneNo") != null) {
                phoneNo = obj.get("MobilePhoneNo");
                $("#call").attr("name", phoneNo);
            }
            if (obj.get("AppendMobilePhoneNo") != null) {
                phoneNo += "," + obj.get("AppendMobilePhoneNo").toString();
            }
            var JoinTime = '';
            if (obj.get("JoinTime") != null) {
                JoinTime = obj.get("JoinTime");
            }
            var ExpireTime = '';
            if (obj.get("ExpireTime") != null) {
                ExpireTime = obj.get("ExpireTime");
                console.log(ExpireTime)
            }

            var PersonalDoctor = '暂无';
            if (obj.get("PersonalDoctor") != null) {
                PersonalDoctor = obj.get("PersonalDoctor").get('DoctorName');
            }
            var Hospital = '';
            if (obj.get("Hospital") != null) {
                Hospital = obj.get("Hospital").get('HospitalName');
            }
            var PersonalButler = '暂无';
            if (obj.get("PersonalButler") != null) {
                PersonalButler = obj.get("PersonalButler").get('ButlerName');
            }
            var PersonalAgent = '暂无';
            if (obj.get("PersonalAgent") != null) {
                PersonalAgent = obj.get("PersonalAgent").get('AgentName');
            }
            var LevelIconUrl = '';
            var LevelName = '';
            if (obj.get("MemberLevel") != null) {
                LevelName = obj.get("MemberLevel").get("LevelName");
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

            //就诊记录输出
            query = new AV.Query('MedicalResult');
            query.equalTo("Member", obj);
            // 按时间，降序排列
            query.descending('MedicalTime');
            query.include("Doctor");
            query.include("EventType");
            query.include("Hospital");
            showPages(query); //显示页数和总条数 在limit之前使用
            showNowPageResults(query); //显示当前页数据

            var DiseaseArray = []; //疾病数组

            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function (result) {
                    for (var j = 0; j < result.length; j++) {
                        DiseaseArray.push(result[j].get('DiseaseName'));
                        DiseaseIDArray.push(result[j].id);
                        $('.disease-ul').append('<li data="' + result[j].id + '" class="btn btn-default" onclick="removeDisease(this)">' + result[j].get('DiseaseName') + '</li> ')
                    }
                    $("#MemberName").html("<span>" + MemberName + "</span>" + '<a class="td-editBtn" href="javascript:editMemberName()"></a>');
                    $("#Leval").html(LevelName + '<img src=\"' + LevelIconUrl + '\" width=\"15px\">' + '<a class="td-editBtn" href="addNewMember.html"></a>');
                    $("#MobilePhoneNo").html("<span phone='" + phoneNo + "'>" + obj.get("MobilePhoneNo") + (obj.get("AppendMobilePhoneNo") ? '(主),' + obj.get("AppendMobilePhoneNo") : '') + "</span>" + '<a class="td-editBtn" href="javascript:showEditPhoneDiv()"></a>');
                    $("#ExpireTime").html("<span>" + timeToString(ExpireTime) + "</span>"+'<a class="td-editBtn" href="javascript:showEditExpireTimeDiv(1)"></a>');
                    $("#JoinTime").html("<span>" + timeToString(JoinTime) + "</span>"+'<a class="td-editBtn" href="javascript:showEditExpireTimeDiv(2)"></a>');
                    $("#PersonalDoctor").html(PersonalDoctor + "(" + Hospital + ")" + '<a class="td-editBtn" href="javascript:editDoctor()"></a>');
                    $("#personalAgent").html("<span>" + PersonalAgent + "</span>" + '<a class="td-editBtn" href="javascript:showEditAgentDiv()"></a>');
                    $("#PersonalButler").html(PersonalButler + '<a class="td-editBtn" href="javascript:editButler()"></a>');
                    $("#Disease").html(DiseaseArray.toString());
                    $("#City").html("<span>" + city + "</span>" + '<a class="td-editBtn" href="javascript:showEditCityDiv()"></a>');
                    $("#Satisfaction").html(getStartlevalDivPersonal(Satisfaction));
                    $("#Activeness").html(getStartlevalDivPersonal(Activeness));
                }
            });
        }
    });
}

/*
 * 会员的一部分基本信息（后面增加的）单独作为一个函数
 * 
 */
function memberMoreData(obj) {
    var Sex = '';
    if (obj.get("Sex") != null) {
        var t = obj.get("Sex");
        if (t == 1) {
            Sex = '女';
        } else if (t == 0) {
            Sex = '男';
        } else {
            Sex = '未知';
        }
    }
    var IDCard = '';
    if (obj.get("IDCard") != null) {
        IDCard = obj.get("IDCard");
    }
    var Birth = '';
    if (obj.get("Birth") != null) {
        Birth = obj.get("Birth");
    }
    var MaritalStatus = '';
    if (obj.get("MaritalStatus") != null) {
        MaritalStatus = obj.get("MaritalStatus") ? '已婚' : '未婚';
    }
    var Nation = '';
    if (obj.get("Nation") != null) {
        Nation = obj.get("Nation");
    }
    var NativePlace = '';
    if (obj.get("NativePlace") != null) {
        NativePlace = obj.get("NativePlace");
    }
    var Height = '';
    if (obj.get("Height") != null) {
        Height = obj.get("Height");
    }
    var Address = '';
    if (obj.get("Address") != null) {
        Address = obj.get("Address");
    }
    var Profession = '';
    if (obj.get("Profession") != null) {
        Profession = obj.get("Profession");
    }
    var Weight = '';
    if (obj.get("Weight") != null) {
        Weight = obj.get("Weight");
    }
    var DiseaseTime = '';
    if (obj.get("DiseaseTime") != null) {
        DiseaseTime = obj.get("DiseaseTime");
    }
    var ContectTime = '';
    if (obj.get("ContectTime") != null) {
        ContectTime = obj.get("ContectTime");
    }
    var PatientNo = '';
    if (obj.get("PatientNo") != null) {
        PatientNo = obj.get("PatientNo");
    }
    var Memo = '';
    if (obj.get("Memo") != null) {
        Memo = obj.get("Memo");
    }
    $("#Sex").html(Sex);
    $("#IDCard").html(IDCard);
    $("#Birth").html(Birth);
    $("#MaritalStatus").html(MaritalStatus);
    $("#Nation").html(Nation);
    $("#NativePlace").html(NativePlace);
    $("#Height").html(Height);
    $("#Address").html(Address);
    $("#Profession").html(Profession);
    $("#Weight").html(Weight);
    $("#DiseaseTime").html(DiseaseTime);
    $("#ContectTime").html(timeToString(ContectTime));
    $("#Memo").html(Memo);
    $("#PatientNo").html(PatientNo);
}

/*
 * 点击编辑资料按钮
 */
var BtnFlag = true;
function DataEdit() {
    if (BtnFlag == false) {
        BtnFlag = true;
        //$(".editBtn").html('编辑');
        $(".editFlag a").remove();
        return;
    }
    BtnFlag = false;
    //$(".editBtn").html('完成');
    $(".editFlag").append('<a class="td-editBtn" title="编辑"></a>');
    bindEditclick();
    var parID, type, prompt;

    function bindEditclick() {
        $(".editFlag a").click(function () {
            parID = $(this).parent().attr('id');
            type = $(this).parent().prev().html();
            prompt = '';
            switch (parID) {
                case 'Sex':
                    editFuncSex();
                    break;
                case 'IDCard':
                    editFuncMain(0);
                    break;
                case 'MaritalStatus':
                    editFuncMary();
                    break;
                case 'Nation':
                    editFuncMain(0);
                    break;
                case 'NativePlace':
                    editFuncMain(2);
                    break;
                case 'Height':
                    editFuncMain(0);
                    break;
                case 'Address':
                    editFuncMain(2);
                    break;
                case 'Profession':
                    editFuncMain(0);
                    break;
                case 'Weight':
                    editFuncMain(0);
                    break;
                case 'DiseaseTime':
                    editFuncMain(2);
                    break;
                case 'PatientNo':
                    editFuncMain(0);
                    break;
                case 'Memo':
                    editFuncMain(2);
                    break;
                default:
                    break;
            }
        });
    }

    function editFuncMain(sty) {
        var query = new AV.Query('Member');
        query.get(geturl()).then(function (member) {
            layer.prompt({
                title: "编辑-" + type,
                formType: sty //prompt风格，支持0-2
            }, function (text) {
                if (parID == 'IDCard' && text.length != 18) {
                    layer.msg('身份证位数不正确！');
                } else {
                    if (parID == 'IDCard') {
                        var birth = text.substr(6, 4) + '-' + text.substr(10, 2) + "-" + text.substr(12, 2);
                        member.set('Birth', birth);
                    }
                    member.set(parID, text);
                    save(member);
                }
            });
        });
    }

    function editFuncMary() {
        var query = new AV.Query('Member');
        query.get(geturl()).then(function (member) {
            layer.confirm('是否结婚', {
                btn: ['已婚', '未婚'] //按钮
            }, function () {
                member.set('MaritalStatus', 1);
                save(member);
            }, function () {
                member.set('MaritalStatus', 0);
                save(member);
            });
        });

    }

    function editFuncSex() {
        var query = new AV.Query('Member');
        query.get(geturl()).then(function (member) {
            layer.confirm('性别', {
                btn: ['男', '女', '取消'] //按钮
            }, function () {
                member.set('Sex', 0);
                save(member);
            }, function () {
                member.set('Sex', 1);
                save(member);
            });
        });

    }
}
function save(member) {
    member.save().then(function () {
        layer.msg('修改成功', {
            time: 500
        }, function () {
            memberMoreData(member);
            showEditBtn();
        });
    });
}
/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
    if (data.agentid != AgentIDChange(AgentID)) { //推送消息不是推送给当前客服 忽略此消息
        return;
    }
    if (data.objectID) {
        RECORDID = data.objectID; //agentconversation的id
    }
    if (data.connect) { //外呼 用户接通电话
        changeCallBtn(THIS); //按钮改为挂断电话
    }
    var statu = data.agentstate;

    if (statu == '0') { //状态切换为0时执行
        //如果按钮已经是"拨打电话的情况 则不执行"
        var type = $("#call").attr("date-type");
        if (type != 'call') {
            changeCallBtn(THIS, true);
        }
        //如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
        //Pageflag为True 代标有拨打电话的动作，否则不弹窗。
        if (RECORDID && Pageflag) {
            Pageflag = false;
            SetRecordMemo(RECORDID, 'norush');
        }
    }
}
function selectFun(type) {
    var value = $("#Hospital option:selected").val();
    if (type == 1) {//编辑医生
        var query = new AV.Query('Doctor');
        query.equalTo('MainHospital', new AV.Object.createWithoutData('Hospital', value));
        query.find().then(function (doctors) {
            var html_op = '<option value="all">---请选择医生---</option>';
            var len = doctors.length;
            for (var i = 0; i < len; i++) {
                var obj = doctors[i];
                var doctorName = obj.get('DoctorName');
                html_op += '<option value=\"' + obj.id + '\">' + doctorName + '</option>';
            }
            $("#select").html(html_op);
        })
    } else { //编辑会员管家
        var query = new AV.Query('Butler');
        query.equalTo('Hospital', new AV.Object.createWithoutData('Hospital', value));
        query.find().then(function (butlers) {
            var html_op = '<option value="all">---请选择会员管家---</option>';
            var len = butlers.length;
            for (var i = 0; i < len; i++) {
                var obj = butlers[i];
                var ButlerName = obj.get('ButlerName');
                html_op += '<option value=\"' + obj.id + '\">' + ButlerName + '</option>';
            }
            $("#select").html(html_op);
        })
    }
}
/*
 改变医生或者会员管家
 */
function changeFun() {
    var hospital = $("#Hospital option:selected").val();
    var type = $("#changeBtn").attr('data-type');
    var value = $("#select option:selected").val();
    if (hospital == 'all') {
        var str = '请选择医院';
        layer.msg(str);
        return;
    }
    if (value == 'all') {
        if (type == '1') {
            var str = '请选择医生';
        } else {
            var str = '请选择会员管家';
        }
        layer.msg(str);
        return;
    }

    if (type == '1') {//修改医生
        var query = new AV.Query('Doctor');
        query.get(value).then(function (doctor) {
            var MainHospital = doctor.get('MainHospital');
            MEMBER.set('PersonalDoctor', doctor);
            MEMBER.set('Hospital', MainHospital);
            MEMBER.save().then(function (member) {
                layer.msg("保存成功,正在刷新...", function () {
                    window.location.reload();
                });
            });
        });
    } else {//修改会员管家
        var newButler = new AV.Object.createWithoutData('Butler', value);
        MEMBER.set('PersonalButler', newButler);
        MEMBER.save().then(function (member) {
            layer.msg("保存成功", function () {
                window.location.reload();
            });
        });
    }
}
/*
 * 显示5条最近历史通话记录
 * 
 */

function CallRecord(member) {
    var queryRecord = new AV.Query('AgentConversationRecord');
    queryRecord.equalTo('Member', member);
    queryRecord.descending('createdAt');
    queryRecord.include('Agent');
    queryRecord.limit(10);
    queryRecord.find().then(function (results) {
        ShowRecordObject(results);
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
    //query.greaterThan('ConfirmAT', new Date());
    query.descending('ConfirmAT');
    query.find({
        success: function (results) {
            ShowCalenderObject(results);
        }
    });
}
/*
 * 显示通话记录
 * 
 */
function ShowRecordObject(results, t) {
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
/**
 *
 * 最近日程
 * @param results
 * @constructor
 */
//把query后的结果集输出到table中便于公用
function ShowCalenderObject(results) {
    var len = results.length;
    var html = '';
    for (var i = 0; i < len; i++) {
        var obj = results[i];

        var EventType = obj.get('EventType') ? obj.get('EventType').get('EventTypeName') : '无';
        var ConfirmAT = obj.get('ConfirmAT');
        var Hospital = obj.get('Hospital') ? obj.get('Hospital').get('HospitalName') : '无';
        var ConsultingRoom = obj.get('ConsultingRoom') ? obj.get('ConsultingRoom').get('RoomName') : '无';
        var MedicalResult = obj.get('MedicalResult') ? obj.get('MedicalResult').get('MedicalResult') : '无';
        var Statu = obj.get('Statu');
        var StatuArray = {'1':'新建','11':'待提醒','21':'已提醒','31':'已完成'};
        var RatingByMember = "未评分";
        html += '<tr>' +
            '<td>' + EventType + '</td>' +
            '<td>' + timeToString(ConfirmAT) + '</td>' +
            '<td>' + Hospital + '</td>' +
            '<td>' + ConsultingRoom + '</td>' +
            '<td>' + MedicalResult + '</td>' +
            '<td>' + StatuArray[Statu] + '</td>' +
            '<td>' + RatingByMember + '</td>';
        html += '</tr>';
    }
    if (html != '') $("#schedules-table-body").html(html);
}
//就诊记录把query后的结果集输出到table中便于公用
function ShowObject(results, tep) {
    var len = results.length;
    var html = '';
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function () {

            var obj = results[i];
            var Rid = obj.id;
            var DoctorName = '';
            if (obj.get("Doctor") != null) {
                DoctorName = obj.get("Doctor").get("DoctorName");
            } else {
                DoctorName = obj.get("OtherDoctor") + "(系统外)";
            }
            var eventType = '';
            if (obj.get("EventType") != null) {
                eventType = obj.get("EventType").get("EventTypeName");
            }
            var MedicalTime = '';
            if (obj.get("MedicalTime") != null) {
                MedicalTime = obj.get("MedicalTime");
            }
            var Hospital = '';
            if (obj.get("Hospital") != null) {
                Hospital = obj.get("Hospital").get("HospitalName");
            } else {
                Hospital = obj.get("OtherHospital") + "(系统外)";
            }
            var MedicalResult = '';
            if (obj.get("MedicalResult") != null) {
                MedicalResult = obj.get("MedicalResult");
            }
            var MedicalAdvice = '';
            if (obj.get("MedicalAdvice") != null) {
                MedicalAdvice = obj.get("MedicalAdvice");
            }
            var Statu = '';
            if (obj.get("Statu") != null) {
                if (Statu == 1) {
                    Statu = "待会员上传"
                } else {
                    Statu = "已完成";
                }
            }
            html += '<tr>' + '<td>' + DoctorName + '</td>' + '<td>' + eventType + '</td>' + '<td>' + timeToString(MedicalTime) + '</td>' + '<td>' + Hospital + '</td>' + '<td class="my_td">' + MedicalResult + '</td>' + '<td class="my_td">' + MedicalAdvice + '</td>' + '<td>' + Statu + '</td>' +
                '<td>' + '<a href=memberMRDetail.html?id=' + Rid + '>详情</a>' + "|" + '<a href=filloutDiagnosis.html?type=edit&objId=' + Rid + '>编辑</a>' + '</td>' + '</tr>';
            count += 1;
            if (len == count) {
                $("#table-body").html(html);
            }
        })(i)
    }
}


function SeaReportSea(url, typeName) {
    var html = '<img src="' + url + '"/>';
    $("#reportImg").html(html);
    $("#typeName").html(typeName);
    $("#edit_div").css("display", "block");
}
/*
 * 禁用除弹出窗口的其他div
 * 
 * 
 */
function jy(num) {
    var window_width = $(document).width();
    var window_height = $(document).height();
    $(".jy").css("display", "block");
    $(".jy").css("width", window_width);
    $(".jy").css("height", window_height);
    $(".jy").fadeTo("fast", num);
}
/*
 * 修改医生和会员管家
 */
function editDoctor() {
    jy(0.8);
    $("#edit-title span").html('修改主治医生');
    $('.my-labelName').html("医生:");
    $('#Hospital').val('all');
    $("#select").html('<option value="all">---请选择医生---</option>');
    $("#Hospital").attr('onchange', "selectFun(1)");
    $("#changeBtn").attr('data-type', '1');
    $("#edit_div").show();
}
/*
 * 修改医生和会员管家
 */
function editButler() {
    jy(0.8);
    $("#edit-title span").html('修改会员管家');
    $('.my-labelName').html("管家:");
    $('#Hospital').val('all');
    $("#select").html('<option value="all">---请选择会员管家---</option>');
    $("#Hospital").attr('onchange', 'selectFun(2)');
    $("#changeBtn").attr('data-type', '2');
    $("#edit_div").show();
}
/*
 * 修改疾病
 */
function editDisease() {
    ShowCheckBoxs("Disease", "DiseaseName", "Disease_edit", DiseaseIDArray); //显示病情列表
    jy(0.8);
    $(".edit_div_disease").show();
}

function closeEditDiv(th) {
    $(".jy").hide();
    $(th).parent().parent().hide();
}
//显示疾病列表
function ShowCheckBoxs(className, typeName, id, selectedArray) {
    //载入疾病checkbox
    var html = '';
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 1; i <= results.length; i++) {
                if ((i % 2) == 1) {
                    html += "<tr>";
                }
                var obj = results[i - 1];
                var Name = obj.get(typeName);
                if (selectedArray.indexOf(obj.id) >= 0) {
                    html += '<td><input type="checkbox" value="' + obj.id + '" checked="checked"/>' + Name + '</td>';
                } else {
                    html += '<td><input type="checkbox" value="' + obj.id + '" />' + Name + '</td>';
                }
                if ((i % 2) == 0) {
                    html += "</tr>";
                }
            }
            $("#" + id).html(html);
        }
    });
}
//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
    var html_op = '', obj;
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                if (Name == '普通用户')continue;
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).append(html_op);
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
/*
 转到填写诊断结果页面
 */
function AddMedicalResults() {
    console.log("filloutDiagnosis.html?objId=" + geturl());
    window.location.href = "filloutDiagnosis.html?objId=" + geturl();
}
function backToMemberList() {
    var url = $("#windows_data",parent.window.document).attr('data');
    window.location.href = url;
}


//编辑按钮切换
function showEditBtn() {
    if ($(".showEditA").hasClass('edit-active')) {
        $(".showEditA").removeClass('edit-active');
        $(".td-editBtn").hide();
        DataEdit();

    } else {
        DataEdit();
        $(".showEditA").addClass('edit-active');
        $(".td-editBtn").show();
    }
}

function editMemberName() {
    var query = new AV.Query('Member');
    query.get(geturl()).then(function (member) {
        layer.prompt({
            title: "编辑-姓名",
            formType: 0 //prompt风格，支持0-2
        }, function (text) {
            member.set('MemberName', text);
            member.save().then(function () {
                layer.msg('修改成功', {
                    time: 500
                }, function () {

                    $("#MemberName span").html(text);
                    memberMoreData(member);
                    showEditBtn();
                });
            });
        });
    });
}
function showEditCityDiv() {
    ShowSelectOption("City", "CityName", "EditCity");
    jy(0.8);
    $("#edit_div_city").show();
}
function showEditAgentDiv() {
    ShowSelectOption("ServiceAgent", "AgentName", "Agent");
    jy(0.8);
    $("#edit_div_agent").show();
}
function showEditPhoneDiv() {
    var phonestr = $("#MobilePhoneNo span").attr("phone");
    var phoneArray = phonestr.split(",");
    var html = '';
    for (var i = 0; i < phoneArray.length; i++) {
        if (i == 0) {
            html += '<div>主号码:<input data-type="main" value="' + phoneArray[i] + '" placeholder="请输入电话号码"></div>';
        } else {
            html += '<div>副号码:<input value="' + phoneArray[i] + '" placeholder="请输入电话号码"><a href="javascript:;" onclick="deltePhone(this)"> 删除</a></div>';
        }
    }
    $("#phone_list_input").html(html);
    jy(0.8);
    $("#edit_div_phone").show();
}
function editCityBtn() {
    var cityID = $("#EditCity").val();
    if (cityID == 'all') {
        layer.msg('请选择城市');
        return;
    }
    var text = $("#EditCity option:selected").text();
    var city = new AV.Object.createWithoutData('City', cityID);
    MEMBER.set('City', city);
    MEMBER.save().then(function (member) {
        layer.msg("保存成功");
        $('.jy').hide();
        $("#edit_div_city").hide();
        $("#City span").html(text);
    });
}

function editAgentBtn() {
    var agentID = $("#Agent").val();
    if (agentID == 'all') {
        layer.msg('请选择客服');
        return;
    }
    var text = $("#Agent option:selected").text();
    var agent = new AV.Object.createWithoutData('ServiceAgent', agentID);
    MEMBER.set('PersonalAgent', agent);
    MEMBER.save().then(function (member) {
        layer.msg("保存成功");
        $('.jy').hide();
        $("#edit_div_agent").hide();
        $("#personalAgent span").html(text);
    });
}

function addPhoneDiv() {
    $("#phone_list_input").append('<div>副号码:<input placeholder="请输入电话号码"><a href="javascript:;" onclick="deltePhone(this)"> 删除</a></div>');
}
function deltePhone(th) {
    $(th).parent().remove();
}
function editPhoneBtn() {
    var phoneArray = [];
    var flag = false;
    $("#phone_list_input input").each(function () {
        var value = $(this).val();
        if (value == '') {
            flag = true;
        } else if (value.length != 11) {
            flag = true;
        } else if (phoneArray.indexOf(value) == -1) {
            phoneArray.push(value);
        }
    });
    if (flag) {
        layer.msg('请输入正确的电话号码');
        return;
    }
    var appendArray = phoneArray.slice(1);
    MEMBER.set('MobilePhoneNo', phoneArray[0]);
    MEMBER.set('AppendMobilePhoneNo', appendArray);
    MEMBER.save().then(function (member) {
        layer.msg("保存成功");
        $('.jy').hide();
        $("#edit_div_phone").hide();
        $("#MobilePhoneNo span").html(phoneArray[0] + "(主)," + appendArray);
        $("#MobilePhoneNo span").attr('phone', phoneArray);
    });
}


/*
 搜索疾病 显示下列表
 */
function searchDisease() {

    var value = $(".input-disease").val();

    if (!value) {
        $(".disease-search").hide(300);
        return;
    }
    var query = new AV.Query('Disease');
    query.contains('DiseaseName', value);
    query.find().then(function (results) {
        var html = '';
        for (i in results) {
            var obj = results[i];
            html += '<li onclick="checkDiseaseLi(\'' + obj.id + '\',\'' + obj.get('DiseaseName') + '\')">' + obj.get('DiseaseName') + '</li>';
        }
        html += '<li class="no-disease">没有找到该疾病?<a class="btn btn-danger" href="javascript:addDisease()">添加并选中</a></li>';
        $(".disease-search-input").html(html);
        $(".disease-search").show(300);
    });
}

/*
 选中疾病 加入已选
 */
function checkDiseaseLi(id, name) {
    $(".disease-search").hide(300);
    var f;

    var d = ".disease-ul";

    $(d + " li").each(function () {
        if ($(this).html() == name) {
            f = true;
        }
    })
    if (f) {
        layer.msg('不能重复添加同种疾病种');
        return;
    }
    $(d).append('<li data="' + id + '" class="btn btn-default" onclick="removeDisease(this)">' + name + '</li> ')
    $(".input-disease").val('');
}
/*
 添加疾病 并默认加入已选
 */
function addDisease() {
    var name = $('.input-disease').val();
    if (name.indexOf(' ') != -1) {
        layer.msg('添加的疾病名称中含有空格,请检查后重试');
        $(".disease-search").hide(300);
        return;
    }
    var query = new AV.Query('Disease');
    query.equalTo('DiseaseName', name);
    query.first().then(function (obj) {
        if (obj) {//已经存在不能重复添加
            layer.msg('添加失败，已经存在该疾病!');
        } else {
            var newD = new AV.Object('Disease');
            newD.set('DiseaseName', name);
            newD.save().then(function (disease) {
                $(".disease-search").hide(300);
                checkDiseaseLi(disease.id, name);
                layer.msg('添加成功');
            });

        }
    });
    $(".disease-search").hide(300);
}
/*
 取消已选疾病
 */
function removeDisease(th) {
    $(th).remove();
}
/**
 * 鼠标进入搜索下拉列表
 */
function serchMouseOver() {
    MouseFlag = true;
}
/**
 *鼠标离开搜索下拉列表
 */
function serchMouseOut() {
    MouseFlag = false;
}
function bindSearchDieaseInputEvent() {
    $(".my-input").focus(function () {
        searchDisease();
    }).blur(function () {
        if (!MouseFlag) {
            $(".disease-search").hide(300);
        }
    });
}
/*
 编辑疾病提交
 */

function DiseaseEdit() {
    var Disease = [];
    var DiseaseName = [];

    $(".disease-ul li").each(function () {
        var id = $(this).attr('data');
        var name = $(this).html();
        Disease.push(id);
        DiseaseName.push(name);
    });
    var relation = MEMBER.relation("Disease");
    for (k in DiseaseIDArray) {
        relation.remove(AV.Object.createWithoutData('Disease', DiseaseIDArray[k]));
    }
    MEMBER.save().then(function (member) {
        var relation = member.relation("Disease");
        for (j in Disease) {
            relation.add(AV.Object.createWithoutData('Disease', Disease[j]));
        }
        MEMBER.save().then(function (mem) {
            layer.msg("修改成功");
            $("#Disease").html(DiseaseName.toString());
            $('.jy').hide();
            $("#edit_div_disease").hide();
        })
    })
}
//修改时间弹出层
function showEditExpireTimeDiv(type) {
    if(type=='1'){
        var title = '修改到期时间';
        var label_name = '会员到期时间'
        var oldTime = $("#ExpireTime span").html();
    }else{
        var title = '修改加入时间';
        var label_name = '会员加入时间'
        var oldTime = $("#JoinTime span").html();
    }
    //页面层
    layer.open({
        title: title,
        type: 1,
        skin: 'layui-layer-rim', //加上边框
        area: ['220px', '175px'], //宽高
        content: '<div class="marginB10"><p>'+label_name+'</p>' +
        '<div class="my-layer-input"><input id="edit-time"value="' + oldTime + '" placeholder="YYYY-MM-DD hh:mm:ss" onclick="laydate({istime: true, format: \'YYYY-MM-DD hh:mm:ss\'})" readOnly></div>' +
        '<div class="text-center margintop10"><input type="button" class="btn btn-danger" value="确认" onclick="editExpireTime('+type+')"></div></div>'
    });
}
/**
 * 修改到期时间
 */
function editExpireTime(type) {
    var time = $("#edit-time").val();
    var newTime  = new Date(time);
    if(type==1){
        MEMBER.set('ExpireTime',newTime);
    }else{
        MEMBER.set('JoinTime',newTime);
    }
    MEMBER.save().then(function (member) {
        layer.msg('修改成功');
        if(type==1){
            $("#ExpireTime span").html(timeToString(newTime));
        }else{
            $("#JoinTime span").html(timeToString(newTime));
        }
        $(".layui-layer-close1").click();
    });
}