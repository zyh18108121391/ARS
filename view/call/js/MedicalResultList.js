var doctor;
$(document).ready(
	function() {
		main();
	}
);

//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10;//翻页大小默认为10
var query;

//主函数
function main() {
	var MemberID = geturl();
	var MemQuery = new AV.Query("Member");
	MemQuery.get(MemberID, {
		success: function(obj) {
			//就诊记录输出
			query = new AV.Query('MedicalResult');
			query.equalTo("Member", obj);
			// 按时间，降序排列
  			query.descending('MedicalTime');
			query.include("Doctor");
			query.include("EventType");
			query.include("Hospital");
			showPages(query); //显示页数和总条数 在limit之前使用
			showNowPageResults(query);//显示当前页数据
		}
	});

}



//就诊记录把query后的结果集输出到table中便于公用
function ShowObject(results,t) {
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
				+'<td>' + '<a href=../member/memberMRDetail.html?id=' +Rid+'>详情</a>'+ '</td>'+'</tr>';
			count += 1;
			if (len == count) {
				$("#table-body").html(html);
			}
		})(i)
	}
}