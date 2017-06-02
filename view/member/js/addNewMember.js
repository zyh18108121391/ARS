/**
 * Created by 郑银华 on 2016/11/28.
 */
var MEMBER;//保存会员对象 方便修改
var OldDiseasesArray; //修改前的疾病数组
var MouseFlag = false;//鼠标是否进入搜索下拉列表
$(document).ready(
    function () {
        ShowSelectOption("MemberLevel", "LevelName", "MemberLevel"); //显示会员等级下拉列表
        ShowSelectOption("Hospital", "HospitalName", "Hospital");
        ShowSelectOption("City", "CityName", "City");
        bindSearchDieaseInputEvent();
    }
);


//输入电话触发事件
function changEvent(event) {
    var telNo = event.target.value;
    if (telNo.length == 11) {
        _searchThisTelNo(telNo);
    }
}
//根据电话号码查询会员
function _searchThisTelNo(telNo) {
    initMemberDetail();

    var query = new AV.Query('Member');
    query.equalTo('MobilePhoneNo', telNo);
    query.include('PersonalDoctor');
    query.include('PersonalButler');
    query.include('Hospital');
    query.include('MemberLevel');
    var html = '';
    query.first().then(function (member) {
        if (member) {
            MEMBER = member;
            var LevelName = member.get('MemberLevel').get('LevelName');
            if (LevelName == '普通用户') {
                html = '<strong class="notice-level">普通用户</strong>,可进行会员<strong>升级</strong>。';
            } else {
                $("#MemberLevel").val(member.get('MemberLevel').id);
                $("#submit-btn").attr('data-levelID', member.get('MemberLevel').id);
                html = '<strong class="notice-level">' + LevelName + '</strong>,可进行会员<strong>升级</strong>。'
            }
            var IDCard = member.get('IDCard');
            if (IDCard) {
                $('#IDCard').val(IDCard);
            }
            if (member.get('PersonalDoctor') && member.get('Hospital')) {
                $('#PersonalDoctor').html(member.get('PersonalDoctor').get('DoctorName') + "(" + member.get('Hospital').get("HospitalName") + ")");
                $('#PersonalDoctor').attr('data-hospital', member.get('Hospital').id);
                $('#PersonalDoctor').attr('data-doctor', member.get('PersonalDoctor').id);
            }
            if (member.get('PersonalButler')) {
                $('#PersonalButler').html(member.get('PersonalButler').get('ButlerName'));
                $('#PersonalButler').attr('data-butler', member.get('PersonalButler').id);
            }
            if (member.get('City')) {
                $('#City').val(member.get('City').id);
            }
            var relation = member.relation('Disease');
            relation.query().find().then(function (diseases) {
                OldDiseasesArray = diseases;
                var html = '';
                for (t in diseases) {
                    var obj = diseases[t];
                    html += '<li data="' + obj.id + '" class="btn btn-default" onclick="removeDisease(this)">' + obj.get('DiseaseName') + '</li> ';
                }
                $(".Pre-disease-ul").html(html);
            });

            var MemberName = member.get('MemberName');
            if (MemberName) {
                $('#Name').val(MemberName);
            }
            var Sex = member.get('Sex');
            if (Sex >= 0) {
                $("#Sex input[type=radio][value=" + Sex + "]").prop('checked', 'checked');
            } else {
                $('#Sex input[type=radio][value="-1"]').prop('checked', 'checked');
            }
            var MaritalStatus = member.get('MaritalStatus');
            if (MaritalStatus >= 0) {
                $('#MaritalStatus input[type=radio][value=' + MaritalStatus + ']').prop('checked', 'checked');
            }
            $('#Nation').val(member.get('Nation') ? member.get('Nation') : '');
            $('#NativePlace').val(member.get('NativePlace') ? member.get('NativePlace') : '');
            $('#Address').val(member.get('Address') ? member.get('Address') : '');
            $('#Height').val(member.get('Height') ? member.get('Height') : '');
            $('#Weight').val(member.get('Weight') ? member.get('Weight') : '');
            $('#Profession').val(member.get('Profession') ? member.get('Profession') : '');
            $('#DiseaseTime').val(member.get('DiseaseTime') ? member.get('DiseaseTime') : '');
            var time = member.get('ContectTime');
            $('#Contect_Time').val(timeToStringNoMs(time));
            $('#Memo').val(member.get('Memo') ? member.get('Memo') : '');
            $('input[type=radio][name=level-check][value="1"]').prop('checked', 'checked');
            $('input[type=radio][name=level-check][value="2"]').prop('checked', false);
        } else {
            html = '暂无该会员信息,可<strong>新增</strong>会员。';
            $('input[type=radio][name=level-check][value="1"]').prop('checked', false);
            $('input[type=radio][name=level-check][value="2"]').prop('checked', 'checked');
        }
        $('#notice').html(html);
    })
}
/*
 初始化输入框
 */
