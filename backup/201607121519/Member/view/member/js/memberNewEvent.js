
var  DOCTOR=null;//保存医生
$(document).ready(
	function() {
		//事件
		ShowEvent('EventType', "EventTypeName", "EventType");
		//医生-医院
		ProImg();
		showMember();
		var user = AV.User.current();
		Query = new AV.Query('Doctor');
		Query.equalTo("Account", user);
		Query.first({
			success: function(doctor) {
				//调用主函数 获取list
				DOCTOR=doctor;
				main(doctor);
				//获取医院
				var Hospital = doctor.relation('Hospitals');
				Hospital.query().find({
					success: function(results) {
						var len = results.length;
						var html_op = '<option value="all">---------请选择---------</option>';
						for (var i = 0; i < len; i++) {
							obj = results[i];
							var Name = obj.get("HospitalName");
							html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
						}
						$("#Hospital").html(html_op);
					}
				});
				//获取诊室
				var ConsultingRoom = doctor.relation('ConsultingRooms');
				ConsultingRoom.query().find({
					success: function(results) {
						var len = results.length;
						var html_op1 = '<option value="all">---------请选择---------</option>';
						for (var i = 0; i < len; i++) {
							obj = results[i];
							var Name = obj.get("RoomName");
							html_op1 += '<option value=\"' + obj.id + '\">' + Name + '</option>';
						}
						$("#ConsultingRoom").html(html_op1);
					}
				})
			}
		});
	}
);
//如果是会员列表过来的 则默认显示会员名称
function showMember() {
	var id = geturl();
	if (id) {
		var query = new AV.Query("Member");
		query.include("Account");
		query.get(id, {
			success: function(member) {
				$("#memberName").html(member.get("MemberName"));
				$("#memberName").attr("data_id", member.id);
			}
		})
	}
}

function ShowEvent(className, typeName, id) {
	//载入产品类型下拉框列表----------------------
	var html_op = '<option value="all">---------请选择---------</option>';
	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			for (var i = 0; i < results.length; i++) {
				obj = results[i];
				var Name = obj.get(typeName);
				html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
			}
			$("#" + id).html(html_op);
		}
	});
}

function selectMember() {
	$(".memberList").css("display", "block");
	$(".NewEvent").css("display", "none");

}

function SelectBack() {
	$(".memberList").css("display", "none");
	$(".NewEvent").css("display", "block");
}

//选择新的会员 改变input框默认值
function SelectBtn() {
	if (!$("#list input[type=radio]:checked").length) {
		alert("请选择一个会员");
		return;
	}
	var m_id = $("#list input[type=radio]:checked").attr("id");
	var m_name = $("#list input[type=radio]:checked").attr("value");
	$("#memberName").html(m_name);
	$("#memberName").attr("data_id", m_id);
	$(".memberList").css("display", "none");
	$(".NewEvent").css("display", "block");
}

/*
 * 会员list  by zhengyinhua
 */
//主函数
function main(doctor) {
	var query = new AV.Query('Member');
	query.equalTo("PersonalDoctor", doctor);
	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.find({
		success: function(results) {
			ShowObject(results, doctor);
		}
	});
}
/*
 * 把query后的结果集输出到table中 
 * 便于公用
 * 
 */
