$(document).ready(function () {
    main();
    EventBind();

});

var iObj = $('.i');
var haveMedicalResult; //图片保存的时候储存增加的MedicalResult对象
var ConfirmATObj, useOtherTime = 0;
var EventTypeObj, MemberObj, HospitalObj, DoctorObj;
/*var MedicalReport = AV.Object.extend('MedicalReport');*/
var MEDICALREPORTS=[];
var MedicalResult = AV.Object.extend('MedicalResult');
function main() {

    var type = getUrlParam('type');
    var id = getUrlParam('objId');
    if(type){//type存在 修改就诊记录
        $(".save").show();
        $(".title").html("编辑就诊记录");
        var query = new AV.Query('MedicalResult');
        query.include('Member');
        query.include('EventType');
        query.get(id).then(function (result) {
            haveMedicalResult = result;
            var relation = result.relation('Reports');
            relation.query().find().then(function (imgs) {
                var len = imgs.length;
                $('#upFile').hide();
                for(var i = 0;i<len;i++){
                    var obj = imgs[i];
                    var url = obj.get("RawFile").url();
                    var name =  obj.get('RawFile').name().split('.')[0];
                    var h = '<div class="col-md-2"><img src="' +url + '" alt="no"><span>' +name + '</span>'
                        +'<span>'
                        +'<a type="button" class="btn btn-default my-delete-btn"  onclick="deleteImg(this,\''+obj.id+'\')">删除</a>'
                        +'</span>'+'</div>';
                    $('.row').prepend(h);
                }
            });
            var memberName = result.get('Member') ? result.get('Member').get('MemberName') : '';
            MemberObj = result.get('Member');
            var doctorName = result.get('OtherDoctor') ? result.get('OtherDoctor') : '';
            var EventTypeID = result.get('EventType') ? result.get('EventType').id : '';
            ShowSelectOption("EventType", "EventTypeName", "eventType",EventTypeID); //显示下拉列表
            var OtherHospital = result.get('OtherHospital') ? result.get('OtherHospital') : '';
            var time = result.get('MedicalTime') ? result.get('MedicalTime') : '';
            var ChiefComplaint = result.get('ChiefComplaint') ? result.get('ChiefComplaint') : '';
            var HPC = result.get('HPC') ? result.get('HPC') : '';
            var Result = result.get('MedicalResult') ? result.get('MedicalResult') : '';
            var MedicalAdvice = result.get('MedicalAdvice') ? result.get('MedicalAdvice') : '';
            $('#memberName').val(memberName);
            $('#doctorName').val(doctorName);
            $('#hospital').val(OtherHospital);
            $('#time').val(timeToString(time));
            $('#ChiefComplaint').val(ChiefComplaint);
            $('#HPC').val(HPC);
            $('#MedicalResult').val(Result);
            $('#MedicalAdvice').val(MedicalAdvice);


        });
    }else{//新增就诊记录
        ShowSelectOption("EventType", "EventTypeName", "eventType"); //显示病情下拉列表
        var query = new AV.Query('Member');
        $(".sure").show();
        $(".title").html("新增就诊记录");
        query.get(id).then(function (member) {
            MemberObj = member;
            var memberName = member.get('MemberName') ? member.get('MemberName') : '';
            $('#memberName').val(memberName);
        });
    }
}
/*
删除旧图片
*/
function  deleteImg(th,id){
    var newIMG = new AV.Object.createWithoutData('MedicalReport',id);
    newIMG.destroy().then(function (success) {
        // 删除成功
        layer.msg('删除成功', {time: 1000}, function () {
            $(th).parent().parent().remove();
        });
    }, function (error) {
        // 删除失败
    });
}
/*
 删除新增的图片
 */
function  deleteImgAdd(th,id){
    var newFile = new AV.File.createWithoutData(id);
    var query = new AV.Query('MedicalReport');
    query.equalTo('RawFile',newFile);
    query.first().then(function (obj) {
        obj.destroy().then(function (success) {
            // 删除成功
            layer.msg('删除成功', {time: 1000}, function () {
                $(th).parent().parent().remove();
            });
        })
    })
}

function upload() {
    //var eventsCalendar = AV.Object.createWithoutData('EventsCalendar', getURLParameter(url,'objId'));
    var Image = $("#exampleInputFile")[0];
    var fileArray = [];
    if(Image.files.length==0){
        layer.msg('请选择图片');
        return;
    }
    for(var i=0; i<Image.files.length;i++){
        var file = Image.files[i];
        var name = file.name;
        fileArray.push(new AV.File(name, file));
    }
    var objesArray;
    AV.Object.saveAll(fileArray).then(function (objes) {
        objesArray = objes;
        var reportArray=[];
        for(var i=0; i<objes.length;i++){
            var medicalReport = new AV.Object('MedicalReport');
            medicalReport.set("RawFile", objes[i]);
            reportArray.push(medicalReport.save());
        }
        return AV.Promise.all(reportArray)
    }).then(function (medicalReports) {
        for(j in medicalReports){
            MEDICALREPORTS.push(medicalReports[j]);
        }
        layer.msg('增加成功,系统正在整理...');
        $('#upFile').hide();
        for (j in objesArray){
            var file = objesArray[j];
            var url = file.url();
            var name =  file.name().split('.')[0];
            var h = '<div class="col-md-2"><img src="' +url + '" alt="no"><span>' +name + '</span>'
                +'<span>'
                +'<a type="button" class="btn btn-default my-delete-btn" href="javascript:;" onclick="deleteImgAdd(this,\''+file.id+'\')">删除</a>'
                +'</span>'+'</div>';
            $('.row').prepend(h);
        }
    }).catch(function (error) {
        console.log(error);
    })
}


