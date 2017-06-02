$(document).ready(
	function() {
		user = AV.User.current();
		if (user) {
			var user = AV.User.current();
			Query = new AV.Query('Doctor');
			Query.equalTo("Account", user);
			Query.first({
				success: function(doc) {
					main(doc);
				}
			});
		}
	}
);

function main(doctor) {
	var query = new AV.Query('Counsel');
	query.equalTo("Statu",999);
	query.include('Member');
	query.include('Doctor');
	query.include('CounselType');
	query.descending("createdAt");
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}
/*
 * 把query后的结果集输出到table中 
 * 便于公用
 */
function ShowObject(results) {
	var len = results.length;
	var html = '';
	var count = 0;
	for (var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var Id = obj.id;
			var MemberName = '';
			if (obj.get("Member") != null) {
				MemberName = obj.get("Member").get("MemberName");
			}
			var TypeName = '';
			if (obj.get("CounselType") != null) {
				TypeName = obj.get("CounselType").get("TypeName");
			}
			var CounselContent = '';
			if (obj.get("CounselContent") != null) {
				CounselContent = obj.get("CounselContent");
			}
			var CounselContent = '';
			if (obj.get("CounselContent") != null) {
				CounselContent = obj.get("CounselContent");
			}

			//咨询建立的时间
			var CreatedTime = obj.createdAt;
			var Posts = obj.relation('Posts');
			var P_query = Posts.query();
			P_query.descending("createdAt");
			P_query.first({
				success: function(res) {
					var content = '暂无回复';
					if (res) {
						if (res.get("MemberPost") == null) {
							content = res.get("DoctorPost");
						} else {
							content = res.get("MemberPost");
						}
					}
					count += 1;
					html +="<tr>" +'<td>' + MemberName + '</td>' + '<td>' + TypeName + '</td>' + '<td>' + CounselContent + '</td>' + '<td>' + content + '</td>' + '<td>' + chageTime(CreatedTime) + '</td>' + '<td><a href=\"advisoryDetail.html?id=' + Id + '\">详情</a></td>'+'</tr>';
					if (count == len) {
						$("#table-body").html(html);
					}
				}
			});
		})(i);
	}
}