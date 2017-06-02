$(document).ready(function() {
	main();
	$("#editPW").click(function() {
		$(".change_pho_pass").show();
	});

});

function main() {
	var user = AV.User.current();
	currentUserID = user.id;
	var query = new AV.Query('ServiceAgent');
	query.equalTo('Account', user);
	query.first().then(function(result) {
		var AgentName = result.get("AgentName");
		var AgentID = result.get("AgentID");
		var master = result.get("IsMonitor") ? "是" : "否";
		var telNo = result.get("TelNo");
		$("#name").text(AgentName);
		$("#agentID").text(AgentID);
		$("#telNo").html(telNo);
		$("#master").html(master);
		//保存到全局变量 方便后面调用云函数改变状态等
		var relation = result.relation("WorkQueues");
		var WorkQu = []; //疾病数组
		var relation = result.relation("WorkQueues");
		relation.query().find({
			success: function(result) {
				for(var j = 0; j < result.length; j++) {
					WorkQu.push(result[j].get('QueueName'));
					$("#serverQ").html(WorkQu.toString());
				}
			}
		});

	}, function(error) {
		layer.msg('查询错误', {
			shift: 6,
			time: 600
		})
	});
}
/*
 * 
 * 修改密码
 */
function editPW() {
	var oldPasswd= $(".old_passWord").val();
	var p1 = $(".new_passW1").val();
	var p2 = $(".new_passW2").val();
	
	if(oldPasswd == '') {
		layer.msg('旧密码不能为空', {
			shift: 6,
			time: 600
		});
		return;
	}
	if(p1 == '') {
		layer.msg('新密码不能为空', {
			shift: 6,
			time: 600
		});
		return;
	}
	if(p2 == '') {
		layer.msg('请确认新密码', {
			shift: 6,
			time: 600
		});
		return;
	}
	if(p2 != p1) {
		layer.msg('新密码两次输入不一致', {
			shift: 6,
			time: 600
		});
		return;
	}
	if(oldPasswd == p1) {
		layer.msg('新密码和旧密码不能相同', {
			shift: 6,
			time: 600
		});
		return;
	}
	var user = AV.User.current();
	user.updatePassword(oldPasswd, p1).then(function() {
		layer.msg('修改成功，您将重新登录', {
				time: 600
			},function(){
				AV.User.logOut();
				parent.location.reload();
			});
		//更新成功
	}, function(error) {
		//更新失败
		if(error.code==210){
			layer.msg('修改失败,旧密码错误', {
				time: 1000
			});
		}
		console.log(JSON.stringify(error));
	});

}