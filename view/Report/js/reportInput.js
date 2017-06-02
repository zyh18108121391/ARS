/**
 * Created by admin on 2016/12/8.
 */
var REPORT;//保存当前报告字段 方便修改
var DRUGTYPEHTML;//保存药品种类
var MEMBER, DOCTOR, REPORT, MEDICALRESULT;
var oldCauseArray = [];//新增检验标本 保存旧的目的
var LabItemIsExist;
var MouseFlag = false;//鼠标是否进入搜索下拉列表
$(document).ready(function () {
    main();
    ShowSelectOption('DrugType', "TypeName", '.input-drug-type', 1);//显示药品种类

    ShowSelectOption('ExamClassDict', "ClassName", '#ExamClassDict');//显示检验类型
    ShowCheckBoxs("Disease", "DiseaseName", ".Disease"); //显示病情列表

    ShowSelectOption('SpecimenDict', "SpecimenName", '#SpecimenDict');//显示检查标本
    $('.Disease-div').hide();

    bindSearchInputEvent();
    bindSearchDieaseInputEvent();
    bindBtngGroup();

})
function main() {
    var id = getUrlParam('id');
    var from = getUrlParam('from');
    if (from == 'member') {
        $(".from-member").show();
        $(".from-list").hide();
    } else {
        $(".from-member").hide();
        $(".from-list").show();
    }
    var query = new AV.Query("MedicalReport");
    query.get(id).then(function (report) {
        getNextReport(report.id);
        REPORT = report;
        var url = report.get('RawFile').url();
        var t = report.get('RawFile').name();
        var name = '';
        if (t.indexOf('.jpg') >= 0 || t.indexOf('.JPG') >= 0 || t.indexOf('.png') >= 0 || t.indexOf('.PNG') >= 0 || t.indexOf('.GIF') >= 0 || t.indexOf('.gif') >= 0) {
            name = t.substring(0, t.length - 4);
        }
        showMgImg(url);
        $(".input-imgName").html(name);
        var mqueru = new AV.Query("MedicalResult");
        mqueru.equalTo('Reports', report);
        mqueru.include('Member');
        mqueru.first().then(function (result) {
            if (result) {
                MEDICALRESULT = result;
                DOCTOR = result.get('Member').get('PersonalDoctor');
                MEMBER = result.get('Member');
            }
        })
    })
}
/*
 显示图片动态设置图片的高度
 */
function showMgImg(url) {
    $(".report-img").attr("src", url);
    var image = new Image()
    image.src = url;
    setTimeout(function () {
        var naturalWidth = image.width
        var naturalHeight = image.height;
        var wd = $(".col-md-5").width();
        var _mag = naturalWidth / wd; //放小倍数
        var hg = naturalHeight / _mag; //图片实际显示高度
        $("#mgImg").css("height", hg + "px");
        $(".img-thumbnail").show(300);
    }, 500);
}
/*
 获取下一条数据
 */
function getNextReport(id) {
    var count = 0;
    var next;
    _search();
    function _search() {
        var query = new AV.Query('MedicalReport');
        query.skip(count * 1000);
        query.limit(1000);
        query.descending('createdAt');
        query.equalTo('IsInput',false);
        query.find().then(function (results) {
            var len = results.length;
            for (i in results) {
                if (id == results[i].id) { //找到该条数据
                    if (i != len - 1) { //不是最后一条数据
                        next = results[parseInt(i) + 1].id;
                        $(".next-rep").attr('next', next);
                    }
                    $("#next-btn").removeAttr("disabled");//将按钮可用
                    break;

                }
            }
            if (len == 1000) {
                count += 1;
                _search();
            }
        });
    }
}
/*
 增加药品
 */
function addDrugDivLi() {
    var html = '<div class="drug-li relative">'
        + '<input type="text" oninput="searchDrug(this)"  placeholder="药品名称" class="drug-name search-input"> '
        + '<span class="flag-success" style="background-color: rgb(17, 205, 110);">√</span>'
        + ' <input type="text" placeholder="数量" class="search-input drug-count">'
        + '<span class="unit"></span>'
        + '<a href="javascript:;" onclick="deleteDrug(this)" class="drug-a-del">删除</a>'
        + '<div class="DosageNAdministration">'
        + '<input type="text" placeholder="用法" class="usage-input search-input">'
        + ' <input type="number" placeholder="使用期限" class="seupDate-input search-input"><span class="span-text">天</span>'
        + '</div>'
        + '</div>';
    $(".drug-search").before(html);
    bindSearchInputEvent();
}
function saveBtn() {
    var value = $("#report-type").val();
    if (value == 0) {
        savePrescription();
    } else if (value == 1) {
        saveExam();
    } else {
        saveClinic();
    }
}
/**
 * 提交处方报告
 */
function savePrescription() {
    var MedicalTime = $("#P-Time").val();
    var Price = $("#P-Price").val();
    var PType = $("input:radio[name=preType]:checked").val();

    var drugArray = [];
    var nullDom = [];
    var diseaseArray = [];
    $(".Pre-disease-ul li").each(function () {
        var id = $(this).attr('data');
        diseaseArray.push(id);
    });
    var dateErr = false;
    var drugErr = false;
    var countErr = false;
    var usageErr = false;

    $(".drug-li").each(function () {
        var drugID = $(this).children('.drug-name').attr('drugID');
        var success = $(this).children('.flag-success').css('display');
        var count = $(this).children('.drug-count').val();
        var usage = $(this).children('.DosageNAdministration').children('.usage-input').val();
        var UseupDate = $(this).children('.DosageNAdministration').children('.seupDate-input').val();
        if (success == 'none') {
            drugErr = true;
        }
        if (count <= 0) {
            countErr = true;
        }
        if (usage == '') {
            usageErr = true;
        }
        if (UseupDate <= 0) {
            dateErr = true;
        }
        drugArray.push({
            DrugID: drugID,
            Count: count,
            Usage: usage,
            UseupDate: UseupDate,
        })
    });
    if (drugErr) {
        layer.msg('请选择正确的药品', {time: 800});
        return;
    }
    if (countErr) {
        layer.msg('药品数量不正确', {time: 800});
        return;
    }
    if (usageErr) {
        layer.msg('药品用法不能为空', {time: 800});
        return;
    }
    if (dateErr) {
        layer.msg('药品使用期限不正确', {time: 800});
        return;
    }
    var saveArray = [];
    for (j in drugArray) {
        var obj = drugArray[j];
        var newPrescriptionDetail = new AV.Object('PrescriptionDetail');
        newPrescriptionDetail.set('Member', MEMBER);
        newPrescriptionDetail.set('Drug', AV.Object.createWithoutData('Drug', obj.DrugID));
        newPrescriptionDetail.set('Count', parseInt(obj.Count));
        newPrescriptionDetail.set('Usage', obj.Usage);
        var newDate = new Date(MedicalTime);
        newDate.setDate(newDate.getDate() + parseInt(obj.UseupDate));
        newPrescriptionDetail.set('UseupDate', newDate);
        saveArray.push(newPrescriptionDetail);
    }
    AV.Object.saveAll(saveArray).then(function (objects) {
        var newPrescription = new AV.Object('Prescription');
        newPrescription.set('Member', MEMBER);
        newPrescription.set('Doctor', DOCTOR);
        newPrescription.set('MedicalTime', new Date(MedicalTime));
        newPrescription.set('Price', parseFloat(Price));
        newPrescription.set('PrescriptionType', parseInt(PType));
        var relation = newPrescription.relation('PrescriptionDetail');
        var relationDisease = newPrescription.relation('Disease');
        for (i in diseaseArray) {
            relationDisease.add(AV.Object.createWithoutData('Disease', diseaseArray[i]))
        }
        for (j in saveArray) {
            relation.add(saveArray[j]);
        }
        newPrescription.save().then(function (pre) {
            saveReportPublic(0, pre);
        }, function (error) {
            console.log(error);
        });
    }, function (error) {
        // 异常处理
        console.log(error);
    });
}
/**
 *  保存检查报告
 */
