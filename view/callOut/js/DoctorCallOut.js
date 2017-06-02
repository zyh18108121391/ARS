$(document).ready(function() {
	createNew();
	var tel = getUrlParam("telNo");
	var id = getUrlParam('id');
	searchStatu(getUrlParam('AgentID'));//查询状态 如果不在通话中 则显示关闭按钮
	RecentlyCallRecord(tel); //根据电话号码筛选通话记录
	showTimeToSelect(id); //查询当前会员的医生的时间安排到新建预约下拉列表
	showDoctor();
	bindEvent();
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(Agent) {
				AgentID = Agent.get('AgentID');
			}
		});
	}
});


/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	if(data.agentid != getUrlParam("AgentID")) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	if(data.callid==getUrlParam('callid')&&data.connect){ //外呼 用户接通电话
		$(".calloutHpBtn").show();
	}
	var statu = data.agentstate;
	if(data.callid==getUrlParam('callid')&&statu=='0'){//通话结束
		$(".calloutHpBtn").show();
		$(".calloutHpBtn").attr("value","关闭页面");
		$(".calloutHpBtn").css('background-color',"#c9302c");
		$(".calloutHpBtn").css('border-color',"#ac2925");
		$(".calloutHpBtn").attr('onclick','backToCallOut()');
		var query = new AV.Query('AgentConversationRecord');
		query.equalTo('CalIID',getUrlParam('callid'));
		query.first().then(function(obj){
			SetRecordMemo(obj.id,'norush');
		});
	}
}
/*
 * 
 * 绑定事件集合
 * 
 */
function bindEvent() {
	//moveDivEvent();//div拖动
	//操作按钮
	$('#tbody-list').on('click', '.statuFuncs', function() {
		var id = $(this).attr('data-objId');
		var btnname = $(this).attr('data-btnname');
		switch(btnname) {
			case 'newEditTime': //修改预约时间
				openEditTimeDiv(id, 'newEditTime');
				break;
			case 'newConfirm': //会员发起  确认预约
				confirmTime(id);
				break;
			case 'oldEditTime': //重新协调后 会员没确认前修改时间
				openEditTimeDiv(id, 'oldEditTime');
				break;
			case 'coordinate': //重新协调
				openEditTimeDiv(id, 'coordinate');
				break;
			case 'oldConfirm': //会员重新协调  请确认
				confirmTime(id);
				break;
			default:
				break;
		}
	});
	//取消日程
	$('#tbody-list').on('click', '.cancelBtn', function() {
		var id = $(this).attr('data-objId');
		layer.prompt({
			formType: 2,
			title: '请输入取消原因'
		}, function(value, index, elem) {
			var updateEventsCalendar = AV.Object.createWithoutData('EventsCalendar', id);
			updateEventsCalendar.set('DoctorRefuseReason', value);
			updateEventsCalendar.set('Statu', -999);
			updateEventsCalendar.save().then(function(event) {
				AVCloudSaveOperRec(event.id, '会员取消日程', '取消日程成功');
			}, function() {
				layer.msg('取消日程出错', {
					shift: 6,
					time: 600
				}, function() {
					window.location.reload();
				});
			});
			layer.close(index);
		});
	});
}
/*
 * 
 * 根据医生查看医生的安排时间列表
 * @id：医生对象id
 */
function showTimeToSelect(id) {
	//获取可预约时间
	AV.Cloud.run('GetClinicCalendar', {
		id: id
	}, function(results) {
		resultArray = results;
		getCanOrderTimeHtml(results);
	});
}

//添加可预约时间
function getCanOrderTimeHtml(results) {
	var htmlTimes = '';
	for(var i = 0; i < results.length; i++) {
		htmlTimes += '<option value="' + i + '">' + results[i].TimeDescribe + results[i].EventType + '</option>';
	}
	$('#canOrderTime2').html(htmlTimes);
}
/*
 *确认日程 
 */
function confirmTime(id) {
	//询问框
	layer.confirm('确认日程时间？', {
		btn: ['确认', '取消'] //按钮
	}, function() {
		var query = new AV.Query('EventsCalendar');
		query.get(id).then(function(updateEventsCalendar) {
			updateEventsCalendar.set('DoctorConfirm', 1);
			updateEventsCalendar.set('Statu', 11);
			updateEventsCalendar.save().then(function(event) {
				AVCloudSaveOperRec(event.id, '医生确认日程', '确认日程成功');
			});
		});
	});
}
/*
 * 显示医生基本信息
 */
