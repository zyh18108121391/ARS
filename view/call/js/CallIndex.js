var TELNO; //客服电话号码
var AGENTID; //客服号
var AGENT;
var AgentObjectID;
$(document).ready(function() {
	createNew();
	//查询当前客服id
	var user = AV.User.current();
	var query = new AV.Query('ServiceAgent');
	query.equalTo('Account', user);
	query.first().then(function(result) {

		//保存到全局变量 方便后面调用云函数改变状态等
		AGENT = result;
		AgentObjectID = result.id;
		TELNO = result.get("TelNo");
		AGENTID = result.get("AgentID");
		// 每次调用生成一个聊天实例

		searchStatu(AGENTID); //查询状态并且 恢复弹窗
	}, function(error) {
		layer.msg('查询错误', {
			shift: 6,
			time: 600
		})
	});
});
/*
 * 
 * 查询状态 
 */
function searchStatu(agentID) {
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
			if(obj.get('Direction') == '0' && t2 == t1) {
				layer.msg("恢复通话...");
				var callid = obj.get('CalIID');
				var query = new AV.Query('AgentConversationRecord');
				query.equalTo('CalIID', callid);
				query.first().then(function(record) {
					var agentID = record.get('Agent').id;
					if(agentID == AgentObjectID) {
						var telNo = record.get("ToTelNo");
						var callID = record.get("CalIID");
						searchNumberByTelNo(telNo, callID); //根据电话和callid弹窗
					}
				});
			}
		});
	}
}

/*
 * 处理收到的所有push消息
 * 格式如下
 * 1：{"agentid":"1001","agentstate":"1","time":"20160817134159","_channel":"1"}
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	//console.log("callindex==============接收到推送消息=======" + JSON.stringify(data));
	if(data.agentid != AgentIDChange(AGENTID)) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	var statu = data.agentstate;
	var callid = data.callid;
	if(statu == 2) { //如果电话接通 弹出客户信息
		var telNumber = data.number;
		searchNumberByTelNo(telNumber, callid);
	}
}
/*
 * 根据 电话号码查询用户 并且弹窗
 * 
 */
function searchNumberByTelNo(telNo, callid) {
	var queryA = new AV.Query('Member');
	queryA.equalTo("MobilePhoneNo", telNo);
	var queryB = new AV.Query('Member');
	queryB.equalTo("AppendMobilePhoneNo", telNo);
	var query = AV.Query.or(queryA, queryB);
	query.first({
		success: function(obj) {
			if(!obj) { //如果不存在
				layer.msg('陌生来电', {
					time: 600
				});
				var temp = "otherCall.html?id=" + telNo + "&AgentID=" + AgentIDChange(AGENTID) + "&callid=" + callid;
				window.location.href = temp;
			} else {
				layer.msg('接收到客户电话', {
					time: 600
				});
				var temp = "call.html?id=" + obj.id + "&AgentID=" + AgentIDChange(AGENTID) + "&callid=" + callid;
				window.location.href = temp;
			}
		}
	});
}
/*
 * 
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
	return id + 1000;
}

function showLog(msg) {
	console.log(msg);
}