function saveExam() {
    var ExamItem = $("#ExamItem").val();
    var ExamClassDictID = $("#ExamClassDict option:selected").val();
    var ExamSubClassDictID = $("#ExamSubClassDict option:selected").val();
    var ExamDateTime = $("#ExamDateTime").val();
    var DiseaseArray = [];
    $(".Exa-disease-ul li").each(function () {
        var id = $(this).attr('data');
        DiseaseArray.push(id);
    });
    var Impression = $("#Impression").val();
    var Recommendation = $("#Recommendation").val();
    var Memo = $("#Exam-Memo").val();
    var ExamFinding = $("#ExamFinding").val();

    var IsAbnormal = $("input[type=radio][name='IsAbnormal']:checked").val();
    /*if(ExamCause==''){
     layer.msg('检查目的不能为空');
     return ;
     }
     if(ExamItem==''){
     layer.msg('检查项目不能为空');
     return ;
     }*/
    if (ExamClassDictID == 'all' && ExamSubClassDictID == 'all') {
        layer.msg('检查类别不能为空');
        return;
    }
    if (new Date(ExamDateTime) > new Date()) {
        layer.msg('检查时间不能大于当前时间');
        return;
    }

    var newExamReport = new AV.Object('ExamReport');
    if (ExamItem) {
        newExamReport.set('ExamItem', ExamItem);
    }
    newExamReport.set('Member', MEMBER);
    if (ExamClassDictID != 'all') {
        newExamReport.set('ExamClass', AV.Object.createWithoutData('ExamClassDict', ExamClassDictID));
    }
    if (ExamSubClassDictID != 'all') {
        newExamReport.set('ExamSubClass', AV.Object.createWithoutData('ExamSubclassDict', ExamSubClassDictID));
    }
    if (ExamDateTime) {
        newExamReport.set('ExamDateTime', new Date(ExamDateTime));
    }
    var relation = newExamReport.relation("Disease");
    for (var i = 0; i < DiseaseArray.length; i++) {
        relation.add(AV.Object.createWithoutData('Disease', DiseaseArray[i]));
    }
    if (ExamFinding) {
        newExamReport.set('ExamFinding', ExamFinding);
    }
    if (Impression) {
        newExamReport.set('Impression', Impression);
    }
    if (Recommendation) {
        newExamReport.set('Recommendation', Recommendation);
    }
    if (Memo) {
        newExamReport.set('Memo', Memo);
    }

    newExamReport.set('IsAbnormal', parseInt(IsAbnormal));
    newExamReport.save().then(function (Exam) {
        saveReportPublic(1, Exam);
    })
}
/*
 检验报告保存
 */
function saveClinic() {
    var SpecimenDictID = $("#SpecimenDict option:selected").val();
    if (SpecimenDictID == 'all') {
        layer.msg('检验标本不能为空');
        return;
    }

    /*var ExamSubClassDictID = $("#ExamSubClassDict option:selected").val();*/
    var LabDateTime = $("#LabDateTime").val();
    var CauseArray = [];
    $("#Cause input[type=checkbox]").each(function () {
        if (this.checked) {
            CauseArray.push($(this).val());
        }
    })
    if (CauseArray.length == 0) {
        layer.msg('检验目的至少选择一项');
        return;
    }

    if (new Date(LabDateTime) > new Date()) {
        layer.msg('检验时间不能大于当前时间');
        return;
    }
    var DiseaseArray = [];
    $(".Lab-disease-ul li").each(function () {
        var id = $(this).attr('data');
        DiseaseArray.push(id);
    });
    var itemArray = [];
    var nullCount = 0;//空input的数量
    var num = 0;//总的检验项目数量
    $("#Item .hasItem").each(function () {
        num += 1;
        var objID = $(this).attr('cid');
        var Result = $(this).find('.result').val();
        var unit = $(this).find('.lab-unit').html();
        var AbnormalIndicator = $(this).find('input[type=radio]:checked').val();
        var Describe = $(this).find('.Describe').html();
        if (Result == '') {
            nullCount += 1;
        } else {
            itemArray.push({
                objID: objID,
                Result: Result,
                Unit: unit,
                AbnormalIndicator: AbnormalIndicator,
                Describe: Describe,
            });
        }
    });
    if (num == nullCount) {
        layer.msg('检验详细中标本数据不能为空');
        return;
    } else if (nullCount) {
        layer.confirm('检验详细中有' + nullCount + "项结果值为空,是否继续提交?", {
            btn: ['确定', '取消'] //按钮
        }, function () {
            _save();
        }, function () {
        });
    } else {
        _save();
    }
    function _save() {
        var ResultObjects = [];
        for (j in itemArray) {
            var obj = itemArray[j];
            var newResult = new AV.Object('LabItemResult');
            newResult.set('ClinicItem', AV.Object.createWithoutData('ClinicItemDict', obj.objID));
            newResult.set('Result', parseFloat(obj.Result));
            newResult.set('AbnormalIndicator', parseInt(obj.AbnormalIndicator));
            if (obj.Describe) {
                newResult.set('Describe', obj.Describe);
            }
            if (obj.Unit) {
                newResult.set('MeasuresName', obj.Unit);
            }
            if (LabDateTime) {
                newResult.set('LabDateTime', new Date(LabDateTime));
            }
            newResult.set('Member', MEMBER);
            ResultObjects.push(newResult);
        }
        AV.Object.saveAll(ResultObjects).then(function () {
            var newLabReport = new AV.Object('LabReport');
            newLabReport.set('Member', MEMBER);
            var relation = newLabReport.relation('Disease');
            for (i in DiseaseArray) {
                relation.add(new AV.Object.createWithoutData('Disease', DiseaseArray[i]));
            }
            newLabReport.set('Specimen', new AV.Object.createWithoutData('SpecimenDict', SpecimenDictID));
            var relationLabCause = newLabReport.relation('LabCause');
            for (j in CauseArray) {
                relationLabCause.add(new AV.Object.createWithoutData('ClinicCauseDict', CauseArray[j]));
            }
            var relationLabItemResult = newLabReport.relation('ExamItem');
            for (k in ResultObjects) {
                relationLabItemResult.add(ResultObjects[k]);
            }
            if (LabDateTime) {
                newLabReport.set('LabDateTime', new Date(LabDateTime));
            }
            newLabReport.save().then(function (LabReport) {
                saveReportPublic(2, LabReport);
            });
        })
    }
}

