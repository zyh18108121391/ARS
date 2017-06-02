/*
 * 坐席外呼  
 * by zyh
 */
var AgentID;
var AGENT;
var AgentObjectID;
$(document).ready(
	function() {
		var user = AV.User.current();
		var query = new AV.Query('ServiceAgent');
		query.equalTo('Account', user);
		query.first().then(function(result) {
			AGENT = result;
			AgentID = result.get("AgentID");
			renew(AgentID);
			AgentObjectID = result.id;
			// 每次调用生成一个聊天实例
		}, function(error) {
			layer.msg('查询错误', {
				shift: 6,
				time: 600
			})
		});
		/*createNew();*/
	});

/*
 * 
 * 查询状态恢复弹窗 
 */
function renew(agentID) {
	var agentID = AgentIDChange(agentID);
	var data = {
		'func': 'ivr',
		'funcdes': 'queryagentstate',
		'opernode': 'QueryAgentState',
		'operparam': {
			'agentid': agentID
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			var statu = data.Response.agents.agent.state;
			RecoveryCall(statu); //恢复弹窗
		},
		error: function(err) {
			// 处理调用失败
			console.log(err);
		}
	});
}
/*
 * 
 * 如果当前正在通话 点进此页面恢复弹窗页面
 * 
 */
function RecoveryCall(statu) {
	if(statu == 2 || statu == 3) { //如果是在锁定中或者通话中
		var RecordQuery = new AV.Query('CallRecord');
		RecordQuery.descending('createdAt');
		RecordQuery.first().then(function(obj) {
			var t1 = obj.createdAt.getTime();
			var t2 = obj.updatedAt.getTime();
			if(obj.get('Direction') == '1' && t2 == t1) {
				layer.msg("恢复通话...");
				var callid = obj.get('CalIID');
				var query = new AV.Query('AgentConversationRecord');
				query.equalTo('CalIID', callid);
				query.first().then(function(obj) {
					var agentID  = obj.get('Agent').id;
					//console.log(agentID+"/"+AgentObjectID);
					if(obj&&AgentObjectID==agentID) {
						var telNo = obj.get("ToTelNo");
						var CID = obj.get("CalIID");
						if(obj.get('Member')) {
							var memberId = obj.get('Member').id;
							trans('1', memberId, telNo, CID, AgentID);
						} else if(obj.get('Doctor')) {
							var doctorID = obj.get('Doctor').id;
							trans('2', doctorID, telNo, CID, AgentID);
						} else {
							trans('3', ' ', telNo, CID, AgentID);
						}
					}
				});
			}
		});
	}
}

/*
 * 呼叫
 */
function callOut() {
	$('#callbtn').html("呼叫中...");
	var telNo = $("#SearchTelNo").val();
	var type = $("#SearchTelNo").attr('data-type');
	var id = $("#SearchTelNo").attr('data-ID');
	if(telNo == '') {
		layer.msg('请输入电话号码');
		$("#SearchTelNo").focus();
		return;
	}
	var data = {
		'func': 'ivr',
		'funcdes': 'agentmakecall',
		'opernode': 'AgentMakeCall',
		'operparam': {
			'number': telNo,
			'agentid': AgentIDChange(AgentID),
			'disnumber': '02388658982',
			'answerurl': 'callOutAnswer',
			'agenthangupurl': 'CustomerMark'
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			CID = data.Response.callSid;
			trans(type, id, telNo, CID, AgentID);
		},
		error: function(err) {
			// 处理调用失败
			console.log("拨打失败" + JSON.stringify(err));
			if(err.code == 1) {
				console.log(err.message, {});
				layer.msg('操作失败，' + err.message);
			}
		}
	});
}

function trans(type, id, telNo, CID, AgentID) {
	var URL = '';
	if(type == '1') {
		URL = '../call/call.html?id=' + id + "&callid=" + CID + "&AgentID=" + AgentIDChange(AgentID) + "&callout=true";
	} else if(type == '2') {
		URL = 'DoctorCallOut.html?id=' + id + "&callid=" + CID + "&telNo=" + telNo + "&AgentID=" + AgentIDChange(AgentID);
	} else {
		URL = 'OtherCallOut.html?telNo=' + telNo + "&callid=" + CID + "&AgentID=" + AgentIDChange(AgentID);
	}
	window.location.href = URL;
}