function ShowObject(results, doctor) {
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
								var time_1 = result.get("ConfirmAT");
								if (result.get("Statu") != '31') {
									var time_1_html = '<span style="color:green">' + timeToString(time_1) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
								} else {
									var time_1_html = timeToString(time_1);
								}
							} else {
								var time_1_html = '';
							}
							Eventquery2.first({
								success: function(result) {
									if (result) {
										var time_2 = result.get("ConfirmAT");
										if (result.get("Statu") != '31') {
											var time_2_html = '<span style="color:green">' + timeToString(time_2) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
										} else {
											var time_2_html = timeToString(time_2);
										}
									} else {
										var time_2_html = '';
									}
									Eventquery3.first({
										success: function(result) {
											count += 1;
											if (result) {
												var time_3 = result.get("ConfirmAT");
												if (result.get("Statu") != '31') {
													var time_3_html = '<span style="color:green">' + timeToString(time_3) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
												} else {
													var time_3_html = timeToString(time_3);
												}
											} else {
												var time_3_html = '';
											}
											//输出html时间到了
											html += '<tr>' + '<td>' + '<input type="radio" name="member" id=\"' + menberId + '\" value=\"' + MemberName + '\" />' + '</td>' + '<td><img src="../../images/check.png" width="30px"></td>' + '<td>' + MemberName + '</td>' + '<td><img src=\"../../images/check.png\" width=\"15px\">' + LevelName + '</td>' + '<td>' + timeToString(JoinTime) + '</td>' + '<td>' + DiseaseArray.toString() + '</td>' + '<td>' + city + '</td>' + '<td>' + time_1_html + '</td>' + '<td>' + time_2_html + '</td>' + '<td>' + time_3_html + '</td>' + '<td>' + Satisfaction + '</td>' + '<td>' + Activeness + '</td>';
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

//预约
function NewEvent() {
	subStart(); //设置按钮禁用
	var m_id = $('#memberName').attr("data_id");
	var EventTypeId = $('#EventType option:selected').val();

	var time = $('#time').val();
	var HospitalId = $('#Hospital option:selected').val();
	var ConsultingRoomId = $('#ConsultingRoom option:selected').val();
	var notice = $('#notice').val();
	var Image = $("#Image")[0];

	if (m_id == '') {
		subEnd();
		alert('请选择一个会员');
		return false;
	}
	if (EventType == '' || EventType == "all") {
		subEnd();
		alert('请选择预约事项');
		return false;
	}
	if (time == '') {
		subEnd();
		alert('请选择预约时间');
		return false;
	}
	if (Hospital == '' || Hospital == "all") {
		subEnd();
		alert('请选择医院');
		return false;
	}
	if (ConsultingRoom == '' || ConsultingRoom == "all") {
		subEnd();
		alert('请选择诊室');
		return false;
	}

	var NewMember = new Member();
	NewMember.id = m_id;

	var NewEventType = new EventType();
	NewEventType.id = EventTypeId;

	var NewHospital = new Hospital();
	NewHospital.id = HospitalId;

	var NewConsultingRoom = new ConsultingRoom();
	NewConsultingRoom.id = ConsultingRoomId;

	var H = parseInt(time.substring(11, 13));
	var M = parseInt(time.substring(14, 16));
	var time1 = changeDate(time.substring(0, 10));
	
	time1.setHours(parseInt(H));
	time1.setMinutes(parseInt(M));
	var MyEvent = new EventsCalendar();
	MyEvent.set("Member", NewMember);
	MyEvent.set("EventType", NewEventType);
	MyEvent.set("Doctor", DOCTOR);
	MyEvent.set("Hospital", NewHospital);
	MyEvent.set("FirstAT", time1);
	MyEvent.set("ConsultingRoom", NewConsultingRoom);
	MyEvent.set("Statu", 11);
	MyEvent.set("MemberConfirm", -1);

	if (notice != '') {
		MyEvent.set("Notice", notice);
	}
	if (Image.files.length > 0) { //如果上传图片 则更新图片
		var file = Image.files[0];
		var name = "avatar.jpg";

		var avFile = new AV.File(name, file);
		avFile.save().then(function() {
			var relation = MyEvent.relation("PreRecords");
			var File = new EventFiles();
			File.set("File", avFile);
			File.save(null, {
				success: function(file) {
					relation.add(File);
					MyEvent.save(null, { //保存更新的对象
						success: function(post) {
							// 成功保存之后，执行其他逻辑.
							subEnd(); //按钮设为禁用
							alert('增加成功！');
							history.go(-1);
						},
						error: function(post, error) {
							alert('增加失败，请重试！');
							subEnd(); //按钮设为可用
						}
					});
				}
			});
		}, function(error) {
			alert('图片上传失败！');
			subEnd(); //按钮设为可用
		});
	} else { //如果没有更新图片 则更新其他字段
		MyEvent.save(null, { //保存更新的对象
			success: function(post) {
				// 成功保存之后，执行其他逻辑.
				subEnd(); //按钮设为禁用
				alert('增加成功！');
				history.go(-1);
			},
			error: function(post, error) {
				alert('增加失败，请重试！');
				subEnd(); //按钮设为可用
			}
		});
	}

}