/*
 录入报告后绑定到REPORT对象 公共
 type: 0 处方 1 检查 2 检验
 obj :保存的对象
 */

function saveReportPublic(type, obj) {
    REPORT.set('ReportType', parseInt(type));
    var relationPrescription = MEDICALRESULT.relation('Prescription');

    if (type == 0) {
        REPORT.set("Prescription", obj);
        var PType = $("input:radio[name=preType]:checked").val();
        if (PType == '1') {
            REPORT.set("ReportShowName", '处方(西)');
        }
        if (PType == '2') {
            REPORT.set("ReportShowName", '处方(中)');
        }
        var relationPrescription = MEDICALRESULT.relation('Prescription');
        relationPrescription.add(obj);
    } else if (type == 1) {
        REPORT.set("ExamReport", obj);
        var ExamClassText = $("#ExamClassDict option:selected").text();
        var ExamSubClassText = $("#ExamSubClassDict option:selected").text();
        REPORT.set("ReportShowName", "检查报告-" + ExamClassText + "/" + ExamSubClassText);
        var relationExamReport = MEDICALRESULT.relation('ExamReport');
        relationExamReport.add(obj);
    } else {
        REPORT.set("LabReport", obj);
        var SpecimenDictText = $("#SpecimenDict option:selected").text();
        REPORT.set("ReportShowName", "检验报告-" + SpecimenDictText);
        var relationLabReport = MEDICALRESULT.relation('LabReport');
        relationLabReport.add(obj);
    }
    REPORT.set("IsInput", true);
    REPORT.save().then(function (report) {
        MEDICALRESULT.save().then(function (result) {
            if (getUrlParam('from') == 'member') {
                layer.msg('保存成功,正在返回档案详情...', {
                    time: 600
                }, function () {
                    back();
                });
            } else {
                layer.msg('保存成功,正在跳转下一张...', {
                    time: 600
                }, function () {
                    nextRep();//下一张
                });
            }

        }, function (error) {
            console.log(error);
        });
    });
}
/*
 选择报告种类
 */
function reportTypeSelect(th) {
    var value = $(th).val();
    if (value == 0) {
        $(".Prescription-div").show();
        $(".Exam-div").hide();
        $(".Lab-div").hide();
    } else if (value == 1) {
        $(".Prescription-div").hide();
        $(".Exam-div").show();
        $(".Lab-div").hide();
    } else {
        $(".Prescription-div").hide();
        $(".Exam-div").hide();
        $(".Lab-div").show();
    }

}
/*
 药品种类联动
 */
function selectDrugType(th) {
    var value = $(th).val();
    if (value != 'all') {
        var query = new AV.Query('Drug');
        query.equalTo('DrugType', AV.Object.createWithoutData('DrugType', value));
        query.find().then(function (drugs) {
            var html_op = '<option value="all">请选择药品</option>';
            var len = drugs.length;
            for (var i = 0; i < len; i++) {
                var obj = drugs[i];
                var DrugName = obj.get('DrugName');
                html_op += '<option unit="' + obj.get('Unit') + '" value=\"' + obj.id + '\">' + DrugName + '</option>';
            }
            $(th).siblings('.input-drug-name').html(html_op);
            $(th).siblings('.drug-count').html('');
            $(th).siblings(".DosageNAdministration").children('input').val('');
        })
    }
}

/*
 检查类别联动
 */
function selectExamClass(th) {
    var value = $(th).val();
    if (value != 'all') {
        var query = new AV.Query('ExamSubclassDict');
        query.equalTo('ExamClassDict', AV.Object.createWithoutData('ExamClassDict', value));
        query.find().then(function (results) {
            var html_op = '<option value="all">请选择检查子类别</option>';
            var len = results.length;
            for (var i = 0; i < len; i++) {
                var obj = results[i];
                var ClassName = obj.get('ClassName');
                html_op += '<option value=\"' + obj.id + '\">' + ClassName + '</option>';
            }
            $('#ExamSubClassDict').html(html_op);

        })
    }
}
/*
 选择检查标本联动
 */
function selectSpecimenDict(th, dom) {
    var value = $(th).val();
    if (value == 'all') {
        if (dom) {
            $("#" + dom).html('');
        } else {
            $("#Cause").html('');
        }
    }
    $("#Item").html('');
    showCauseBySpecimenID(value, dom);
}
function showCauseBySpecimenID(id, dom) {
    var query = new AV.Query('SpecimenDict');
    query.get(id).then(function (spe) {
        var relation = spe.relation('Cause');
        var query = relation.query();
        query.find().then(function (results) {
            var html = '';
            for (var i = 1; i <= results.length; i++) {
                var obj = results[i];
                if ((i % 4) == 1) {
                    html += "<tr>";
                }
                var obj = results[i - 1];
                var Name = obj.get('CauseName');
                html += '<td><input type="checkbox" value="' + obj.id + '" />' + Name + '</td>';
                if ((i % 4) == 0) {
                    html += "</tr>";
                }
            }
            $("#Cause").html(html);
            BindCauseSelectEvent();
            if (dom) {
                $("#" + dom).html(html);
            }
        })
    })
}
/*
 新增标本 选择标本下来卡过联动显示对应的目的到下拉框
 */
