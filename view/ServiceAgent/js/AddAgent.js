$(document).ready(function() {
	ProImg();//上传图片预览
	ShowCheckBoxs("ServiceQueue", "QueueName", "WorkQueues");
});

/*
 * 新增队列事件
 */
function AddAgentBtn() {
	subStart();
	var AgentName = $("#AgentName").val();
	var Username = $("#Username").val();
	var Password = $("#Password").val();
	var HeadPortrait = $("#HeadPortrait")[0];
	var TelNo = $("#TelNo").val();
	var CheckList = new Array();
	$("#WorkQueues input[type=checkbox]").each(function() {
		if(this.checked) {
			CheckList.push($(this).val());
		}
	});
	if(AgentName == '') {
		layer.msg("坐席姓名不能为空！", {
			time: 600
		});
		subEnd();
		return false;
	}
	if(Username == '') {
		layer.msg("登录名不能为空！", {
			time: 600
		});
		subEnd();
		return false;
	}
	if(Password == '') {
		layer.msg("登录密码不能为空！", {
			time: 600
		});
		subEnd();
		return false;
	}
	if(HeadPortrait.files.length <= 0) {
		layer.msg("请上传头像！", {
			time: 600
		});
		subEnd();
		return false;
	}
	if(TelNo == '') {
		layer.msg("电话号码不能为空！", {
			time: 600
		});
		subEnd();
		return false;
	}
	if(CheckList.length == 0) {
		layer.msg("至少加入一个工作队列！", {
			time: 600
		});
		subEnd();
		return false;
	}
	//先注册用户 
	var user = new AV.User();
	user.setUsername(Username);
	user.setPassword(Password);
	user.save().then(function(loginedUser) {
		//新建serviceAgent对象
		var newAent = new ServiceAgent();
		newAent.set("AgentName", AgentName);
		newAent.set("TelNo", TelNo);
		newAent.set("Account", loginedUser);
		var relation = newAent.relation("WorkQueues");
		for(k in CheckList) {
			var temp = CheckList[k];
			var myObj = AV.Object.createWithoutData("ServiceQueue", temp);
			relation.add(myObj);
		}
		var file = HeadPortrait.files[0];
		var name = "serviceHead" + new Date().getTime() + ".jpg";
		var avFile = new AV.File(name, file);
		avFile.save().then(function() {
			newAent.set('HeadPortrait', avFile);
			newAent.save(null, {
				success: function(res) {
					// 成功保存之后，执行其他逻辑.
					subEnd();
					layer.confirm("增加成功！",{
						btn:["返回","留在本页"]
					},function(){
						back();
					})
				},
				error: function(post, error) {
					subEnd();
					layer.msg('增加失败，请重试！');
				}
			});
		}, function(error) {
			subEnd();
			layer.msg('上传头像失败！' + error.message);
		});

	}, (function(error) {
		subEnd();
		console.log(JSON.stringify(error));
		layer.msg("注册用户失败：" + JSON.stringify(error), {
			time: 600
		})
	}));
}