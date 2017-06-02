/**
 * Created by 郑银华 on 2016/12/16.
 */
$(document).ready(function () {
    main();
});
function main() {
    var id = getUrlParam('id');
    var query = new AV.Query("MedicalReport");
    query.include('Prescription');
    query.include('LabReport');
    query.include('ExamReport');
    query.get(id).then(function (report) {
        var url = report.get('RawFile').url();
        var t = report.get('RawFile').name();
        var name = '';
        if (t.indexOf('.jpg') >= 0 || t.indexOf('.JPG') >= 0 || t.indexOf('.png') >= 0 || t.indexOf('.PNG') >= 0 || t.indexOf('.GIF') >= 0 || t.indexOf('.gif') >= 0) {
            name = t.substring(0, t.length - 4);
        }
        $(".jqzoom img").attr("src", url);
        $(".jqzoom img").attr("jqimg", url);
        $(".input-imgName").html(name);
        if (report.get('IsInput')) {
            var type = report.get('ReportType');
            if (type == 0) {
                var p = report.get('Prescription') ? report.get('Prescription').id : '';
                PrescriptionDetailByID(p);
                $(".Prescription-div").show(300);
            } else if (type == 1) {
                var ex = report.get('ExamReport') ? report.get('ExamReport').id : '';
                ExamDetailByID(ex);
                $(".ExamReport-div").show(300);
            } else if (type == 2) {
                var lab = report.get('LabReport') ? report.get('LabReport').id : '';
                LabDetailByID(lab);
                $(".LabReport-div").show(300);
            }
        }else{
            $(".Null-div").show(300);
            $("#Null-turn").html('暂未录入<a href="../Report/reportInput.html?id='+report.id+'&from=member&MRDetailID='+getUrlParam('MRDetailID')+'">点击前往</a>');
        }
    })
}

/*
 显示处方详情到页面
 */
function PrescriptionDetailByID(id) {
    if (id == '') {
        alert('无记录');
        return;
    }
    var query_pre = new AV.Query('Prescription');
    query_pre.include('Member');
    query_pre.include('Doctor');
    query_pre.get(id).then(function (pre) {
        var MemberName = pre.get('Member') ? pre.get('Member').get('MemberName') : '';
        var DoctorName = pre.get('Doctor') ? pre.get('Doctor').get('DoctorName') : '';
        var Price = pre.get('Price') ? pre.get('Price') : '';
        var MedicalTime = pre.get('MedicalTime') ? pre.get('MedicalTime') : '';
        var type = pre.get('PrescriptionType');
        var DiseaseArray = [];
        var DiseaseRelation = pre.relation('Disease');
        DiseaseRelation.query().find({
            success: function (results) {
                for (j in results) {
                    DiseaseArray.push(results[j].get('DiseaseName'));
                }
                $("#p-Disease").html(DiseaseArray.toString());
            }
        });
        if(type==1){
            $("#P-type").html('西药');
        }else if(type==2){
            $("#P-type").html('中药');
        }
        $("#p-doctor").html(DoctorName);
        $("#p-time").html(timeToStringShort(MedicalTime));
        $("#p-price").html(Price);
        var relation = pre.relation('PrescriptionDetail');
        var query = relation.query();
        query.include('Drug');
        query.find().then(function (results) {
            var html = '';
            for (i in results) {
                var obj = results[i];
                var durgName = obj.get('Drug') ? obj.get('Drug').get('DrugName') : "";
                var unit = obj.get('Drug') ? obj.get('Drug').get('Unit') : "";
                var Count = obj.get('Count') ? obj.get('Count') : "";
                var Usage = obj.get('Usage') ? obj.get('Usage') : "";
                var UseupDate = obj.get('UseupDate') ? obj.get('UseupDate') : "";

                html += '<tr>'
                    + '<td>' + durgName + '</td>'
                    + '<td>' + Count + "*" + unit + '</td>'
                    + '<td>' + Usage + '</td>'
                    + '<td>' + timeToStringShort(UseupDate) + '</td>'
                    + '</tr>';
            }
            if (html == '') {
                html = '<tr><td colspan="4" class="null-td">无记录</td></tr>';
            }
            $("#p-body").html(html);
        })
    })
}

/*
 显示检查详情到页面
 */