function EjectSelectSpe(th) {
    var value = $(th).val();
    if (value != 'all') {
        var query = new AV.Query('SpecimenDict');
        query.get(value).then(function (spe) {
            var relation = spe.relation('Cause');
            var queryCause = relation.query();
            queryCause.find().then(function (results) {
                var html = '<option value="all">请选择检验目的</option>';
                for (var i = 0; i < results.length; i++) {
                    obj = results[i];
                    var Name = obj.get('CauseName');
                    html += '<option value=\"' + obj.id + '\">' + Name + '</option>';
                }
                $('#ClinicCauseDict').html(html);
            })
        })
    } else {
        $('#ClinicCauseDict').html('<option value="all">请选择检验目的</option>');
    }
}
/*
 选择检验目的查询检验目的下的检验小项目到table
 */

function BindCauseSelectEvent() {
    $("#Cause input[type=checkbox]").click(function () {
        var value = $(this).val();
        if (this.checked) {
            $("." + value).remove();
            getClinicItemByClinicCauseID(value);
        } else {
            $("." + value).hide();
        }
    });
}
function getClinicItemByClinicCauseID(id) {
    var query = new AV.Query('ClinicCauseDict');
    query.get(id).then(function (item) {
        var ItemName = item.get('CauseName');
        var relation = item.relation('Item');
        var html = '<div class="item-div-li ' + item.id + '">'
            + '<div class="Item-name">[' + ItemName + ']</div>'
            + '<table class="table table-hover" style="margin-bottom: 0px">'
            + '<thead>'
            + '<tr>'
            + '<th>检验项目</th>'
            + '<th>结果</th>'
            + '<th>参考区间</th>'
            + '<th>描述</th>'
            + '</tr>'
            + '</thead>'
            + '<tbody class="body">';
        relation.query().find().then(function (causes) {
            if (causes.length == 0) {
                html += '<tr><td colspan="4" class="null-td">无项目</td></tr>'
            }
            for (i in causes) {
                var obj = causes[i];
                var describe = obj.get('Describe') ? obj.get('Describe') : '';
                html += '<tr class="hasItem" cid="' + obj.id + '">'
                    + '<td class="lab-td">' + obj.get('ItemName') + '</td>'
                    + '<td><input class="result" type="text"><span class="lab-unit">' + obj.get('MeasuresName') + '</span></td>'
                    + '<td class="Describe">' + describe + '</td>'
                    + '<td>'
                    + '<input type="radio" value="-1" name="' + id + i + '">低'
                    + '<input type="radio" value="0" name="' + id + i + '" checked>正常'
                    + '<input type="radio" value="1" name="' + id + i + '">高'
                    + '</td>'
                    + '</tr>';
            }
            html += '</tbody>'
                + '</table>'
                + '</div>';
            $("#Item").append(html);
        })
    })
}
/*
 选择药品 设置单位
 */
function selectDrug(th) {
    var unit = $(th).children('option:selected').attr('unit');
    if (unit) {
        $(th).siblings(".unit").html(unit);
    } else {
        $(th).siblings(".unit").html('');
    }
}
/*
 删除药品div
 */
function deleteDrug(th) {
    $(th).parent().remove();
}
//显示下拉框列表
function ShowSelectOption(className, typeName, id, savehtml) {
    var html_op = '', obj;
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $(id).append(html_op);
            if (savehtml) {
                DRUGTYPEHTML = html_op;
            }
        }
    });
}
//显示药品种类下拉框列表
function ShowDrugTypeSelectOption(firstoption, className, typeName, id) {
    var html_op = '<option value="all">' + firstoption + '</option>', obj;
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
 下 一张
 */
function nextRep() {
    var nextID = $(".next-rep").attr('next');
    if (!nextID) {
        layer.msg('已经是最后一张了');
        return;
    }
    window.location.replace('reportInput.html?id=' + nextID);
}

function hideDiv(th) {
    if ($(th).hasClass('show-icon')) { //如果是展开
        var Disease = 0;
        var id = $(th).next().children().attr('id');
        $('#' + id + ' input[type=checkbox]').each(function () {
            if (this.checked) {
                Disease += 1;
            }
        })
        $(th).prev().html('已选择' + Disease + "项");
        $(th).removeClass('show-icon');
        $(th).next().toggle(300);
        $(th).prev().toggle(300);
    } else { //如果是隐藏
        $(th).addClass('show-icon');
        $(th).prev().toggle(300);
        $(th).next().toggle(300);
    }
}

/*
 返回列表
 */
function backToList() {
    window.location.href = "report.html";
}
/*
 * 关闭ask window
 */
function closeEjectDiv() {
    $("#fieldset").removeAttr('disabled');
    $(".eject_div").css("display", "none");
    $(".jy").hide();
}
/*
 * 禁用除弹出窗口的其他div
 *
 *
 */
function jy() {
    var window_width = $(document).width();
    var window_height = $(document).height();
    $(".jy").css("display", "block");
    $(".jy").css("width", window_width);
    $(".jy").css("height", window_height);
    $(".jy").fadeTo("fast", 0.2);
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
    if (r != null) return unescape(r[2]);
    return null;
}
//显示疾病列表
function ShowCheckBoxs(className, typeName, id) {
    //载入疾病checkbox
    var html = '';
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 1; i <= results.length; i++) {
                if ((i % 3) == 1) {
                    html += "<tr>";
                }
                var obj = results[i - 1];
                var Name = obj.get(typeName);
                html += '<td><input type="checkbox" value="' + obj.id + '" />' + Name + '</td>';
                if ((i % 3) == 0) {
                    html += "</tr>";
                }
            }
            $(id).html(html);
        }
    });
}
//显示检验目的列表
function ShowCauseCheckBoxs(className, typeName, id) {
    var html = '';
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 1; i <= results.length; i++) {
                if ((i % 3) == 1) {
                    html += "<tr>";
                }
                var obj = results[i - 1];
                var Name = obj.get(typeName);
                html += '<td><input type="checkbox" value="' + obj.id + '" />' + Name + '</td>';
                if ((i % 3) == 0) {
                    html += "</tr>";
                }
            }
            $("#" + id).html(html);
        }
    });
}
/*
 打开新增药品div
 */
function openAddDrugDiv() {
    ShowDrugTypeSelectOption('请选择药品种类', 'DrugType', 'TypeName', 'DrugType');
    disabledDom();
    $("#drug-div").css({
        'top': '50%',
        'left': '50%',
        'margin-left': '-375px',
        'margin-top': '-180px',
    });
    $("#drug-div").show(300);
}
/*
 打开新增检查类型div
 */
function openAddExamDiv() {
    disabledDom();
    ShowDrugTypeSelectOption('请选择检查类别', 'ExamClassDict', 'ClassName', 'ExamClass');
    $("#Exam-div").css({
        'top': '50%',
        'left': '50%',
        'margin-left': '-250px',
        'margin-top': '-180px',
    });
    $("#Exam-div").show(300);
}
/*
 打开新增标本div
 */