//保存操作
function saveDate() {
    subStart();
    var doctorName = $("#doctorName").val();
    var EventTypeID = $("#eventType option:selected").val(); //投诉对象类型
    var hospital = $("#hospital").val();
    var time = $("#time").val();

    var ChiefComplaint = $("#ChiefComplaint").val();
    var HPC = $("#HPC").val();
    var Result = $("#MedicalResult").val();
    var MedicalAdvice = $("#MedicalAdvice").val();
    if (doctorName == '') {
        subEnd();
        layer.msg('请填写医生姓名', {
            shift: 6,
            time: 600
        });
        return;
    }
   /* if (EventTypeID == 'all') {
        subEnd();
        layer.msg('请选择就诊类型', {
            shift: 6,
            time: 600
        });
        return;
    }*/
    if (hospital == '') {
        subEnd();
        layer.msg('请填写医院名称', {
            shift: 6,
            time: 600
        });
        return;
    }
    /*if (time == '') {
        subEnd();
        layer.msg('请选择就诊时间', {
            shift: 6,
            time: 600
        });
        return;
    }*/
    /*if (ChiefComplaint == '') {
        subEnd();
        layer.msg('请输入主诉', {
            shift: 6,
            time: 600
        });
        return;
    }
    if (HPC == '') {
        subEnd();
        layer.msg('请输入现病史', {
            shift: 6,
            time: 600
        });
        return;
    }
    if (Result == '') {
        subEnd();
        layer.msg('请填写医生诊断结果', {
            shift: 6,
            time: 600
        });
        return;
    }
    if (MedicalAdvice == '') {
        subEnd();
        layer.msg('请填写医生嘱咐', {
            shift: 6,
            time: 600
        });
        return;
    }*/
    var newResultsObj;
    if (haveMedicalResult) {//如果编辑就诊记录已经存在该对象
        newResultsObj = haveMedicalResult;
    } else {
        var MedicalResult = AV.Object.extend('MedicalResult');
        newResultsObj = new MedicalResult();
    }
    if(time!=''){
        newResultsObj.set('MedicalTime', new Date(time));
    }
    if(EventTypeID!='all'){
        newResultsObj.set('EventType', new AV.Object.createWithoutData('EventType', EventTypeID));
    }
    if(HPC!=''){
        newResultsObj.set('HPC', HPC);
    }
    newResultsObj.set('Member', MemberObj);
    newResultsObj.set('OtherHospital', hospital);
    newResultsObj.set('OtherDoctor', doctorName);

    if(ChiefComplaint!=''){
        newResultsObj.set('ChiefComplaint', ChiefComplaint);
    }
    if(Result!=''){
        newResultsObj.set('MedicalResult', Result);
    }
    if(MedicalAdvice!=''){
        newResultsObj.set('MedicalAdvice', MedicalAdvice);
    }
    var relation = newResultsObj.relation('Reports');
    for(i in MEDICALREPORTS){
        relation.add(MEDICALREPORTS[i]);
    }
    newResultsObj.set('Statu', 2);
    newResultsObj.save().then(function (data) {
        layer.msg('保存成功', {time: 1000}, function () {
            window.history.back();
        }, function (error) {
            console.log(error);
        });
    });
}
function EventBind() {
    $('.sure_up_img').click(function () {
        upload();
    });
    $('#upFile').click(function (e) {
        e.stopPropagation();
        $(this).hide();
    });
    $('.inner').click(function (e) {
        e.stopPropagation();
    });
    //新建信息
    $('.sure').click(function () {
        saveDate();
    });
    //编辑信息
    $('.save').click(function () {
        saveDate();
    });
}

//事件
function showUpFile() {
    $('#upFile').show();
}


//时间选择
timePick();
function timePick() {
    var s_current_time = $('#s_current_time');
    var s_other_time = $('#s_other_time');
    var other_time = $('.other_time');
    s_current_time.click(function () {
        useOtherTime = 0;
        other_time.hide();
        s_current_time.attr('class', 'span_selected');
        s_other_time.attr('class', 'span_no_selected');
    });
    s_other_time.click(function () {
        useOtherTime = 1;
        other_time.show();
        s_current_time.attr('class', 'span_no_selected');
        s_other_time.attr('class', 'span_selected');
    });
}

function ShowSelectOption(className, typeName, id,selected) {
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
            if(selected){
                var TempStr = "#" + id+ " option[value=\'" + selected + "\']"; //选中
                $(TempStr).attr("selected", true);
            }
        }
    });
}

/*
 * 按钮禁用与启用
 *
 */
function subStart() {
    $(".subButton").attr("disabled", "disabled"); //按钮禁用
    $(".subButton").css("background-color", "#808080");
    $(".subButton").css("border-color", "#808080");
}

function subEnd() {
    $(".subButton").removeAttr("disabled"); //将按钮可用
    $(".subButton").css('background-color', '#D9534F');
    $(".subButton").css("border-color", "#D9534F");
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