/*
 * OnInput(event) 搜索框触发事件
 * 
 */
function OnInput(event) {
	$("#input_ul").html('');
	$(".search_results").css("display", "none");
	var value = event.target.value;
	var len = value.length;
	if(len != 0) {
		searchFunc(value);
	}
	if(len >= 12) {
		$(".tel-count").css("background-color", "#eb4f38");
	} else {
		$(".tel-count").css("background-color", "#11cd6e");
	}
	if(len == 11) {
		$(".tel-count").html('√');
	} else {
		$(".tel-count").html(len);
	}
}
/*
 * 查询会员显示在列表中
 */
function searchFunc(value) {
	var queryMember;
	var queryMemberA = new AV.Query('Member');
	var queryMemberB = new AV.Query('Member');

	var queryDoctor;
	var queryDoctorA = new AV.Query('Doctor');
	var queryDoctorB = new AV.Query('Doctor');
	if(value.length >= 2) {
		queryMemberA.startsWith('MobilePhoneNo', value);
		queryMemberB.startsWith('AppendMobilePhoneNo', value);
		queryMember = AV.Query.or(queryMemberA,queryMemberB);

		queryDoctorA.startsWith('MobilePhoneNo', value);
		queryDoctorB.startsWith('AppendMobilePhoneNo', value);
		queryDoctor = AV.Query.or(queryDoctorA,queryDoctorB);
		if(value.length == 11) {
			var tep = true; //长度为11位
		}
	} else {
		return;
	}
	$("#input_ul").html('');
	queryMember.find().then(function(results) {
		ShowResults(results, 'member');
	});
	queryDoctor.find().then(function(results) {
		ShowResults(results, 'doctor');
	});

	function ShowResults(results, t) {
		var html = '';
		var len = results.length;
		for(var i = 0; i < len; i++) {
			var obj = results[i];
			var MobilePhoneNo;
			var ID = obj.id;
			if(t == 'member') {
				var type = 1;
				var Name = obj.get('MemberName') ? obj.get('MemberName') : '艾尔斯用户';
				var Url = '../../images/s-member.png';
				var appendNo = obj.get('AppendMobilePhoneNo');
				var str_ad = '';
				if(appendNo){//会员有副电话
					for(var i = 0;i<appendNo.length;i++){
						html += "<li onclick=\'checkLi(" + type + ",\"" + ID + "\",\"" + appendNo[i] + "\")\'>" + '<img src="' + Url + '"/>' + appendNo[i]+"(副)" + "<small>" + Name + "</small></li>";
					}
				}else{//会员没有副电话
					MobilePhoneNo = obj.get('MobilePhoneNo');
					html += "<li onclick=\'checkLi(" + type + ",\"" + ID + "\",\"" + MobilePhoneNo + "\")\'>" + '<img src="' + Url + '"/>' + MobilePhoneNo + "<small>" + Name + "</small></li>";
				}
			} else {
				var type = 2;
				var Name = obj.get('DoctorName') ? obj.get('DoctorName') : '艾尔斯医生';
				var Url = '../../images/s-doctor.png';
				var MobilePhoneNo = obj.get('MobilePhoneNo');

				html += "<li onclick=\'checkLi(" + type + ",\"" + ID + "\",\"" + MobilePhoneNo + "\")\'>" + '<img src="' + Url + '"/>' + MobilePhoneNo + "<small>" + Name + "</small></li>";
			}
			//当用户输入11位手机号后 自动识别一种身份和相应号码加入date属性中，避免没有选择下拉框的情况
			if(tep && i == 0) checkLi(type, ID, MobilePhoneNo);

		}
		$("#input_ul").append(html);
		$(".search_results").css('display', 'block');
	}
}

function checkLi(type, id, MobilePhoneNo) {
	$("#SearchTelNo").attr('data-id', id);
	$("#SearchTelNo").attr('data-type', type);
	$("#SearchTelNo").val(MobilePhoneNo.trim());
	$(".search_results").css("display", "none");
	$(".tel-count").html('√');
}
/*
 * 
 * 鼠标离开下拉类表 隐藏
 * 
 */
function hide() {
	$(".search_results").css("display", "none");
}

function show() {
	$(".search_results").css("display", "block");
}
/*
 * 
 *
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
	return id + 1000;
}