function openAddLabDiv() {
    disabledDom();
    ShowDrugTypeSelectOption('请选择检验标本', 'SpecimenDict', 'SpecimenName', 'SpecimenDict-eje');
    ShowDrugTypeSelectOption('请选择检验标本', 'SpecimenDict', 'SpecimenName', 'SpecimenDict-eje2');
    ShowCauseCheckBoxs('ClinicCauseDict', 'CauseName', 'Lab-cause');
    $("#Lab-div").css({
        'top': '50%',
        'left': '50%',
        'margin-left': '-325px',
        'margin-top': '-200px',
    });
    $("#Lab-div").show(300);
}
/*
 打开合并的档案div
 */
function openMergeDiv() {
    jy(0.9);
    $("#Merge-div").css({
        "z-index":"10000",
        "opacity":"1",
        'top': '50%',
        'left': '50%',
        'margin-left': '-200px',
        'margin-top': '-180px',
    });
    $(".merge-IDtext").html(getUrlParam('id'));
    $("#Merge-div").show(300);

}
function disabledDom() {
    $("#fieldset").attr('disabled', "disabled");
}
/*
 显示第一个选项卡
 */
function ClickOne(th, t) {
    if (t == 'drug') {
        $(".drug-div").show(300);
        $(".drug-type-div").hide(300);
    } else if (t == 'exam') {
        $(".exam-type").show(300);
        $(".exam-sub-type").hide(300);
    } else if (t == 'Lab') {
        $(".Lab-item").show(300);
        $(".Lab-spe").hide(300);
    }
    $(th).addClass("check-active");
    $(th).next().addClass("active2");
    $(th).next().removeClass("check-active");
    $(th).removeClass("active1");
}
/*
 显示第二个选项卡
 */
function ClickTwo(th, t) {
    if (t == 'drug') {
        $(".drug-div").hide(300);
        $(".drug-type-div").show(300);
    } else if (t == 'exam') {
        $(".exam-type").hide(300);
        $(".exam-sub-type").show(300);
    } else if (t == 'Lab') {
        $(".Lab-item").hide(300);
        $(".Lab-spe").show(300);
    }
    $(th).addClass("check-active");
    $(th).prev().addClass("active1");
    $(th).prev().removeClass("check-active");
    $(th).removeClass("active2");
}
/*
 增加药品
 */
function drugAdd() {
    var DrugName = $("#DrugName").val();
    var DrugTypeID = $("#DrugType option:selected").val();
    var Unit = $("#Unit").val();
    if (DrugName == '') {
        layer.msg('药品名称不能为空');
        return;
    }
    if (DrugTypeID == 'all') {
        layer.msg('请选择药品类型');
        return;
    }
    if (Unit == '') {
        layer.msg('请输入药品单位');
        return;
    }
    var query = new AV.Query('Drug');
    query.equalTo('DrugName', DrugName);
    query.equalTo('DrugType', AV.Object.createWithoutData('DrugType', DrugTypeID));
    query.first().then(function (obj) {
        if (obj) {
            layer.msg('添加失败,该药品已存在');
        } else {
            _save();
        }
    })
    function _save() {
        var CADN = $("#CADN").val();
        var DoseDescription = $("#DoseDescription").val();
        var Medicine = $("#Medicine").val();
        var PharmacologicalActions = $("#PharmacologicalActions").val();
        var Purpose = $("#Purpose").val();
        var DosageNAdministration = $("#DosageNAdministration").val();
        var MajorIngredient = $("#MajorIngredient").val();
        var Contraindication = $("#Contraindication").val();
        var AdverseReaction = $("#AdverseReaction").val();
        var newDrug = new AV.Object('Drug');
        newDrug.set('DrugName', DrugName);
        newDrug.set('DrugType', AV.Object.createWithoutData('DrugType', DrugTypeID));
        if (CADN) newDrug.set('CADN', CADN);
        if (DoseDescription) newDrug.set('DoseDescription', DoseDescription);
        if (Medicine) newDrug.set('Medicine', Medicine);
        if (Unit) newDrug.set('Unit', Unit);
        if (PharmacologicalActions) newDrug.set('PharmacologicalActions', PharmacologicalActions);
        if (Purpose) newDrug.set('Purpose', Purpose);
        if (DosageNAdministration) newDrug.set('DosageNAdministration', DosageNAdministration);
        if (MajorIngredient) newDrug.set('MajorIngredient', MajorIngredient);
        if (Contraindication) newDrug.set('Contraindication', Contraindication);
        if (AdverseReaction) newDrug.set('AdverseReaction', AdverseReaction);
        newDrug.save().then(function (type) {
            initDrug();
            layer.msg('添加成功');
            addChangeToHtmlSecondSelect(DrugTypeID, type.id, DrugName, Unit);
        });
    }
}
/*
 药品增加后页面的下拉框加入该内容
 */
function addChangeToHtmlFirstSelect(dom, value, text) {
    $(dom).append('<option value="' + value + '">' + text + '</option>');
}
/*
 药品增加后页面的下拉框加入该内容
 */
function addChangeToHtmlSecondSelect(DrugTypeID, value, text, unit) {
    $("#drug-li-html .input-drug-type").each(function () {
        var t_value = $(this).val()
        if (t_value == DrugTypeID) {
            $(this).next().append('<option unit="' + unit + '" value="' + value + '">' + text + '</option>');
        }
    })
}
/*
 增加药品类型
 */
function drugTypeAdd() {

    var DrugTypeName = $("#DrugTypeName").val();
    if (DrugTypeName == '') {
        layer.msg('类型名称不能为空');
        return;
    }
    var query = new AV.Query('DrugType');
    query.equalTo('TypeName', DrugTypeName);
    query.first().then(function (obj) {
        if (obj) {
            layer.msg('添加失败,该药品类型已存在');
        } else {
            _save();
        }
    })
    function _save() {
        var type = new AV.Object('DrugType');
        type.set('TypeName', DrugTypeName);
        type.save().then(function (type) {
            addChangeToHtmlFirstSelect('.input-drug-type', type.id, DrugTypeName);
            layer.msg('添加成功');
            ShowDrugTypeSelectOption('请选择药品种类', 'DrugType', 'TypeName', 'DrugType');
            $("#DrugTypeName").val('');
        });
    }
}

/*
 init药品输入框
 */
function initDrug() {
    $("#DrugName").val('');
    $("#CADN").val('');
    $("#DrugType").val('all');
    $("#DoseDescription").val('');
    $("#Medicine").val('');
    $("#Unit").val('');
    $("#PharmacologicalActions").val('');
    $("#Purpose").val('');
    $("#DosageNAdministration").val('');
    $("#MajorIngredient").val('');
    $("#Contraindication").val('');
    $("#AdverseReaction").val('');
}
/*
 增加检查子类别
 */
