/*
 * 判断是否登陆 否则跳转至登陆页面
 */
$(document).ready(
	function() {
		if (AV.User.current() == null) {
			window.location.href = 'login.html';
		}else{
			var user=AV.User.current();
			var username=user.get("nickname");
			$("#username").text(username);
		}
	}
);


/*
 * 
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
	return id+1000;
}
//查询客服的状态
function status(AgentID) {
	var data = {
		'func': 'ivr',
		'funcdes': 'queryagentstate',
		'opernode': 'QueryAgentState',
		'operparam': {
			'agentid': AgentID
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			console.log("----------当前状态为：" + JSON.stringify(data));
			
		},
		error: function(err) {
			// 处理调用失败
			console.log(err);
		}
	});
}