function ExamDetailByID(id) {
    if (id == '') {
        alert('无记录');
        return;
    }
    var query_exam = new AV.Query('ExamReport');
    query_exam.include('Member');
    query_exam.include('ExamClass');
    query_exam.include('ExamSubClass');
    query_exam.get(id).then(function (exam) {
        var MemberName = exam.get('Member') ? exam.get('Member').get('MemberName') : '';
        var ExamCause = exam.get('ExamCause') ? exam.get('ExamCause') : '';
        var ExamClass = exam.get('ExamClass') ? exam.get('ExamClass').get('ClassName') : '';
        var ExamSubClass = exam.get('ExamSubClass') ? exam.get('ExamSubClass').get('ClassName') : '';
        var ExamDateTime = exam.get('ExamDateTime') ? exam.get('ExamDateTime') : '';
        var ExamItem = exam.get('ExamItem') ? exam.get('ExamItem') : '';
        var Impression = exam.get('Impression') ? exam.get('Impression') : '无';
        var ExamFinding = exam.get('ExamFinding') ? exam.get('ExamFinding') : '无';
        var Recommendation = exam.get('Recommendation') ? exam.get('Recommendation') : '无';
        var Memo = exam.get('Memo') ? exam.get('Memo') : '无';
        var IsAbnormal = exam.get('IsAbnormal') ? exam.get('IsAbnormal') : '';
        $("#e-name").html(MemberName);
        $("#e-ExamCause").html(ExamCause);
        $("#e-ExamDateTime").html(timeToStringShort(ExamDateTime));
        $("#e-ExamItem").html(ExamItem);
        $("#e-ExamType").html(ExamClass + "/" + ExamSubClass);
        $("#e-IsAbnormal").html(IsAbnormal ? '阳性' : '阴性');
        $("#e-Impression").html(Impression);
        $("#e-ExamFinding").html(ExamFinding);
        $("#e-Recommendation").html(Recommendation);
        $("#e-Memo").html(Memo);
        var DiseaseArray = [];
        var DiseaseRelation = exam.relation('Disease');
        DiseaseRelation.query().find({
            success: function (results) {
                for (j in results) {
                    DiseaseArray.push(results[j].get('DiseaseName'));
                }
                $("#e-Disease").html(DiseaseArray.toString());
            }
        });
    })
}

/*
 显示检验详情到页面
 */
function LabDetailByID(id) {
    if (id == '') {
        alert('无记录');
        return;
    }
    var query_Lab = new AV.Query('LabReport');
    query_Lab.include('Member');
    query_Lab.include('Specimen');
    query_Lab.get(id).then(function (Lab) {
        var MemberName = Lab.get('Member') ? Lab.get('Member').get('MemberName') : '';
        var SpecimenName = Lab.get('Specimen') ? Lab.get('Specimen').get('SpecimenName') : '';
        var LabDateTime = Lab.get('LabDateTime') ? Lab.get('LabDateTime') : '';
        $("#l-name").html(MemberName);
        $("#l-Specimen").html(SpecimenName);
        $("#l-LabDateTime").html(timeToStringShort(LabDateTime));

        var DiseaseArray = [];
        var DiseaseRelation = Lab.relation('Disease');
        DiseaseRelation.query().find({
            success: function (results) {
                for (j in results) {
                    DiseaseArray.push(results[j].get('DiseaseName'));
                }
                $("#l-Disease").html(DiseaseArray.toString());
            }
        });
        var CauseArray = [];
        var CauseRelation = Lab.relation('LabCause');
        CauseRelation.query().find({
            success: function (results) {
                console.log(results);
                for (j in results) {
                    CauseArray.push(results[j].get('CauseName'));
                }
                $("#l-Cause").html(CauseArray.toString());
            }
        });
        var ItemRelation = Lab.relation('ExamItem');
        var query = ItemRelation.query();
        query.include('ClinicItem');
        query.find({
            success: function (results) {
                var html = '';
                for (j in results) {
                    var obj = results[j];
                    var ItemName = obj.get('ClinicItem') ? obj.get('ClinicItem').get('ItemName') : "";
                    var Result = obj.get('Result') ? obj.get('Result') : "";
                    var Describe = obj.get('Describe') ? obj.get('Describe') : "";
                    var MeasuresName = obj.get('MeasuresName') ? obj.get('MeasuresName') : "";
                    var AbnormalIndicator = obj.get('AbnormalIndicator');
                    var LabDateTime = obj.get('LabDateTime');
                    var s = '';
                    var trHtml = '';
                    if (AbnormalIndicator == -1) {
                        trHtml = "<tr class='success'>";
                        s = '低';
                    } else if (AbnormalIndicator == 0) {
                        trHtml = "<tr>";
                        s = '正常';
                    } else {
                        trHtml = "<tr class='danger'>";
                        s = '高';
                    }
                    html += trHtml
                        + '<td>' + ItemName + '</td>'
                        + '<td>' + Result + " " + MeasuresName + '</td>'
                        + '<td>' + s + '</td>'
                        + '<td>' + Describe + '</td>'
                        + '<td>' + timeToStringShort(LabDateTime) + '</td>'
                        + '</tr>';
                }
                if (html == '') {
                    html = '<tr><td colspan="5" class="null-td">无记录</td></tr>';
                }
                $("#l-body").html(html);
            }
        });
    })
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