function examSubTypeAdd() {
    var ExamClassID = $("#ExamClass").val();
    var subExamClass = $("#subExamClass").val();
    if (ExamClassID == 'all') {
        layer.msg('请选择检查项目，没有请添加');
        return;
    }
    if (subExamClass == '') {
        layer.msg('检查部位名称不能为空');
        return;
    }
    var query = new AV.Query('ExamSubclassDict');
    query.equalTo('ClassName', subExamClass);
    query.equalTo('ExamClassDict', AV.Object.createWithoutData('ExamClassDict', ExamClassID));
    query.first().then(function (obj) {
        if (obj) {
            layer.msg('添加失败,该检查部位已存在');
        } else {
            _save();
        }
    })
    function _save() {
        var newSubClass = new AV.Object('ExamSubclassDict');
        newSubClass.set('ClassName', subExamClass);
        newSubClass.set('ExamClassDict', AV.Object.createWithoutData('ExamClassDict', ExamClassID));
        newSubClass.save().then(function (subClass) {
            layer.msg('添加成功');
            $("#ExamClass").val('all');
            $("#subExamClass").val('');
            if ($("#ExamClassDict").val() == ExamClassID) {
                $("#ExamSubClassDict").append('<option value="' + subClass.id + '">' + subExamClass + '</option>');
            }
        });
    }
}

/*
 增加检查项目
 */
function examTypeAdd() {
    var examTypeName = $("#examTypeName").val();
    var InputCode = $("#InputCode").val();
    if (examTypeName == '') {
        layer.msg('项目名称不能为空');
        return;
    }
    var query = new AV.Query('ExamClassDict');
    query.equalTo('ClassName', examTypeName);
    query.first().then(function (obj) {
        if (obj) {
            layer.msg('添加失败,该检查项目已存在');
        } else {
            _save();
        }
    })
    function _save() {
        var newExamClassDict = new AV.Object('ExamClassDict');
        if (InputCode) {
            newExamClassDict.set('InputCode', InputCode);
        }
        newExamClassDict.set('ClassName', examTypeName);
        newExamClassDict.save().then(function (subClass) {
            layer.msg('添加成功');
            $("#examType").val('all');
            $("#examTypeName").val('');
            $("#InputCode").val('');
            ShowDrugTypeSelectOption('请选择检查项目', 'ExamClassDict', 'ClassName', 'ExamClass');
            addChangeToHtmlFirstSelect('#ExamClassDict', subClass.id, examTypeName);
        });
    }
}

/*
 显示增加检验类别input框
 */
function showAddLabName() {
    $("#Lab-cause input[type=checkbox]").removeAttr('checked');
    var t = $(".LabName-input").css('display');
    if (t == 'none') {
        $("#SpecimenDict-eje2").val('all');
        $(".LabName-input").show(300);
        $("#AddLabName").html("取消增加");

    } else {
        $(".LabName-input").hide(300);
        $("#AddLabName").html("增加标本");
    }

}
/*
 显示增加检验目的input框
 */
function showAddLabCause() {
    var t = $(".LabCause-input").css('display');
    if (t == 'none') {
        $(".LabCause-input").show(300);
        $("#AddLabCause").html("取消增加");
    } else {
        $(".LabCause-input").hide(300);
        $("#AddLabCause").html("增加目的");
    }
}
/*
 增加检验标本详细html
 */
function AddLabItemHtml() {
    var html = '<div class="my-clearfix">'
        + '项目名称：<input class="ItemName" type="text" placeholder="项目名称如：蛋白质"/>'
        + '计量单位：<input class="MeasuresName" type="text" placeholder="计量单位如：g/L"/>'
        + '参考范围：<input class="Describe" type="text" placeholder="参考范围如：0-99"/>'
        + '<a href="javascript:;"onclick="delLabLi(this)" class="drug-a-del lab-delete-a">删除</a>'
        + ' </div>';
    $("#item-DIV").append(html);
}
/*
 增加检验目的输入tml
 */
function AddCauseHtml() {
    $("#add-cause-div").show(300);
    var html = '<div><input type="text" placeholder="目的名称如：血常规"></div>';
    $("#add-cause-div").prepend(html);
}
/*
 选择检验标本 勾选目的
 */
function selectSpe(th) {
    var value = $(th).val();
    $("#Lab-cause input[type=checkbox]").removeAttr('checked');
    var query = new AV.Query('SpecimenDict');
    query.get(value).then(function (spe) {
        var relation = spe.relation('Cause');
        var queryCause = relation.query();
        queryCause.find().then(function (results) {
            for (var i = 0; i < results.length; i++) {
                var obj = results[i];
                oldCauseArray.push(obj);
                $("#Lab-cause input[value=" + obj.id + "]").prop('checked', 'checked');
            }
        })
    })
}
/*
 增加检验标本
 */
