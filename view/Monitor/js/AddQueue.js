var COUNT;//记录总的队列数 
$(document).ready(function(){
	var query = new AV.Query('ServiceQueue');
	query.count(function(count){
		COUNT = count;
	});
});

/*
 * 新增队列事件
 */
function AddQueueBtn(){
	subStart();
	var MyData={};
	var QueueName = $("#QueueName").val();
	var QueueDes = $("#QueueDes").val();
	var WorkTimeStart = $("#WorkTimeStart").val();
	var WorkTimeEnd = $("#WorkTimeEnd").val();
	var HolidayStart = $("#HolidayStart").val();
	var HolidayEnd = $("#HolidayEnd").val();
	var OffworkPrompt = $("#OffworkPrompt").val();
	var CheckList=new Array();
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
	AddOrEditQueue('createqueue','CreateQueue',COUNT+1,MyData);
}

/*
 * leancloud 新增列队一条数据
 */
function AddQueue(data){
	var newQueue = new ServiceQueue();
	newQueue.set("QueueName",data.QueueName);
	newQueue.set("QueueDes",data.QueueDes);
	newQueue.set("WorkTimeStart",data.WorkTimeStart);
	newQueue.set("WorkTimeEnd",data.WorkTimeEnd);
	newQueue.set("HolidayStart",data.HolidayStart);
	newQueue.set("HolidayEnd",data.HolidayEnd);
	newQueue.set("OffworkPrompt",data.OffworkPrompt);
	newQueue.set("DayOff",data.CheckList);
	newQueue.save().then(function(){
		subEnd();
		layer.confirm("增加成功！",{
			btn:["返回","留在本页"]
		},function(){
			back();
		})
	});
}


