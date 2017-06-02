$(document).ready(
	function() {
		main();
	}
);

function main() {
	var id = geturl();
	var query = new AV.Query('MedicalResult');
	query.include("Doctor");
	query.include("EventType");
	query.include("Hospital");
	query.get(id, {
		success: function(obj) {
			
			//档案输出
			var html='';
			var Reportsq = obj.relation('Reports').query();
			Reportsq.include("ReportType");
			Reportsq.find({
				success: function(results) {
					var len_a = results.length;
					var Report_html = ' ';
					for (var i = 0; i < len_a; i++) {
						var obj = results[i];
						if(obj.get("ReportType")!=null){
							var ReportType = "["+obj.get("ReportType").get("TypeName")+"] ";
						}else{
							var ReportType="["+"待确认？"+"]";
						}
						var ReportUrl = obj.get("RawFile").url();
						
						html+='<li>'
							+'<p class="d-img">'+'<a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >'+'<img src=\"'+ReportUrl+'\"/></a></p>'
							+'<p class="d-text"><a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >'+ReportType+'</a></p>'
							+'</li>';
					}
					$("#d-list").html(html);
				}
			});
			
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
	alert(len);
	var html = '';
	var count = 0;
	for (var i = 0; i < len; i++) {
		(function() {
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
			console.log(22);
			var Reportsq = obj.relation('Reports').query();
			Reportsq.include("ReportType");
			Reportsq.find({
				success: function(results) {
					console.log(111);
					var len_a = results.length;
					var Report_html = ' ';
					for (var i = 0; i < len_a; i++) {
						var obj = results[i];
						var ReportType = obj.get("ReportType").get("TypeName");
						var ReportUrl = obj.get("RawFile").url();
						Report_html += '<a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >' + ReportType + "</span>";
					}
					var html = '<tr>' + '<td>' + DoctorName + '</td>' + '<td>' + eventType + '</td>' + '<td>' + timeToString(MedicalTime) + '</td>' + '<td>' + Hospital + '</td>' + '<td>' + MedicalResult + '</td>' + '<td>' + MedicalAdvice + '</td>' + '<td>' + Statu + '</td>' + '<td>' + Report_html + '</td>'
					count += 1;
					if (len == count) {
						console.log(html);
						$("#table-body").html(html);
					}
				}
			});
		})(i)
	}

}

function SeaReportSea(url, typeName) {
	var html = '<img src="' + url + '"/>'
	$("#reportImg").html(html);
	$("#typeName").html(typeName);
	$("#edit_div").css("display", "block");
}
function close() {
	$("#edit_div").css("display", "none");
}