function LabSpeAdd() {
    var speID = $("#SpecimenDict-eje2").val();
    var LabNameDis = $("#LabName").css('display');
    var LabName = $("#LabName").val();
    var causeArray = [];
    $("#Lab-cause input[type=checkbox]").each(function () {
        if (this.checked) {
            causeArray.push($(this).val());
        }
    });
    var otherCause = $("#other-cause").val();
    if (LabNameDis == 'none') {
        if (speID == 'all') {
            layer.msg('请选择检验标本');
            return;
        }
    } else if (LabName == '') {
        layer.msg('请输入检验标本名称');
        return;
    }
    if (otherCause) {
        var newCause = new AV.Object('ClinicCauseDict');
        newCause.set('CauseName', otherCause);
    }
    if (speID != 'all') { //已存在只是编辑
        var query = new AV.Query('SpecimenDict');
        query.get(speID).then(function (spe) {
            var relation = spe.relation('Cause');
            for (i in oldCauseArray) {
                relation.remove(oldCauseArray[i]);
            }
            spe.save().then(function (spe) {
                var rel = spe.relation('Cause');
                for (i in causeArray) {
                    rel.add(AV.Object.createWithoutData('ClinicCauseDict', causeArray[i]));
                }
                if (otherCause) {
                    var query = new AV.Query('ClinicCauseDict');
                    query.equalTo('CauseName', otherCause);
                    query.first().then(function (obj) {
                        if (obj) {
                            layer.msg('添加失败,该检查目的已存在');
                        } else {
                            newCause.save().then(function (cause) {
                                rel.add(cause);
                                saveSpe(spe, false);
                            });
                        }
                    })

                } else {
                    saveSpe(spe, false);
                }
            })
        })
    } else {
        var query = new AV.Query('SpecimenDict');
        query.equalTo('SpecimenName', LabName);
        query.first().then(function (obj) {
            if (obj) {
                layer.msg('添加失败,该检查标本已存在');
            } else {
                _save();
            }
        })
        function _save() {
            var newSpe = new AV.Object('SpecimenDict');
            newSpe.set('SpecimenName', LabName);
            var relation = newSpe.relation('Cause');
            for (i in causeArray) {
                relation.add(AV.Object.createWithoutData('ClinicCauseDict', causeArray[i]));
            }
            if (otherCause) {
                var query = new AV.Query('ClinicCauseDict');
                query.equalTo('CauseName', otherCause);
                query.first().then(function (obj) {
                    if (obj) {
                        layer.msg('添加失败,该检查目的已存在');
                    } else {
                        newCause.save().then(function (cause) {
                            relation.add(cause);
                            saveSpe(newSpe, true);
                        });
                    }
                })
            } else {
                saveSpe(newSpe, true);
            }
        }
    }
}
//save public t==true ;新增 t==false:编辑 name:新增的
//保存成功后 页面上局部刷新
function saveSpe(obj, t) {
    obj.save().then(function (obj) {
        layer.msg('保存成功');
        initLabSpe();
        if (t) {
            addChangeToHtmlFirstSelect('#SpecimenDict', obj.id, obj.get('SpecimenName'));
        } else if ($("#SpecimenDict").val() == obj.id) {//找到所有的目的
            var oldCheckedArray = [];
            $("#Cause input[type=checkbox]").each(function () {
                if (this.checked) {
                    oldCheckedArray.push($(this).val());
                }
            });
            var relation = obj.relation('Cause');
            var query = relation.query();
            query.find().then(function (results) {
                var html = '';
                var newArray = [];
                for (var i = 0; i < results.length; i++) {
                    newArray.push(results[i].id);
                }
                var InArray = [];
                for (j in oldCheckedArray) {
                    if ($.inArray(oldCheckedArray[j], newArray) == -1) {
                        $("." + oldCheckedArray[j]).remove();
                    } else {
                        InArray.push(oldCheckedArray[j]);
                    }
                }
                var html = '';
                for (var i = 1; i <= results.length; i++) {
                    if ((i % 4) == 1) {
                        html += "<tr>";
                    }
                    var obj = results[i - 1];
                    var Name = obj.get('CauseName');
                    if ($.inArray(obj.id, oldCheckedArray) != -1) {
                        html += '<td><input type="checkbox" value="' + obj.id + '" checked="checked"/>' + Name + '</td>';
                    } else {
                        html += '<td><input type="checkbox" value="' + obj.id + '" />' + Name + '</td>';
                    }
                    if ((i % 4) == 0) {
                        html += "</tr>";
                    }
                }
                $("#Cause").html(html);
                BindCauseSelectEvent();
            })
        }
    })
}

function initLabSpe() {
    $("#SpecimenDict-eje2").val('all');
    $("#LabName").val('');
    $("#other-cause").val('');

    ShowDrugTypeSelectOption('请选择检验标本', 'SpecimenDict', 'SpecimenName', 'SpecimenDict-eje');
    ShowDrugTypeSelectOption('请选择检验标本', 'SpecimenDict', 'SpecimenName', 'SpecimenDict-eje2');
}
/*
 删除检验输入div
 */
function delLabLi(th) {
    $(th).parent().remove();
}

/*
 增加检验样本
 */
function LabItemAdd() {
    var SpeID = $("#SpecimenDict-eje").val();
    var ClIid = $("#ClinicCauseDict").val();
    if (SpeID == 'all') {
        layer.msg('请选择检验标本');
        return;
    }
    if (ClIid == 'all') {
        layer.msg('请选择检验目的');
        return;
    }
    var obj = [];
    var flag = true;
    var exist = [];
    $("#item-DIV div").each(function () {
        var ItemName = $(this).children('.ItemName').val();
        var t = $(this).children('.ItemName').attr('isExist');
        if (t == '1') {
            exist.push(ItemName);
        }
        var MeasuresName = $(this).children('.MeasuresName').val();
        var Describe = $(this).children('.Describe').val();
        if (ItemName == '' || MeasuresName == '' || Describe == '') {
            flag = false;
        } else {
            obj.push({
                ItemName: ItemName,
                MeasuresName: MeasuresName,
                Describe: Describe,
            })
        }
    })
    if (exist.length) {
        layer.msg("项目:" + exist.toString() + " 已存在");
        return;
    }
    if (!flag) {
        layer.msg('有项目资料尚未填写完整');
        return;
    }
    if (obj.length == 0) {
        layer.msg('当前没有项目可添加');
        return;
    }
    var objArray = [];
    for (i in obj) {
        var newItem = new AV.Object('ClinicItemDict');
        newItem.set('ItemName', obj[i].ItemName);
        newItem.set('MeasuresName', obj[i].MeasuresName);
        newItem.set('Describe', obj[i].Describe);
        objArray.push(newItem);
    }
    AV.Object.saveAll(objArray).then(function (objs) {
        var myClinicCauseDict = AV.Object.createWithoutData('ClinicCauseDict', ClIid);
        var relation = myClinicCauseDict.relation('Item');
        for (j in objArray) {
            relation.add(objArray[j]);
        }
        myClinicCauseDict.save().then(function () {
            layer.msg('添加成功');
            $("#SpecimenDict-eje").val('all');
            $("#ClinicCauseDict").val('all');
            var html = '<div class="my-clearfix">'
                + '项目名称：<input class="ItemName" type="text" placeholder="项目名称如：蛋白质"/>'
                + '计量单位：<input class="MeasuresName" type="text" placeholder="计量单位如：g/L"/>'
                + '参考范围：<input class="Describe" type="text" placeholder="参考范围如：0-99"/>'
                + '<a href="javascript:;"onclick="delLabLi(this)" class="drug-a-del lab-delete-a">删除</a>'
                + ' </div>';
            $("#item-DIV").html(html);
            //如果页面上正在编辑这个目的 则在项目中添加这一栏
            $("#Cause input[type=checkbox]").each(function () {
                if (this.checked) {
                    if (ClIid == $(this).val()) {
                        var html = '';
                        for (j in objArray) {
                            var obj = objArray[j];
                            html += '<tr class="hasItem" cid="' + obj.id + '">'
                                + '<td class="lab-td">' + obj.get('ItemName') + '</td>'
                                + '<td><input class="result" type="text"><span class="lab-unit">' + obj.get('MeasuresName') + '</span></td>'
                                + '<td>'
                                + '<input type="radio" value="-1" name="' + obj.id + j + '">低'
                                + '<input type="radio" value="0" name="' + obj.id + j + '" checked>正常'
                                + '<input type="radio" value="1" name="' + obj.id + j + '">高'
                                + '</td>'
                                + '<td class="Describe">' + obj.get('Describe') + '</td>'
                                + '</tr>';
                        }
                        $("." + $(this).val()).find('.null-td').remove();
                        $("." + $(this).val()).find('.body').append(html);
                    }
                }
            })
        })
    })
}
/*
 * 返回
 */
