$(document).ready(
    function () {
        main();
    }
);
var MEMBERID;
function main() {
    var id = geturl();
    var query = new AV.Query('MedicalResult');
    query.include("Doctor");
    query.include("EventType");
    query.include("Hospital");
    query.get(id, {
        success: function (obj) {
            //档案输出
            var html = '';
            var Reportsq = obj.relation('Reports').query();
            Reportsq.include("ReportType");
            Reportsq.find({
                success: function (results) {
                    var len_a = results.length;
                    for (var i = 0; i < len_a; i++) {
                        var obj = results[i];
                        var ReportUrl = obj.get("RawFile").url();
                        var ReportName = obj.get("RawFile").name();
                        html += '<li class="d-list-li col-md-4">'
                            + '<a class="d-list-a" href="reportDetail.html?id=' + obj.id + '&MRDetailID='+id+'">'
                            + '<p class="d-img relative">'
                            + '<img src=\"' + ReportUrl + '"/>'
                            +'<span class="text-center a-span d-text">' + ReportName + '</span>'
                            + '</p></a></li>';
                    }
                    $("#d-list").html(html);
                }
            });
            MEMBERID = obj.get("Member").id;
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
            var ChiefComplaint = '';
            if (obj.get("ChiefComplaint") != null) {
                ChiefComplaint = obj.get("ChiefComplaint");
            }
            var HPC = '';
            if (obj.get("HPC") != null) {
                HPC = obj.get("HPC");
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
            $("#DoctorName").html(DoctorName);
            $("#eventType").html(eventType);
            $("#MedicalTime").html(timeToString(MedicalTime));
            $("#Hospital").html(Hospital);
            $("#ChiefComplaint").html(ChiefComplaint);
            $("#HPC").html(HPC);
            $("#MedicalResult").html(MedicalResult);
            $("#MedicalAdvice").html(MedicalAdvice);
            $("#Statu").html(Statu);

        }
    });

}

/* 就诊记录
 * 把query后的结果集输出到table中 
 * 便于公用
 * 
 */
function ShowObject(results) {
    var len = results.length;
    var html = '';
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function () {
            var obj = results[i];
            var DoctorName = '';
            if (obj.get("Doctor") != null) {
                DoctorName = obj.get("Doctor").get("DoctorName");
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
            }

            var ChiefComplaint = '';
            if (obj.get("ChiefComplaint") != null) {
                ChiefComplaint = obj.get("ChiefComplaint");
            }
            var HPC = '';
            if (obj.get("HPC") != null) {
                HPC = obj.get("HPC");
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
                    Statu = "带会员上传"
                } else {
                    Statu = "已完成";
                }
            }
            //档案输出
            var Reportsq = obj.relation('Reports').query();
            Reportsq.include("ReportType");
            Reportsq.find({
                success: function (results) {
                    var len_a = results.length;
                    var Report_html = ' ';
                    for (var i = 0; i < len_a; i++) {
                        var obj = results[i];
                        var ReportType = obj.get("ReportType").get("TypeName");
                        var ReportUrl = obj.get("RawFile").url();
                        Report_html += '<a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >' + ReportType + "</span>";
                    }
                    var html = '<tr>' + '<td>' + DoctorName + '</td>' + '<td>' + eventType + '</td>' + '<td>' + timeToString(MedicalTime) + '</td>' + '<td>' + Hospital + '</td>' + '<td>' + ChiefComplaint + '</td>' + '<td>' + HPC + '</td>' + '<td>' + MedicalResult + '</td>' + '<td>' + MedicalAdvice + '</td>' + '<td>' + Statu + '</td>' + '<td>' + Report_html + '</td>'
                    count += 1;
                    if (len == count) {
                       $("#table-body").html(html);
                    }
                }
            });
        })(i)
    }

}
function back() {
    history.go(-1);
}

function backToMemberDetail() {
    window.location.href="memberDetail.html?id="+MEMBERID;
}