function showDoctor() {
	var id = getUrlParam('id');
	var query = new AV.Query('Doctor');
	query.include('MainHospital');
	query.get(id).then(function(obj) {
		recentlyCalender(obj);//最近日程
		var DoctorName = '';
		
		if(obj.get("DoctorName") != null) {
			DoctorName = obj.get("DoctorName");
		}
		var MobilePhoneNo = '';
		if(obj.get("MobilePhoneNo") != null) {
			MobilePhoneNo = obj.get("MobilePhoneNo");
		}
		var ProfessionalTitle = '';
		if(obj.get("ProfessionalTitle") != null) {
			ProfessionalTitle = obj.get("ProfessionalTitle");
		}
		var MainHospital = '';
		if(obj.get("MainHospital") != null) {
			MainHospital = obj.get("MainHospital").get('HospitalName');
		}
		$("#Name").html(DoctorName+"["+ProfessionalTitle+"]");
		$("#tellNo").html(MobilePhoneNo);
		$("#MainHospital").html(MainHospital);
		var relationHos = obj.relation('Hospitals');
		var relationCon = obj.relation('ConsultingRooms');
		var relationAcc = obj.relation('AcceptedEventType');
		var Hospitals=[];
		var ConsultingRooms=[];
		var AcceptedEventType=[];
		relationHos.query().find({
			success: function(result) {
				for(var j = 0; j < result.length; j++) {
					Hospitals.push(result[j].get('HospitalName'));
				}
				$("#Hospitals").html(Hospitals.toString());
			}
		});
		relationCon.query().find({
			success: function(result) {
				for(var k = 0; k < result.length; k++) {
					ConsultingRooms.push(result[k].get('RoomName'));
				}
				$("#ConsultingRooms").html(ConsultingRooms.toString());
			}
		});
		relationAcc.query().find({
			success: function(result) {
				for(var l = 0; l < result.length; l++) {
					AcceptedEventType.push(result[l].get('EventTypeName'));
				}
				$("#AcceptedEventType").html(AcceptedEventType.toString());
			}
		});
	});
}

/*
 * 显示近期日程
 * 
 */
function recentlyCalender(doctor) {
	var query = new AV.Query('EventsCalendar');
	query.equalTo('Doctor', doctor);
	query.notEqualTo('Statu', -999); //取消了的日程不显示
	query.include('EventType');
	query.include('Member');
	query.include('Hospital');
	query.include('ConsultingRoom');
	query.include('MedicalResult');
	query.greaterThan('ConfirmAT', new Date());
	query.descending('createdAt');
	query.find({
		success: function(results) {
			ShowObjectCalendar(results);
		}
	});
}

