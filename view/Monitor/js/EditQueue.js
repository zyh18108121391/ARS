$(document).ready(function(){
	main()
});
var QUEUEID; //队列ID

function main(){
	var id = geturl();
	var query = new AV.Query("ServiceQueue");
	query.get(id,{
		success:function(obj){
			var QueueName = '';
			if(obj.get("QueueName")!=null){
				QueueName = obj.get("QueueName");
			}
			var QueueDes = '';
			if(obj.get("QueueDes")!=null){
				QueueDes = obj.get("QueueDes");
			}
			var WorkTimeStart = '';
			if(obj.get("WorkTimeStart")!=null){
				WorkTimeStart = obj.get("WorkTimeStart");
			}
			var WorkTimeEnd = '';
			if(obj.get("WorkTimeEnd")!=null){
				WorkTimeEnd = obj.get("WorkTimeEnd");
			}
			var HolidayStart = '';
			if(obj.get("HolidayStart")!=null){
				HolidayStart = obj.get("HolidayStart");
			}
			var HolidayEnd = '';
			if(obj.get("HolidayEnd")!=null){
				HolidayEnd = obj.get("HolidayEnd");
			}
			var OffworkPrompt = '';
			if(obj.get("OffworkPrompt")!=null){
				OffworkPrompt = obj.get("OffworkPrompt");
			}
			var DayOff = '';
			if(obj.get("DayOff")!=null){
				DayOff = obj.get("DayOff");
			}
			
			QUEUEID = obj.get("QueueID");
			$("#QueueName").val(QueueName);
			$("#QueueDes").val(QueueDes);
			$("#WorkTimeStart").val(WorkTimeStart);
			$("#WorkTimeEnd").val(WorkTimeEnd);
			$("#HolidayStart").val(HolidayStart);
			$("#HolidayEnd").val(HolidayEnd);
			$("#OffworkPrompt").val(OffworkPrompt);
			for (k in DayOff) {
				var tem = DayOff[k];
				$("#DayOff input:checkbox[value="+tem+"]").prop("checked",true);
			}
		}
	})
}


/*
 * 新增队列事件
 */
function EditQueueBtn(){
	subStart();
	var MyData={};
	var QueueName = $("#QueueName").val();
	var QueueDes = $("#QueueDes").val();
	var WorkTimeStart = $("#WorkTimeStart").val();
	var WorkTimeEnd = $("#WorkTimeEnd").val();
	var HolidayStart = $("#HolidayStart").val();
	var HolidayEnd = $("#HolidayEnd").val();
	var OffworkPrompt = $("#OffworkPrompt").val();
	var CheckList = new Array();
	$("#DayOff input[type=checkbox]").each(function(){
    	if(this.checked){
    		CheckList.push($(this).val());
    	}
	});
	MyData.WorkTimeEnd = WorkTimeEnd;
	if (QueueName == '') {
		layer.msg("队列名称不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (QueueDes == '') {
		layer.msg("队列描述不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (WorkTimeStart == '') {
		layer.msg("开始工作时间不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (WorkTimeEnd == '') {
		layer.msg("结束工作时间不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (HolidayStart == '') {
		layer.msg("节假日开始时间不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (HolidayEnd == '') {
		layer.msg("节假日结束时间不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (OffworkPrompt == '') {
		layer.msg("非工作时间提醒语音文件名不能为空！",{
			time:600
		});
		subEnd();
		return false;
	}
	if (CheckList.length == 0) {
		layer.msg("至少选择一个非工作日期",{
			time:600
		});
		subEnd();
		return false;
	}
	MyData = {
		QueueName:QueueName,
		QueueDes:QueueDes,
		WorkTimeStart:WorkTimeStart,
		WorkTimeEnd:WorkTimeEnd,
		HolidayStart:HolidayStart,
		HolidayEnd:HolidayEnd,
		OffworkPrompt:OffworkPrompt,
		CheckList:CheckList
	}
	AddOrEditQueue('modifyqueue','ModifyQueue ',QUEUEID,MyData);
}

/*
 * leancloud 编辑当前队列数据
 */
function EditQueue(data) {
	var id = geturl();
	var query = new AV.Query("ServiceQueue");
	query.get(id, {
		success: function(obj) {
			obj.set("QueueName", data.QueueName);
			obj.set("QueueDes", data.QueueDes);
			obj.set("WorkTimeStart", data.WorkTimeStart);
			obj.set("WorkTimeEnd", data.WorkTimeEnd);
			obj.set("HolidayStart", data.HolidayStart);
			obj.set("HolidayEnd", data.HolidayEnd);
			obj.set("OffworkPrompt", data.OffworkPrompt);
			obj.set("DayOff", data.CheckList);
			obj.save().then(function() {
				subEnd();
				layer.confirm("修改成功！",{
					btn:["返回","留在本页"]
				},function(){
					back();
				})
			});
		}
	});
}