function initMemberDetail() {
    $('#IDCard').val('');
    $("#MemberLevel").val('all');
    $("#City").val('all')
    $("#PersonalDoctor").html('');
    $('#PersonalDoctor').removeAttr('data-hospital');
    $('#PersonalDoctor').removeAttr('data-doctor');
    $('#PersonalButler').removeAttr('data-butler');
    $('#PersonalButler').html('');
    $('#Disease input[type=checkbox]').prop('checked', false);
    $("#submit-btn").attr('data-levelID', '');
    $('#Name').val('');
    $('#Sex input[type=radio][value="-1"]').prop('checked', 'checked');
    $('#Nation').val('');
    $('#NativePlace').val('');
    $('#Address').val('');
    $('#Height').val('');
    $('#Weight').val('');
    $('#Profession').val('');
    $('#DiseaseTime').val('');
    $('#Contect_Time').val('');
    $('#Memo').val('');
}

function timeToStringNoMs(time) {
    if (time) {
        return time.getFullYear() + '-' + ToTime((time.getMonth() + 1)) + "-" + ToTime(time.getDate()) + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes());
    } else {
        return "";
    }
}
function ToTime(time) {
    if (time >= 0 && time < 10) {
        time = "0" + time;
    }
    return time;
}
function IDCardChange(event) {
    var value = event.target.value;
    if (value.length == 18) {
        var birth = value.substr(6, 4) + '-' + value.substr(10, 2) + "-" + value.substr(12, 2);
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
    var hospitalID = $("#Hospital option:selected").val();
    var hospitalName = $("#Hospital option:selected").text();
    var type = $("#changeBtn").attr('data-type');
    var valueID = $("#select option:selected").val();
    var valueName = $("#select option:selected").text();
    if (hospitalID == 'all') {
        var str = '请选择医院';
        layer.msg(str);
        return;
    }
    if (valueID == 'all') {
        if (type == '1') {
            var str = '请选择医生';
        } else {
            var str = '请选择会员管家';
        }
        layer.msg(str);
        return;
    }
    if (type == '1') {//医生
        $('#PersonalDoctor').attr('data-hospital', hospitalID);
        $('#PersonalDoctor').attr('data-doctor', valueID);
        $('#PersonalDoctor').html(valueName + "(" + hospitalName + ")");
    } else {//会员管家
        $('#PersonalButler').attr('data-butler', valueID);
        $('#PersonalButler').html(valueName + "(" + hospitalName + ")");
    }
    closeAsk();
}

/**
 * 提交
 * 新增会员或者升降会员等级
 */
function addNewMember() {
    var tep = $("#submit-btn").attr('data-levelid');
    var doType = $("input[type=radio][name=level-check]:checked").val();
    var IDCard = $("#IDCard").val();
    var levelID = $("#MemberLevel option:selected").val();
    var levelName = $("#MemberLevel option:selected").text();
    var MobilePhoneNo = $("#MobilePhoneNo").val();

    if (MobilePhoneNo == '' || MobilePhoneNo.length != 11) {
        layer.msg('电话号码不能为空或输入位数不正确');
        return;
    }
    if (levelID == 'all') {
        layer.msg('请选择会员等级');
        return;
    }
    var MobilePhoneNo = $("#MobilePhoneNo").val();
    var cityID = $("#City option:selected").val();
    var hospitalID = $("#PersonalDoctor").attr('data-hospital');
    if (!hospitalID) {
        hospitalID = "576bd22b165abd00545d2046"; //默认为第三军医大附属新桥医院
    }
    var doctorID = $("#PersonalDoctor").attr('data-doctor');
    var butlerID = $("#PersonalButler").attr('data-butler');
    var DiseaseArray = [];
    $(".Pre-disease-ul li").each(function () {
        var id = $(this).attr('data');
        DiseaseArray.push(id);
    });
    var Name = $("#Name").val();
    if (doType == 2 && Name == '' || !tep && Name == '') {
        layer.msg('姓名不能为空');
        return;
    }
    var sex = $("input[type=radio][name=sex]:checked").val();
    var MaritalStatus = $("input[type=radio][name=marry]:checked").val();
    var Nation = $("#Nation").val();
    var NativePlace = $("#NativePlace").val();
    var Address = $("#Address").val();
    var Height = $("#Height").val();
    var Weight = $("#Weight").val();
    var Profession = $("#Profession").val();
    var DiseaseTime = $("#DiseaseTime").val();
    var Contect_Time = $("#Contect_Time").val();
    var Memo = $("#Memo").val();
    var newMemberLevel = AV.Object.createWithoutData('MemberLevel', levelID);

    if (levelName == 'VIP') {
        var code = 2;
    } else {
        var code = 1;
    }
    var data = {
        code: code,
        name: Name,
        phoneno: MobilePhoneNo,
        sex: sex,
    };
    if (doType == 1) { //更改会员等级
        MEMBER.set('MemberLevel', newMemberLevel);
        if (cityID != 'all') MEMBER.set('City', AV.Object.createWithoutData('City', cityID));
        if (IDCard) {
            var birth = IDCard.substr(6, 4) + '-' + IDCard.substr(10, 2) + "-" + IDCard.substr(12, 2);
            MEMBER.set('IDCard', IDCard);
            MEMBER.set('Birth', birth);
        }
        MEMBER.set('Hospital', AV.Object.createWithoutData('Hospital', hospitalID));
        if (doctorID) MEMBER.set('PersonalDoctor', AV.Object.createWithoutData('Doctor', doctorID));
        if (butlerID) MEMBER.set('PersonalButler', AV.Object.createWithoutData('Butler', butlerID));
        var relation = MEMBER.relation("Disease");
        for (k in OldDiseasesArray) {
            relation.remove(OldDiseasesArray[k]);
        }
        if (sex)MEMBER.set('Sex', parseInt(sex));
        if (Name)MEMBER.set('MemberName', Name);
        if (MaritalStatus >= 0)MEMBER.set('MaritalStatus', parseInt(MaritalStatus));
        if (Nation)MEMBER.set('Nation', Nation);
        if (NativePlace)MEMBER.set('NativePlace', NativePlace);
        if (Address)MEMBER.set('Address', Address);
        if (Height)MEMBER.set('Height', Height);
        if (Weight)MEMBER.set('Weight', Height);
        if (Profession)MEMBER.set('Profession', Profession);
        if (DiseaseTime)MEMBER.set('DiseaseTime', DiseaseTime);
        if (Memo)MEMBER.set('Memo', Memo);
        var Contect_Time = new Date(Contect_Time);
        var exprire = new Date();
        exprire.setFullYear(exprire.getFullYear() + 1);
        if(levelName=='体验卡'){
            exprire.setMonth(exprire.getMonth()-6);
        }
        MEMBER.set('ContectTime', Contect_Time);
        MEMBER.set('JoinTime', new Date());
        MEMBER.set('ExpireTime', exprire);
        MEMBER.save().then(function (Member) {
            var relation = Member.relation("Disease");
            for (var i = 0; i < DiseaseArray.length; i++) {
                relation.add(AV.Object.createWithoutData('Disease', DiseaseArray[i]));
            }
            save(MEMBER, data);
        });
    } else { //member中没有数据新增一条member会员
        var newMember = new AV.Object('Member');
        newMember.set('MobilePhoneNo', MobilePhoneNo);
        newMember.set('MemberLevel', newMemberLevel);
        if (IDCard) {
            newMember.set('IDCard', IDCard);
            var birth = IDCard.substr(6, 4) + '-' + IDCard.substr(10, 2) + "-" + IDCard.substr(12, 2);
            newMember.set('Birth', birth);
        }
        if (cityID != 'all') newMember.set('City', AV.Object.createWithoutData('City', cityID));
        newMember.set('Hospital', AV.Object.createWithoutData('Hospital', hospitalID));
        if (doctorID) newMember.set('PersonalDoctor', AV.Object.createWithoutData('Doctor', doctorID));
        if (butlerID) newMember.set('PersonalButler', AV.Object.createWithoutData('Butler', butlerID));
        var relation = newMember.relation("Disease");
        for (var i = 0; i < DiseaseArray.length; i++) {
            relation.add(AV.Object.createWithoutData('Disease', DiseaseArray[i]));
        }
        if (sex)newMember.set('Sex', parseInt(sex));
        newMember.set('MemberName', Name);
        if (MaritalStatus >= 0)newMember.set('MaritalStatus', parseInt(MaritalStatus));
        if (Nation)newMember.set('Nation', Nation);
        if (NativePlace)newMember.set('NativePlace', NativePlace);
        if (Address)newMember.set('Address', Address);
        if (Height)newMember.set('Height', Height);
        if (Weight)newMember.set('Weight', Height);
        if (Profession)newMember.set('Profession', Profession);
        if (DiseaseTime)newMember.set('DiseaseTime', DiseaseTime);
        if (Memo)newMember.set('Memo', Memo);
        var Contect_Time = new Date(Contect_Time);
        var exprire = new Date();
        exprire.setFullYear(exprire.getFullYear() + 1);
        if(levelName=='体验卡'){
            exprire.setMonth(exprire.getMonth()-6);
        }
        newMember.set('ContectTime', Contect_Time);
        newMember.set('JoinTime', new Date());
        newMember.set('ExpireTime', exprire);
        save(newMember, data);
    }
}
//保存对象 并发送短信
function save(member, data) {
    var checked = $("#sendMessage").prop('checked');
    member.save().then(function (mem) {
        if (checked) {//发送短信
            AV.Cloud.run('SendMessage', data, function (data) {
                console.log(data);
                if (data == '成功!') {
                    _saveSuccessNotice();
                } else {
                    layer.msg('提交失败');
                }
            })
        } else {
            _saveSuccessNotice();
        }
    });
    function _saveSuccessNotice() {
        layer.confirm('提交成功!', {
            btn: ['返回', '继续操作'] //按钮
        }, function () {
            back();
        }, function () {
            window.location.reload();
        });
    }
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
    $("#edit-title span").html('选择主治医生');
    $('.my-labelName').html("医生:");
    $('#Hospital').val('all');
    $("#select").html('<option value="all">---请选择医生---</option>');
    $("#Hospital").attr('onchange', "selectFun(1)");
    $("#changeBtn").attr('data-type', '1');
    $(".edit_div").show();
}
/*
 * 修改医生和会员管家
 */
function editButler() {
    jy(0.8);
    $("#edit-title span").html('选择会员管家');
    $('.my-labelName').html("管家:");
    $('#Hospital').val('all');

    $("#select").html('<option value="all">---请选择会员管家---</option>');
    $("#Hospital").attr('onchange', 'selectFun(2)');
    $("#changeBtn").attr('data-type', '2');
    $(".edit_div").show();
}
/*
 * 关闭div
 */
function closeAsk() {
    $(".jy").css("display", "none");
    $("#edit_div").css("display", "none");
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

/**
 *
 * input搜索疾病模块代码
 *
 */
/*
 搜索疾病 显示下列表
 */
function searchDisease(t) {
    if (t == 0) {
        var value = $(".Pre-disease-input").val();
    } else if (t == 1) {
        var value = $(".Exa-disease-input").val();
    } else {
        var value = $(".Lab-disease-input").val();
    }
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
            html += '<li onclick="checkDiseaseLi(\'' + obj.id + '\',\'' + obj.get('DiseaseName') + '\',' + t + ')">' + obj.get('DiseaseName') + '</li>';
        }
        html += '<li class="no-disease">没有找到该疾病?<a class="btn btn-danger" href="javascript:addDisease(' + t + ')">添加并选中</a></li>';
        $(".disease-search-input").html(html);
        $(".disease-search").show(300);
    });
}
/*
 选中疾病 加入已选
 */