//把query后的结果集输出到table中便于公用
function ShowObjectCalendar(results) {
	var len = results.length;
	var html = '';
	for(var i = 0; i < len; i++) {
		var obj = results[i];
		var Id = obj.id;
		var EventType = obj.get('EventType') ? obj.get('EventType').get('EventTypeName') : '无';
		var MemberName = obj.get('Member') ? obj.get('Member').get('MemberName') : '无';
		var ConfirmAT = obj.get('ConfirmAT');
		var Hospital = obj.get('Hospital') ? obj.get('Hospital').get('HospitalName') : '无';
		var ConsultingRoom = obj.get('ConsultingRoom') ? obj.get('ConsultingRoom').get('RoomName') : '无';
		var MedicalResult = obj.get('MedicalResult') ? obj.get('MedicalResult').get('MedicalResult') : '无';
		var Statu = obj.get('Statu');
		var DoctorConfirm = obj.get('DoctorConfirm');
		var MemberConfirm = obj.get('MemberConfirm');
		var RatingByMember = "未评分"
		var canstr = '';
		html += '<tr>' +
			'<td>' + EventType + '</td>' +
			'<td>' + MemberName + '</td>' +
			'<td>' + timeToString(ConfirmAT) + '</td>' +
			'<td>' + Hospital + '</td>' +
			'<td>' + ConsultingRoom + '</td>' +
			'<td>' + MedicalResult + '</td>' +
			'<td>' + getStatus(Statu, DoctorConfirm, MemberConfirm) + '</td>' +
			'<td>' + RatingByMember + '</td>';
		html += '<td>';
		if(Statu == -969 || Statu == 1 || Statu == 11) {
			html += '<button class="btn btn-primary statuFuncs" data-btnName="' + getStatus(Statu, DoctorConfirm, MemberConfirm, 'dobtnName') + '" data-objId="' + Id + '" >' + getStatus(Statu, DoctorConfirm, MemberConfirm, 'dobtnString') + '</button>';
		}
		if(Statu != 31) {
			html += '<button class="btn btn-danger cancelBtn" data-objId="' + Id + '" >取消日程</button>';
		}
		html += '</td></tr>';
	}
	if(html != '') $("#tbody-list").html(html);

}
//状态  医生端
function getStatus(status, DoctorConfirm, MemberConfirm, tep) {
	var statusString = "";
	var dobtnString = ''; //状态对应的操作按钮名称
	var dobtnName = ''; //状态对应的标识
	if(status == 1 || status == -969) {
		if(status == 1) { //新建状态 判断会员和医生确认状态
			if(DoctorConfirm == -1) {
				statusString = "请确认日程";
				dobtnName = "newConfirm";
				dobtnString = "确认日程";
			}
			if(MemberConfirm == -1) {
				statusString = "待会员确认";
				dobtnName = "newEditTime";
				dobtnString = "更改时间";
			}
		} else {
			if(DoctorConfirm == -969) {
				statusString = "日程已变更，请确认";
				dobtnName = "oldConfirm";
				dobtnString = "确认日程";
			}
			if(MemberConfirm == -969) {
				statusString = "待会员确认";
				dobtnName = "oldEditTime";
				dobtnString = "更改时间";
			}
		}
	} else {
		switch(status) {
			case -999:
				statusString = "已取消";
				break;
			case -989:
				statusString = "会员未履约";
				break;
			case -979:
				statusString = "医生未履约";
				break;
			case 11:
				statusString = "已确认";
				dobtnName = "coordinate";
				dobtnString = "重新协调";
				break;
			case 21:
				statusString = "已提醒";
				break;
			case 31:
				statusString = "已完成";
				break;
			default:
				statusString = "未知状态";
				break;
		}
	}
	if(tep) {
		if(tep == 'dobtnString') return dobtnString;
		if(tep == 'dobtnName') return dobtnName;
	} else {
		return statusString;
	}
}
/*
 * 显示5条最近历史通话记录
 * 
 */

function RecentlyCallRecord(telNo) {
	var query = new AV.Query('AgentConversationRecord');
	query.equalTo('ToTelNo', telNo);
	query.descending('createdAt');
	query.include('Agent');
	query.limit(5);
	query.find({
		success: function(results) {
			var len = results.length;
			var html = '';
			for(var i = 0; i < len; i++) {
				var obj = results[i];
				var AgentName = obj.get('Agent') ? obj.get('Agent').get('AgentName') : '';
				var Duration = obj.get('Duration') ? obj.get('Duration') : '0';
				var RecordFile = '';
				var RecordFileURL = '';
				if(obj.get("RecordFile") != null) {
					RecordFileURL = obj.get("RecordFile").url();
					RecordFile = '点击播放';
				}
				var Memo = obj.get('Memo') ? obj.get('Memo') : '';
				var Satisfaction = '';
				if(obj.get("Satisfaction") != null) {
					Satisfaction = obj.get("Satisfaction");
				}
				var time = obj.createdAt;
				html += '<tr>' +
					'<td>' + AgentName + '</td>' +
					'<td>' + alertingTimeChange(Duration) + '</td>' +
					'<td>' + '<span class="auto-text" data="' + RecordFileURL + '" onclick="play(this)">' + RecordFile + '</span>' + '</td>' +
					'<td>' + Memo + '</td>' +
					'<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' +
					'<td>' + timeToString(time) + '</td>' +
					'</tr>';

			}
			if(html != '') $("#CallRecordList").html(html);
		}
	});
}
/*
 * 弹出修改时间div
 */
