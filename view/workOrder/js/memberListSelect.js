pageStart();
var Disease = AV.Object.extend("Disease");
function pageStart() {
	ShowSelectOption("MemberLevel", "LevelName", "level"); //显示会员等级下拉列表
	ShowSelectOption("Disease", "DiseaseName", "DiseaseSearch"); //显示病情下拉列表
	main();
}

//主函数
function main() {
	var query = new AV.Query('Member');
	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.descending('JoinTime');
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}

//把query后的结果集输出到table中便于公用
function ShowObject(results) {
	var len = results.length;
	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var memberId = obj.id;

			var HeadPortrait = '';
			if(obj.get("HeadPortrait")) {
				HeadPortrait = obj.get("HeadPortrait").url();
			} else {
				HeadPortrait = '../../images/touxiang.jpg';
			}

			var MemberName = '';
			if(obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}
			var LevelName = '';
			var LevelIcon = '';
			if(obj.get("MemberLevel") != null) {
				LevelName = obj.get("MemberLevel").get("LevelName");
				LevelIcon = obj.get("MemberLevel").get("LevelIcon").url();
			}
			var JoinTime = '';
			if(obj.get("JoinTime") != null) {
				JoinTime = obj.get("JoinTime");
			}
			var LevelIconUrl = '';
			if(obj.get("MemberLevel") != null) {
				LevelIconUrl = obj.get("MemberLevel").get("LevelIcon").url();
			}
			var city = '';
			if(obj.get("City") != null) {
				city = obj.get("City").get("CityName");
			}

			var Activeness = '';
			if(obj.get("Activeness") != null) {
				Activeness = obj.get("Activeness");
			}
			var Satisfaction = '';
			if(obj.get("Satisfaction") != null) {
				Satisfaction = obj.get("Satisfaction");
			}
			var DiseaseArray = []; //疾病数组
			var Disease = obj.relation('Disease');
			Disease.query().find({
				success: function(result) {
					for(var j = 0; j < result.length; j++) {
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

					Eventquery1.equalTo("EventType", Event_fuzheng);
					Eventquery2.equalTo("EventType", Event_suifang);
					Eventquery3.equalTo("EventType", Event_xuyao);

					var query = AV.Query.or(Eventquery1, Eventquery2);
					var queryAll = AV.Query.or(query, Eventquery3);

					queryAll.equalTo("Member", obj);
					// 按时间，降序排列
					queryAll.descending('FirstAT');
					queryAll.first({
						success: function(result) {
							if(result) {
								var time_3 = result.get("FirstAT");
								if(result.get("Statu") != '31') {
									var time_3_html = '<span style="color:green">' + timeToString(time_3) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
								} else {
									time_3_html = timeToString(time_3);
								}
							} else {
								time_3_html = '';
							}
							count += 1;

							htmlArray[i] = '<tr>' +
								'<td><input type="radio" name="member" id="' + memberId + '" value="' + MemberName + '" /></td>' +
								'<td><img src="' + HeadPortrait + '" width="30px"></td>' +
								'<td>' + MemberName + '</td>' +
								'<td><img src="' + LevelIcon + '" width="15px">' + LevelName + '</td>' +
								'<td>' + timeToStringShort(JoinTime) + '</td>' +
								'<td>' + DiseaseArray.toString() + '</td>' +
								'<td>' + city + '</td>' +
								'<td>' + time_3_html + '</td>' +
								'<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' +
								'<td>' + getStartlevalDivPersonal(Activeness) + '</td>' +
								'</tr>'

							if(count == len) {
								for(var k = 0; k < len; k++) {
									html += htmlArray[k];
								}
								
								$("#table-body").html(html);
							}
						}
					});
				}
			});
		})(i);
	}
}

//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
	var html_op = '',
		obj;
	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			
			for(var i = 0; i < results.length; i++) {
				obj = results[i];
				var Name = obj.get(typeName);
				html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
			}
			$("#" + id).append(html_op);
		}
	});
}



//搜索函数
function Search() {
	var level = $("#level option:selected").val();
	var rep = $("#DiseaseSearch option:selected").val();
	var score = $("#score option:selected").val();
	var query;

	if(rep != 'all') {
		var myRep = AV.Object.createWithoutData('Disease', rep);
		query = AV.Relation.reverseQuery('Member', 'Disease', myRep);
	} else {
		query = new AV.Query('Member');
	}
	if(level != 'all') {
		var myLe = AV.Object.createWithoutData('MemberLevel', level);
		query.equalTo("MemberLevel", myLe);
	}
	if(score != 'all') {
		query.equalTo("Satisfaction", parseInt(score));
	}
	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.descending('JoinTime');
	query.find({
		success: function(results) {
			if(results.length == 0) {
				layer.msg("没有找到相关结果", {
					time: 1000,
					shift: 6
				});
			}
			ShowObject(results);
		}
	});
}