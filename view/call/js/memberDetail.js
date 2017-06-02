var doctor;
$(document).ready(
	function() {
		main();
	}
);
//主函数
function main() {
	var MemberID = geturl();
	var MemQuery = new AV.Query("Member");
	MemQuery.equalTo("PersonalDoctor", doctor);
	MemQuery.include("MemberLevel");
	MemQuery.include("City");
	MemQuery.include("PersonalDoctor");
	MemQuery.include("Account");
	MemQuery.get(MemberID, {
		success: function(obj) {
			var menberId = obj.id;
			var MemberName = '';
			if (obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}
			var LevelName = '';
			if (obj.get("MemberLevel") != null) {
				LevelName = obj.get("MemberLevel").get("LevelName");
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

			//就诊记录输出
			var MedicalResult = new AV.Query('MedicalResult');
			MedicalResult.equalTo("Member", obj);
			// 按时间，降序排列
  			MedicalResult.descending('MedicalTime');
			MedicalResult.include("Doctor");
			MedicalResult.include("EventType");
			MedicalResult.include("Hospital");
			MedicalResult.find({
				success: function(results) {
					//console.log(results.length);
					ShowObject(results);
				}
			});

			var DiseaseArray = []; //疾病数组
			var Disease = obj.relation('Disease');
			Disease.query().find({
				success: function(result) {
					for (var j = 0; j < result.length; j++) {
						DiseaseArray.push(result[j].get('DiseaseName'));
					}
					$("#Name").html(MemberName);
					$("#Leval").html(LevelName + '<img src=\"'+LevelIconUrl+'\" width=\"15px\">');
					$("#JoinTime").html(timeToString(JoinTime));
					$("#Disease").html(DiseaseArray.toString());
					$("#City").html(city);
					$("#Satisfaction").html(Satisfaction);
					$("#Activeness").html(Activeness);

					/*//就诊记录输出
					var MedicalResult = new AV.Query('MedicalResult');
					MedicalResult.equalTo("Member", obj);
					MedicalResult.include("Doctor");
					MedicalResult.include("EventType");
					MedicalResult.include("Hospital");
					MedicalResult.find({
						success: function(results) {
							ShowObject(results);
						}
					});
*/
				}
			});

		}
	});

}

//就诊记录把query后的结果集输出到table中便于公用
function ShowObject(results) {
	var len = results.length;
	var html = '';
	var count = 0;
	for (var i = 0; i < len; i++) {
		(function() {
			
			var obj = results[i];
			var Rid=obj.id;
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

			html += '<tr>' + '<td>' + DoctorName + '</td>' + '<td>' + eventType + '</td>' + '<td>' + timeToString(MedicalTime) + '</td>' + '<td>' + Hospital + '</td>' + '<td class="my_td">' + MedicalResult + '</td>' + '<td class="my_td">' + MedicalAdvice + '</td>' + '<td>' + Statu + '</td>'
				+'<td>' + '<a href=memberMRDetail.html?id=' +Rid+'>详情</a>'+ '</td>'+'</tr>';
			count += 1;
			if (len == count) {
				$("#table-body").html(html);
			}

			//档案输出
			//var Reportsq = obj.relation('Reports').query();
			//Reportsq.include("ReportType");
			//Reportsq.find({
			//	success: function(objs) {
			//		var len_a = objs.length;
			//		var Report_html = ' ';
			//       for (var j = 0; j < len_a; j++) {
			//			var Myobj = objs[j];
			//			if(Myobj.get("ReportType")!=null){
			//				var ReportType = "["+Myobj.get("ReportType").get("TypeName")+"] ";
			//			}else{
			//				var ReportType="["+"待确认？"+"]";
			//			}
			//			var ReportUrl = Myobj.get("RawFile").url();
			//			Report_html += '<a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >' + ReportType + "</span>";
			//		}
			//
			//	}
			//});
		})(i)
	}

}

function SeaReportSea(url, typeName) {
	var html = '<img src="' + url + '"/>';
	$("#reportImg").html(html);
	$("#typeName").html(typeName);
	$("#edit_div").css("display", "block");
}

function close() {
	$("#edit_div").css("display", "none");
}