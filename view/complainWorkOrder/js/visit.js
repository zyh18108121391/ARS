var AgentID = null; //客服ID 外呼需用到
var CID = null; //拨打成功后返回的cid 挂断用掉
var RECORDID; //通话记录ID
var THIS;
var Pageflag = false; //记录是否弹出备注输入框 
$(document).ready(function() {
	var user = AV.User.current();
	var query = new AV.Query('ServiceAgent');
	query.equalTo('Account', user);
	query.first().then(function(result) {
		AgentID = result.get("AgentID");
		main();
		// 每次调用生成一个聊天实例
	}, function(error) {
		layer.msg('查询错误', {
			shift: 6,
			time: 600
		})
	});
	createNew();
});

/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	if(data.agentid != AgentIDChange(AgentID)) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	if(data.objectID) {
		RECORDID = data.objectID; //agentconversation的id
	}
	var statu = data.agentstate;
	if(statu == 0) { //状态切换为0时执行
		//如果按钮已经是"拨打电话的情况 则不执行"
		var type = $("#call").attr("date-type");
		if(type != 'call') {
			changeCallBtn(THIS);
		}
		//如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
		//Pageflag为True 代标有拨打电话的动作，否则不弹窗。
		if(RECORDID && Pageflag) {
			Pageflag = false;
			SetRecordMemo(RECORDID);
		}
	}
}
function main() {
	var ID = geturl();
	var query = new AV.Query('ComplainWorkOrder');
	query.include("Member");
	query.include("MemberLevel");
	query.include("TransferDepartment");
	query.include("ComplainLevel");
	query.get(ID, {
		success: function(obj) {
			var Id = obj.id;
			var MemberName = '';
			if(obj.get("Member") != null) {
				MemberName = obj.get("Member").get("MemberName");
			}
			var AgentName = '';
			if(obj.get("Agent") != null) {
				AgentName = obj.get("Agent").get('AgentName');
			}
			var PhoneNo = '';
			if(obj.get("PhoneNo") != null) {
				PhoneNo = obj.get("PhoneNo");
				$("#call").attr("name", PhoneNo);
			}
			var LevelName = '';
			var LevelIcon = '';
			if(obj.get("MemberLevel") != null) {
				var le = obj.get("MemberLevel");
				LevelName = le.get("LevelName");
				LevelIcon = le.get("LevelIcon").url();
				$("#M_level").html(LevelName + '<img src=\"' + LevelIcon + '\" width=\"15px\">');
			}
			var ResultByService = '';
			if(obj.get("ResultByService") != null) {
				ResultByService = obj.get("ResultByService");
			}
			var ResultByDepartment = '';
			if(obj.get("ResultByDepartment") != null) {
				ResultByDepartment = obj.get("ResultByDepartment");
			}
			var ComplainType = '';
			if(obj.get("ComplainType") != null) {
				ComplainType = obj.get("ComplainType");
				if(ComplainType == 1) {
					$("#results-type").html("客服处理结果");
					$("#results-type").attr('data', 'A');
					$("#ComplainType").html("A类-(客服可内部处理的)");
					$("#resultsText").html(ResultByService);
				} else { //如果有转接部门
					$("#results-type").html("部门处理结果");
					$("#results-type").attr('data', 'A');
					$("#ComplainType").html("B类-(需转接其他部门的)");
					var DepName = obj.get("TransferDepartment").get("DepName");
					$("#TransferDepartment").html(DepName);
					$("#resultsText").html(ResultByDepartment);
				}
			}
			if(obj.get("ComplainLevel") != null) {
				ComplainLevelName = obj.get("ComplainLevel").get("LevelName");
				$("#ComplainLevel").html(ComplainLevelName);
			}
			var ResTypeNumber = '';
			if(obj.get("RespondentsType") != null) {
				ResTypeNumber = obj.get("RespondentsType");
				var ResType = ResTypeStatuToStr(ResTypeNumber);
				$("#ObjectType").html(ResType);
			}
			var Statu = '';
			if(obj.get("Statu") != null) {
				Statu = obj.get("Statu");
			}
			var Contents = '';
			if(obj.get("Contents") != null) {
				Contents = obj.get("Contents");
			}
			$("#MemberName").html(MemberName);
			$("#tellNo").html(PhoneNo);
			$("#Agent").html(AgentName);
			$("#Contents").html(Contents);
			if(obj.get("Respondents") != null) {
				var Respondents = obj.get("Respondents");
				for(var p in Respondents) {
					RespondentsType = p;
					RespondentsID = Respondents[p];
				}
				var query = new AV.Query(RespondentsType);
				query.get(RespondentsID, {
					success: function(resp) {
						if(RespondentsType == "Doctor") {
							var getName = "DoctorName";
						} else if(RespondentsType == "Butler") {
							var getName = "ButlerName";
						} else {
							var getName = "AgentName";
						}
						var RespondentsName = resp.get(getName);
						$("#ComplainObject").html(RespondentsName);
					}
				});
			}
		}
	});
}


/*
 * 保存回访记录并流转
 * 
 */
function save() {
	subStart();
	var CallbackResult = $("#CallbackResult").val();
	if(CallbackResult == '') {
		subEnd();
		layer.msg('请输入客服回访结果', {
			shift: 6,
			time: 600
		})
		return;
	}
	var ID = geturl();
	var query = new AV.Query('ComplainWorkOrder');
	query.get(ID, {
		success: function(obj) {
			obj.set("CallbackResult", CallbackResult);
			obj.set("Statu", 4);
			obj.save(null, {
				success: function(obj) {
					layer.confirm('保存成功，该投诉单已经处理完成进入历史工单!', {
						btn: ['查看历史工单', '返回回访工单'] //按钮
					}, function() {
						window.location.href = "history.html";
					}, function() {
						back();
					});
				}
			});
		}
	});
}