function checkDiseaseLi(id, name, t) {
    $(".disease-search").hide(300);
    var f;
    if (t == 0) {
        var d = ".Pre-disease-ul";
    } else if (t == 1) {
        var d = ".Exa-disease-ul";
    } else {
        var d = ".Lab-disease-ul";
    }
    $(d + " li").each(function () {
        if ($(this).html() == name) {
            f = true;
        }
    })
    if (f) {
        layer.msg('不能重复添加同种疾病种');

        return;
    }
    $(d).append(' <li data="' + id + '" class="btn btn-default" onclick="removeDisease(this)">' + name + '</li>')
    $("#input-disease").val('');

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
/*
 添加疾病 并默认加入已选
 */
function addDisease(t) {
    var name = $('.Pre-disease-input').val();
    if (name.indexOf(' ') != -1) {
        layer.msg('添加的疾病名称中含有空格,请检查后重试');
        $(".disease-search").hide(300);
        return;
    }
    var query = new AV.Query('Disease');
    query.equalTo('DiseaseName', name);
    query.first().then(function (obj) {
        if(obj){//已经存在不能重复添加
            layer.msg('添加失败，已经存在该疾病!');
        }else{
            var newD = new AV.Object('Disease');
            newD.set('DiseaseName', name);
            newD.save().then(function (disease) {
                $(".disease-search").hide(300);
                checkDiseaseLi(disease.id, name, t);
                layer.msg('添加成功');
            });

        }
    });
    $(".disease-search").hide(300);
}
function bindSearchDieaseInputEvent() {
    $(".my-input").focus(function () {
        var date = $(this).attr('date-type');
        searchDisease(date);
    }).blur(function () {
        if (!MouseFlag) {
            $(".disease-search").hide(300);
        }
    });
}
/***********end*************/


/*
 * 返回
 */
function back() {
    window.history.back(-1);
}