function openEditTimeDiv(id, btnname) {
	jy(0.8);
	$(".refuse-div").css("display", "block");
	$("#refuse-btn").attr("onclick", "refuse(\'" + id + '\',\'' + btnname + "\')");
	if(btnname == 'newEditTime' || btnname == 'oldEditTime') {
		$(".refuse-div .title").html('修改预约时间');
		$("#refuse-name").html('修改日期');
	} else {
		$(".refuse-div .title").html('重新协调');
		$("#refuse-name").html('协调日期');
	}
}

/*
 * 重新协调
 * 
 */
function refuse(id, btnname) {
	subStart();
	var selectedValue = $("#canOrderTime2 option:selected").val();
	var time = new Date(resultArray[selectedValue].Time);
	var EventTypeId = resultArray[selectedValue].EventTypeId;
	var query = new AV.Query('EventsCalendar');
	var memo = '';
	var notice='';
	query.get(id).then(function(updateEventsCalendar) {
		var oldConfirmAt = timeToString(updateEventsCalendar.get('ConfirmAT'));
		var TypeId = updateEventsCalendar.get('EventType').id;
		updateEventsCalendar.set("ConfirmAT", time);
		if(btnname == 'newEditTime') {
			memo = '医生修改预约时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
			notice = '修改成功';
		}
		if(btnname == 'oldEditTime') {
			memo = '医生修改重新协调时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
			notice = '修改成功';
		}
		if(btnname == 'coordinate') {
			memo = '医生希望重新协调时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
			notice = '重新协调成功';
			updateEventsCalendar.set('Statu', -969);
			updateEventsCalendar.set('DoctorConfirm', 1);
			updateEventsCalendar.set('MemberConfirm',-969);
		}
		if(oldConfirmAt == timeToString(time)&&TypeId==EventTypeId) {
			layer.msg('新的时间或事项不能与旧的相同！', {
				time: 1000
			});
		} else {
			if(oldConfirmAt == timeToString(time)&&TypeId!=EventTypeId){
				memo = '医生修改事项类型';
			}
			updateEventsCalendar.save().then(function(event) {
				AVCloudSaveOperRec(event.id, memo, notice);
			}, function() {
				layer.msg('重新协调出错', {
					shift: 6,
					time: 600
				}, function() {
					window.location.reload();
				});
			});
		}
	});
}
/*
 * 关闭refuse window
 */
function closeRefuse() {
	$(".jy").css("display", "none");
	$(".refuse-div").css("display", "none");
}

/*
 * 调用云函数 新增日程操作记录 共用
 * @evetID:日程id
 * @memo:'记录备注'
 * @layerMsg：成功后提示的语句
 */
function AVCloudSaveOperRec(evetID, memo, layerMsg) {
	var data = {
		'operator': {
			'classname': 'ServiceAgent',
			'id': getUrlParam("AgentID")
		},
		'eventid': evetID,
		'memo': memo
	}
	AV.Cloud.run("NewEventsOperRec", data, {
		success: function() {
			layer.msg(layerMsg, {
				time: 600
			}, function() {
				window.location.reload();
			});
		},
		error: function(error) {
			subEnd(); //按钮设为可用
			console.log("失败" + JSON.stringify(error));
		}
	});
}
/*
 * 
 */
function backToCallOut(){
	window.location.href = '../callOut/callOutMenu.html';
}

/*
 * 挂断
 */
function callOutHangUp(){
	$(".calloutHpBtn").attr("value","挂断中...");
	var cid = getUrlParam('callid');
	var AgentID = getUrlParam("AgentID");
	var data = {
		'func': 'ivr',
		'funcdes': 'call',
		'opernode': 'AgentServiceEnd',
		'callid': cid,
		'operparam': { 
			'agentid':AgentID ,
			'callid': cid,
			'action': ''
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			console.log("data="+JSON.stringify(data));
		},
		error: function(err) {
			// 处理调用失败
			console.log("挂断失败" + JSON.stringify(err));
			if(err.code == 1) {} else {
				layer.msg('操作失败，请联系管理员' + err.message, {});
			}
		}
	});
}