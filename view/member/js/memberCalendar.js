var resultArray = [];
var AgentID;
$(document).ready(
	function() {
		user = AV.User.current();
		if(user) {
			var user = AV.User.current();
			var Query = new AV.Query('ServiceAgent');
			Query.equalTo("Account", user);
			Query.first({
				success: function(agent) {
					Agent = agent;
					AgentID = agent.get('AgentID');
					main();
				}
			});
		}
		ShowSelectOption("EventType","EventTypeName", "eventTypes");//显示套餐选项到搜索下拉框
		bindEvent();
	}
);




//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10;//翻页大小默认为10
var query;
function main() {
	query = new AV.Query('EventsCalendar');
	query.include('EventType');
	query.include('Hospital');
	query.include('ConsultingRoom');
	query.include('MedicalResult');
	query.descending('createdAt');
	var member = AV.Object.createWithoutData('Member', geturl());
	var queryMember = new AV.Query('Member');
	queryMember.include('PersonalDoctor');
	queryMember.get(geturl()).then(function(member){
		var doctorID = member.get('PersonalDoctor').id;
		showTimeToSelect(doctorID);
	});
	query.notEqualTo('Statu', -999); //取消了的日程不显示
	query.equalTo('Member', member);
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
}

/*
 * 搜索函数
 * 
 */
function Search(){
	page = 0;
	var eventTypeID =  $("#eventTypes option:selected").val();
	var timeStart = $("#timeStart").val();
	var timeEnd = $("#timeEnd").val();
	query = new AV.Query('EventsCalendar');
	var member = AV.Object.createWithoutData('Member', geturl());
	query.notEqualTo('Statu', -999); //取消了的日程不显示
	query.equalTo('Member', member);
	if(timeStart) {
		var t_s = new Date(timeStart);
		t_s.setHours(0);
		query.greaterThanOrEqualTo("ConfirmAT", t_s);
	}
	if(timeEnd) {
		var t_e = new Date(timeEnd);
		t_e.setHours(23);
		query.lessThanOrEqualTo("ConfirmAT", t_e);
	}
	if(eventTypeID!='0'){
		var eve = AV.Object.createWithoutData('EventType', eventTypeID);
		query.equalTo('EventType',eve);
	}
	query.include('EventType');
	query.include('Hospital');
	query.include('ConsultingRoom');
	query.include('MedicalResult');
	query.descending('createdAt');
	showPages(query,true); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
}