function back() {
    window.history.back(-1);
}

/*
 查看是否存在该项目
 */
function IsExist(th) {
    var value = $(th).val();
    if (!value) {
        return;
    }
    var SpeID = $("#SpecimenDict-eje").val();
    var ClIid = $("#ClinicCauseDict").val();
    if (SpeID == 'all') {
        layer.msg('请选择检验标本');
        return;
    }
    if (ClIid == 'all') {
        layer.msg('请选择检验目的');
        return;
    }

    var query = new AV.Query('ClinicCauseDict');
    query.get(ClIid).then(function (obj) {
        var relation = obj.relation('Item');
        var queryA = relation.query();
        queryA.equalTo('ItemName', value);
        queryA.first().then(function (obj) {
            if (obj) {
                layer.msg('检验项目已存在');
                $(th).attr('isExist', 1);
            } else {
                $(th).attr('isExist', 0);
            }
        })
    })
}
var SEARCHINPutDOM;//正在搜索的input对象
/*
 搜索药品
 */
function searchDrug(th) {
    var value = $(th).val();
    if (!value) {
        $(".drug-search").hide(300);
        return;
    }
    SEARCHINPutDOM = th;
    $(SEARCHINPutDOM).next('.flag-success').hide(300);
    var y = $(th).parent().position().top;
    var _y = $(th).height();
    $(".drug-search").css({
        'left': 5 + "px",
        'top': (y + _y + 30) + 'px',
    });
    var query = new AV.Query('Drug');
    query.include('DrugType');
    var t = $("input:radio[name=preType]:checked").val();
    if (t == '1') {//西药
        query.notEqualTo('DrugType', AV.Object.createWithoutData('DrugType', '5864ac6f1b69e6006cf50b91'));
    } else {//中药
        query.equalTo('DrugType', AV.Object.createWithoutData('DrugType', '5864ac6f1b69e6006cf50b91'));
    }
    query.contains('DrugName', value);
    query.find().then(function (results) {
        var html = '';
        for (i in results) {
            var obj = results[i];
            var type = obj.get('DrugType') ? obj.get('DrugType').get('TypeName') : '';
            html += '<li onclick="checkDrugLi(\'' + obj.id + '\',\'' + obj.get('DrugName') + '\',\'' + obj.get('Unit') + '\')">' + obj.get('DrugName') + '<small>' + type + '</small></li>';
        }
        $(".drug-search-input_ul").html(html);
        $(".drug-search").show(300);
    })
}

function bindBtngGroup() {
    $(".pre-btn-group label").click(function () {
        $(this).removeClass('btn-default');
        $(this).addClass('btn-success');
        if ($(this).hasClass('radio1')) {
            $(this).next().addClass('btn-default');
            $(this).next().removeClass('btn-success');
        } else {
            $(this).prev().addClass('btn-default');
            $(this).prev().removeClass('btn-success');
        }
    });
}
function bindSearchInputEvent() {
    $(".drug-name").focus(function () {
        searchDrug(this)
    }).blur(function () {
        $(".drug-search").hide(300);
    });
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
/*
 选择药品
 */
function checkDrugLi(id, name, unit) {
    $(SEARCHINPutDOM).next('.flag-success').show(300);
    $(SEARCHINPutDOM).attr('drugID', id);
    $(SEARCHINPutDOM).siblings('.unit').html(unit);
    $(SEARCHINPutDOM).val(name);
}
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
        html+= '<li class="no-disease">没有找到该疾病?<a class="btn btn-danger" href="javascript:addDisease(' + t + ')">添加并选中</a></li>';
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
    $(d).append('<li data="' + id + '" class="btn btn-default" onclick="removeDisease(this)">' + name + '</li> ')
    $(".input-disease").val('');
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
    if (t == 0) {
        var name = $('.Pre-disease-input').val();
    } else if (t == 1) {
        var name = $('.Exa-disease-input').val();
    } else {
        var name = $('.Lab-disease-input').val();
    }
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
/*
 删除该档案
 */
function deleteReport() {
    layer.confirm('确定删除该档案？', {
        btn: ['确定', '取消'],
    }, function () {
        _del();
    }, function () {

    });
    function _del() {
        var id = getUrlParam('id');
        var todo = AV.Object.createWithoutData('MedicalReport', id);
        todo.destroy().then(function (success) {
            // 删除成功
            layer.msg('删除成功,正在跳转...', {
                time: 600
            }, function () {
                var from = getUrlParam('from');
                if (from == 'member') {
                    window.location.replace('../member/memberMRDetail.html?id=' + getUrlParam('MRDetailID'));
                } else {
                    nextRep();//下一张
                }
            })
        }, function (error) {
            // 删除失败
            layer.msg('删除失败，请检查网络连接...');
        });
    }
}
/**
 * 增加档案输入框
 */
function addMergeList() {
    var html = '<div style="margin-top: 5px">其它档案ID：<input type="text" placeholder="档案ID" style="width: 250px"><a class="merge-a" href="javascript:;" onclick="delteMergeList(this)">删除</a></div>';
    $("#merge-report-list").append(html);
}
/**
 * 删除档案输入框
 */
function delteMergeList(th) {
    $(th).parent().remove();
}
/*
 合并档案
 */
function MergeReport() {

    var ArrayID = [];
    $("#merge-report-list input").each(function () {
        if($(this).val()!='')ArrayID.push($(this).val());
    });
    if(ArrayID.length==0){
        layer.msg('请至少输入一个其它档案ID');
        return;
    }
    var Image = $("#mergeImg")[0];
    if(Image.files.length==0){
        layer.msg('请选择图片');
        return;
    }
    var file = new AV.File(Image.files[0].name, Image.files[0]);
    file.save().then(function (file) {
        var thReport = AV.Object.createWithoutData('MedicalReport',getUrlParam('id'));
        thReport.set('RawFile',file);
        thReport.save().then(function () {
            var count = 0;
            for(k in ArrayID){
                var todo = AV.Object.createWithoutData('MedicalReport', ArrayID[k]);
                todo.destroy().then(function (success) {
                    // 删除成功
                    count+=1;
                    if(count == ArrayID.length ){
                        layer.msg('合并成功',{
                            time:600
                        },function () {
                            window.location.reload();
                        });
                    }
                }, function (error) {
                    // 删除失败
                });
            }
        });
    });
}
