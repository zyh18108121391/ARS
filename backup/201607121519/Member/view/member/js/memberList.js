/*
 * 会员js  by zhengyinhua
 * 
 */
var doctor;
$(document).ready(
	function() {
		user = AV.User.current();
		if (user) {
			var user = AV.User.current();
			Query = new AV.Query('Doctor');
			Query.equalTo("Account", user);
			Query.first({
				success: function(doc) {
					doctor = doc;
					main();
				}
			});
		} else {
			/*AV.User.logIn("13880461141", "123456", {
				success: function(user) {
					console.log("登录成功");
					var user = AV.User.current();
					Query = new AV.Query('Doctor');
					Query.equalTo("Account", user);
					Query.first({
						success: function(doc) {
							doctor = doc;
							main();
						}
					});
				},
				error: function(user, error) {
					if (error.message == "The username and password mismatch.") {
						alert("登录失败！密码不正确。");
						$("#password").focus();
					}
				}
			});*/
		}
	}
);
//主函数
function main() {
	var query = new AV.Query('Member');
	query.equalTo("PersonalDoctor", doctor);
	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}
/*
 * 把query后的结果集输出到table中 
 * 便于公用
 * 
 */
function ShowObject(results) {
	var len = results.length;
	
	var html = '';
	var count = 0;
	for (var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
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
			var LevelName = '';
			if (obj.get("MemberLevel") != null) {
				LevelName = obj.get("MemberLevel").get("LevelName");
			}
			var Activeness = '';
			if (obj.get("Activeness") != null) {
				Activeness = obj.get("Activeness");
			}
			var Satisfaction = '';
			if (obj.get("Satisfaction") != null) {
				Satisfaction = obj.get("Satisfaction");
			}
			var DiseaseArray = []; //疾病数组

			var Disease = obj.relation('Disease');
			Disease.query().find({
				success: function(result) {
					for (var j = 0; j < result.length; j++) {
						DiseaseArray.push(result[j].get('DiseaseName'));
					}

					//最后一次复诊记录查询
					var Eventquery1 = new AV.Query('EventsCalendar');
					var Eventquery2 = new AV.Query('EventsCalendar');
					var Eventquery3 = new AV.Query('EventsCalendar');
					var EventType = AV.Object.extend("EventType");
					var Event_fuzheng = new EventType();
					var Event_suifang = new EventType();
					var Event_xuyao = new EventType();
					Event_fuzheng.id = "576bd5ce1532bc005faf4133";
					Event_suifang.id = "576bd5f7165abd00545d487e";
					Event_xuyao.id = "576bd5ed128fe1005a14e654";

					//Eventquery1.equalTo("eventType", Event_fuzheng);
					//Eventquery1.equalTo("doctor", doctor);
					//Eventquery1.equalTo("Member", obj);

					Eventquery2.equalTo("eventType", Event_suifang);
					Eventquery2.equalTo("doctor", doctor);
					Eventquery2.equalTo("Member", obj);

					Eventquery3.equalTo("eventType", Event_xuyao);
					Eventquery3.equalTo("doctor", doctor);
					Eventquery3.equalTo("Member", obj);
					// 按时间，降序排列
					Eventquery1.descending('finalAT');
					Eventquery2.descending('finalAT');
					Eventquery3.descending('finalAT');
					Eventquery1.first({
						success: function(result) {
							if (result) {
								var time_1 = result.get("FirstAT");
								if (result.get("Statu") != '31') {
									var time_1_html = '<span style="color:green">' + timeToString(time_1) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
								} else {
									var time_1_html = timeToString(time_1);
								}
							}else{
								var time_1_html = '';
							}
							Eventquery2.first({
								success: function(result) {
									if (result) {
										var time_2 = result.get("FirstAT");
										if (result.get("Statu") != '31') {
											var time_2_html = '<span style="color:green">' + timeToString(time_2) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
										} else {
											var time_2_html = timeToString(time_2);
										}
									}else{
										var time_2_html = '';
									}
									Eventquery3.first({
										success: function(result) {
											count += 1;
											if (result) {
												var time_3 = result.get("FirstAT");
												if (result.get("Statu") != '31') {
													var time_3_html = '<span style="color:green">' + timeToString(time_3) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
												} else {
													var time_3_html = timeToString(time_3);
												}
											}else{
												var time_3_html = '';
											}
											//输出html时间到了
											
											html += '<tr>' + '<td><img src="../../images/touxiang.jpg" width="30px"></td>' + '<td>' + MemberName + '</td>' + '<td><img src=\"../../images/level.png\" width=\"15px\">'+ LevelName + '</td>'
												+ '<td>' + timeToStringShort(JoinTime) + '</td>'
												+ '<td>' + DiseaseArray.toString() + '</td>'
												+ '<td>' + city + '</td>'
												+'<td>' +time_1_html+ '</td>'
												+'<td>' +time_2_html+ '</td>'
												+'<td>' +time_3_html+ '</td>'
												+ '<td>' + Satisfaction + '</td>' + '<td>' + Activeness + '</td>'
												+ '<td><a href="member_Detail.html?id=' + menberId + '\">详情</a>|<a href="member_NewEvent.html?id=' + menberId + '\">预约</a>|<a href=\"member_PushMsg.html?id=' + menberId + '\">医嘱</a>|<a href="../scheduleControl/schedules.html?id='+menberId+'\">历史日程</a></td>' + '</tr>';
											if (count == len) {
												$("#table-body").html(html);
											}
										}
									});
								}
							});
						}
					});
				}
			});
		})(i);
	}
}