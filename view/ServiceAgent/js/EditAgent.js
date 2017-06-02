$(document).ready(function() {
	ProImg(); //上传图片预览
	main();
});
var QueueArray;

function main() {
	var id = geturl();
	var query = new AV.Query("ServiceAgent");
	query.get(id, {
		success: function(obj) {
			var AgentName = '';
			if(obj.get("AgentName") != null) {
				AgentName = obj.get("AgentName");
			}

			var HeadPortrait = '';
			if(obj.get("HeadPortrait") != null) {
				HeadPortrait = obj.get('HeadPortrait').url();
			}
			var TelNo = '';
			if(obj.get("TelNo") != null) {
				TelNo = obj.get("TelNo");
			}
			var AgentID = '';
			if(obj.get("AgentID") != null) {
				AgentID = obj.get("AgentID");
			}
			var IsMonitor = '';
			if(obj.get("IsMonitor") != null) {
				IsMonitor = obj.get("IsMonitor");
			}
			QueueArray = [];
			var relation = obj.relation("WorkQueues")
			relation.query().find({
				success: function(result) {
					for(var j = 0; j < result.length; j++) {
						QueueArray.push(result[j].id);
					}
					ShowCheckBoxs("ServiceQueue", "QueueName", "WorkQueues", QueueArray);
				}
			});
			$("#ImgPr").attr("src", HeadPortrait);
			$("#AgentName").val(AgentName);
			$("#TelNo").val(TelNo);
			$("#AgentID").val(AgentID);
			if(IsMonitor) {
				$("#IsMonitor input:radio[value=true]").prop("checked", true);
			}
		}
	});
}

/*
 * 新增队列事件
 */
function EditAgent() {
	subStart();
	var AgentName = $("#AgentName").val();
	var HeadPortrait = $("#HeadPortrait")[0];
	var TelNo = $("#TelNo").val();
	var IsMonitor = $("#IsMonitor input[type=radio]:checked").val() == 'true' ? true : false;
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
	var MyAgent = AV.Object.createWithoutData("ServiceAgent", geturl());
	MyAgent.set("AgentName", AgentName);
	MyAgent.set("TelNo", TelNo);
	MyAgent.set("IsMonitor", IsMonitor);

	var relation = MyAgent.relation("WorkQueues");
	for(k in QueueArray) { //先remove所有relation
		var temp = QueueArray[k];
		var myObj = AV.Object.createWithoutData("ServiceQueue", temp);
		relation.remove(myObj);
	}

	if(HeadPortrait.files.length <= 0) { //如果不修改头像
		MyAgent.save().then(function() {
			for(j in CheckList) { //在add relation
				var temp = CheckList[j];
				var myObj = AV.Object.createWithoutData("ServiceQueue", temp);
				relation.add(myObj);
			}
			MyAgent.save().then(function() { //然后再保存
				subEnd();
				layer.msg("编辑成功", {
					time: 600
				}, function() {
					back();
				});
			});
		});
	} else { //如果修改了头像
		var file = HeadPortrait.files[0];
		var name = "serviceHead" + new Date().getTime() + ".jpg";
		var avFile = new AV.File(name, file);
		avFile.save().then(function() {
			MyAgent.set('HeadPortrait', avFile);
			MyAgent.save().then(function() {
				for(j in CheckList) { //在add relation
					var temp = CheckList[j];
					var myObj = AV.Object.createWithoutData("ServiceQueue", temp);
					relation.add(myObj);
				}
				MyAgent.save().then(function() { //然后再保存
					subEnd();
					layer.confirm("编辑成功！",{
						btn:["返回","留在本页"]
					},function(){
						back();
					})
				});
			});
		},
		function(error) {
			subEnd();
			layer.msg('上传头像失败！' + error.message);
		});
	}
}