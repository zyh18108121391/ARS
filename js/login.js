function login() {
	$("#submit").css("cursor","wait");
	var username = $("#sysuser").val();
	var password = $("#password").val();
	if(username == '') {
		$("#submit").css("cursor","pointer");
		alert("请输入用户名");
		return false;
	}
	if(password == '') {
		$("#submit").css("cursor","pointer");
		alert("请输入密码");
		return false;
	}
	AV.User.logIn(username, password, {
		success: function(user) {
			var query = new AV.Query('ServiceAgent');
			query.equalTo('Enabled', true);  //有效坐席
			query.equalTo('Account', user);
			query.first().then(function(result) {
				if(result) {
					//找到每个列队进入上班状态
					var telNo = result.get("TelNo");
					var AgentID = result.get("AgentID");
					var relation = result.relation("WorkQueues");
					var query = relation.query();
					query.find({
						success: function(work) {
							var len = work.length;
							for(var j = 0; j < len; j++) {
								var obj = work[j];
								var qID = obj.get("QueueID");
								StartWork(telNo, AgentIDChange(AgentID), qID, len); //上班状态 加入列队 
							}
						}
					});
				} else {
					$("#submit").css("cursor","pointer");
					layer.msg('该用户不是客服身份', {
						shift: 6,
						time: 600
					})
				}
			}, function(error) {
				layer.msg('查询错误', {
					shift: 6,
					time: 600
				})
			});

		},
		error: function(user, error) {
			$("#submit").css("cursor","pointer");
			if(error.message == "The username and password mismatch.") {
				layer.msg("密码错误", {
					time: 600
				}, function() {});
				$("#password").focus();
			}
		}
	});
}

/*
 * 
 * 登录后 获取所属列队 调用云函数，进入上班状态
 * @telNo:电话号码
 * @AgentID：客服号 格式0001
 * @qID：队列号
 */
var count = 0; //记录加入列队数
function StartWork(telNo, AgentID, qID, len) {
	var data = { //上班
			'func': 'ivr',
			'funcdes': 'agentonwork',
			'opernode': 'AgentOnWork',
			'operparam': {
				'number': telNo,
				'agentid': AgentID,
				'agenttype': qID,
				'agentstate': '0'
			}
		}
		//第一次调用上班接口 设置agentstate=0 准备中
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			count += 1;
			if(count == len) {
				$("#submit").css("cursor","default");
				layer.msg("登录成功", {
					time: 600
				}, function() {
					window.location.href = "index.html";
				});
			}
		},
		error: function(err) {
			$("#submit").css("cursor","pointer");
			// 处理调用失败
			if(err.code == 1) {
				window.location.href = "index.html";
			} else {
				layer.msg('操作失败，请联系管理员' + err.message, {});
			}
			console.log(err);
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