//把query后的结果集输出到table中便于公用
function ShowObject(results,t) {
	var len = results.length;
	var html = '';
	for(var i = 0; i < len; i++) {
		var obj = results[i];
		var Id = obj.id;
		var EventType = obj.get('EventType') ? obj.get('EventType').get('EventTypeName') : '无';
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
	if(html != '') $("#calendar").html(html);

}

/*
 * 
 * 绑定事件集合
 * 
 */
function bindEvent() {
	//moveDivEvent();//div拖动
	//重新协调
	$('#calendar').on('click', '.statuFuncs', function() {
		var id = $(this).attr('data-objId');
		var btnname = $(this).attr('data-btnname');
		switch(btnname) {
			case 'newEditTime': //修改预约时间
				openEditTimeDiv(id, 'newEditTime');
				break;
			case 'newConfirm': //医生发起  确认预约
				confirmTime(id);
				break;
			case 'oldEditTime': //重新协调后 医生没确认前修改时间
				openEditTimeDiv(id, 'oldEditTime');
				break;
			case 'coordinate': //重新协调
				openEditTimeDiv(id, 'coordinate');
				break;
			case 'oldConfirm': //医生重新协调  请确认
				confirmTime(id);
				break;
			default:
				break;
		}
	});
	//取消日程
	$('#calendar').on('click', '.cancelBtn', function() {
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
 *确认日程 
 */
function confirmTime(id) {
	//询问框
	layer.confirm('确认日程时间？', {
		btn: ['确认', '取消'] //按钮
	}, function() {
		var query = new AV.Query('EventsCalendar');
		query.get(id).then(function(updateEventsCalendar) {
			updateEventsCalendar.set('MemberConfirm', 1);
			updateEventsCalendar.set('Statu', 11);
			updateEventsCalendar.save().then(function(event) {
				AVCloudSaveOperRec(event.id, '会员确认日程', '确认日程成功');
			});
		});
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
	var selectedValue = $("#canOrderTime option:selected").val();
	var othertime = $("#otherTime").val();
	if(othertime){
		var time = new Date(othertime);
	}else{
		var time = new Date(resultArray[selectedValue].Time);
	}
	var EventTypeId = resultArray[selectedValue].EventTypeId;
	var query = new AV.Query('EventsCalendar');
	var memo = '';
	var notice='';
	query.get(id).then(function(updateEventsCalendar) {
		var oldConfirmAt = timeToString(updateEventsCalendar.get('ConfirmAT'));
		var TypeId = updateEventsCalendar.get('EventType').id;
		updateEventsCalendar.set("ConfirmAT", time);
		if(btnname == 'newEditTime') {
			memo = '会员修改预约时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
			notice = '修改成功';
		}
		if(btnname == 'oldEditTime') {
			memo = '会员修改重新协调时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
			notice = '修改成功';
		}
		if(btnname == 'coordinate') {
			memo = '会员希望重新协调时间[' + oldConfirmAt + "]至[" + timeToString(time) + ']';
			notice = '重新协调成功';
			updateEventsCalendar.set('Statu', -969);
			updateEventsCalendar.set('DoctorConfirm', -969);
			updateEventsCalendar.set('MemberConfirm', 1);
		}
		if(oldConfirmAt == timeToString(time)&&TypeId==EventTypeId) {
			layer.msg('新的时间或事项不能与旧的相同！', {
				time: 1000
			});
		} else {
			if(oldConfirmAt == timeToString(time)&&TypeId!=EventTypeId){
				memo = '会员修改事项类型';
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
 * 调用云函数 新增日程操作记录 共用
 * @evetID:日程id
 * @memo:'记录备注'
 * @layerMsg：成功后提示的语句
 */
function AVCloudSaveOperRec(evetID, memo, layerMsg) {
	var data = {
		'operator': {
			'classname': 'ServiceAgent',
			'id': AgentID
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


//状态
function getStatus(status, DoctorConfirm, MemberConfirm, tep) {
	var statusString = "";
	var dobtnString = ''; //状态对应的操作按钮名称
	var dobtnName = ''; //状态对应的标识
	if(status == 1 || status == -969) {
		if(status == 1) { //新建状态 判断会员和医生确认状态
			if(DoctorConfirm == -1) {
				statusString = "待医生确认";
				dobtnName = "newEditTime";
				dobtnString = "更改时间";
			}
			if(MemberConfirm == -1) {
				statusString = "请确认日程";
				dobtnName = "newConfirm";
				dobtnString = "确认日程";
			}
		} else {
			if(DoctorConfirm == -969) {
				statusString = "待医生确认";
				dobtnName = "oldEditTime";
				dobtnString = "更改时间";
			}
			if(MemberConfirm == -969) {
				statusString = "日程已变更，请确认";
				dobtnName = "oldConfirm";
				dobtnString = "确认日程";
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

function addHtml(results, s) {
	var htmlStrComplete = '',
		htmlStr = '',
		tStr;
	var ConfirmAT, MedicalResult;
	var DoctorConfirm, Statu, EvaluationByDoctor, RatingByDoctor;
	for(var i = 0; i < results.length; i++) {

		if(results[i].get('ConfirmAT')) {
			ConfirmAT = getTime(results[i].get('ConfirmAT'));
		} else {
			ConfirmAT = "暂无确认";
		}
		MedicalResult = results[i].get('MedicalResult') ? results[i].get('MedicalResult').get('MedicalResult') : '无';
		DoctorConfirm = results[i].get('DoctorConfirm');
		Statu = results[i].get('Statu');
		EvaluationByDoctor = results[i].get('EvaluationByDoctor');
		RatingByDoctor = results[i].get('RatingByDoctor');
		if(results[i].get('RatingByMember')) {
			RatingByMember = getTime(results[i].get('ConfirmAT'));
		} else {
			RatingByMember = "暂无评分";
		}
		tStr = '<tr id="' + results[i].id + '">' +
			'<td class="goToSd">' + results[i].get('EventType').get('EventTypeName') + '</td>' +
			'<td class="goToSd">' + ConfirmAT + '</td>' +
			'<td class="goToSd">' + results[i].get('Hospital').get('HospitalName') + '</td>' +
			'<td class="goToSd">' + results[i].get('ConsultingRoom').get('RoomName') + '</td>' +
			'<td class="goToSd">' + MedicalResult + '</td>' +
			'<td class="goToSd">' + Statu + '</td>' +
			'<td class="goToSd">' + RatingByMember + '</td>' +
			'<td>' + buttonHtml(DoctorConfirm, Statu, EvaluationByDoctor, RatingByDoctor) + '</td>' +
			'</tr>';

		if(Statu == 31) {
			htmlStrComplete += tStr;
		} else {
			htmlStr += tStr;
		}
	}

	$('#member_schedules').html(htmlStr + htmlStrComplete);
}

function buttonHtml(DoctorConfirm, Statu, EvaluationByDoctor, RatingByDoctor) {
	var butHtml = '';
	if(DoctorConfirm != 1) {
		butHtml += '<a href="../../view/scheduleControl/surePrebook.html"><button class="btn btn-danger">确认预约</button></a>' +
			'<button class="btn btn-danger">重新协调</button>';
	} else {
		if(Statu == 11 || Statu == 21) {
			butHtml += '<a href="filloutDiagnosis.html"><button class="btn btn-danger">填写诊断结果</button></a>';
		}
		if(Statu == 31) {
			butHtml += '<button class="btn btn-danger">查看诊断结果</button>';
		}
		if(EvaluationByDoctor && RatingByDoctor) {
			butHtml += '<button class="btn btn-danger">已评价</button>';
		} else {
			butHtml += '<a href="scheduleComment.html"><button class="btn btn-danger">评价</button></a>';
		}
	}
	return butHtml;
}

function getTime(ConfirmAT) {
	var y = ConfirmAT.getFullYear();
	var month = ConfirmAT.getMonth() + 1;
	var day = ConfirmAT.getDay();
	return y + '-' + month + '-' + day + ' ' + ConfirmAT.getHours() + ':' + ConfirmAT.getMinutes() + ':' + ConfirmAT.getSeconds();
}

$('#member_schedules').on('click', '.goToSd', function() {
	location.href = 'scheduleDetail.html?id=' + $(this).parent().attr('id');
});

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
	$('#canOrderTime').html(htmlTimes);
}
/*
 * 关闭refuse window
 */
function closeRefuse() {
	$(".jy").css("display", "none");
	$(".refuse-div").css("display", "none");
}
/*
	判断是否选择其它时间
 */
function otherTimeInputEvent() {
	var text = $("#refuse-name").html();
	var vlaue = $("#otherTime").val();
	if(vlaue){
		$("#refuse-name").html("<s>"+text+"</s>");
	}else{
		var t = text.replace('<s>','').replace("</s>",'');
		$("#refuse-name").html(t);
	}
}
//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
    var html_op = '<option value="0">所有事项</option>',obj;
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