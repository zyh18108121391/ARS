$(document).ready(function() {
	main();
});
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber =10;//翻页大小默认为10
var query = new AV.Query('ServiceQueue');
//主函数
function main() {
	query = new AV.Query('ServiceQueue');
	query.equalTo("Enabled",true);
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
}

//把query后的结果集输出到table中便于公用
function ShowObject(results) {
	var len = results.length;
	if(!len) {
		layer.msg('没有查询到相关信息', {
			shift: 6,
			time: 600
		});
		return;
	}
	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var Id = obj.id;

			var QueueName = '';
			if(obj.get("QueueName") != null) {
				QueueName = obj.get("QueueName");
			}

			var QueueID = '';
			if(obj.get("QueueID") != null) {
				QueueID = obj.get("QueueID");
			}

			var QueueDes = '';
			if(obj.get("QueueDes") != null) {
				QueueDes = obj.get("QueueDes");
			}

			var WorkTimeStart = '';
			if(obj.get("WorkTimeStart") != null) {
				WorkTimeStart = obj.get("WorkTimeStart");
			}

			var WorkTimeEnd = '';
			if(obj.get("WorkTimeEnd") != null) {
				WorkTimeEnd = obj.get("WorkTimeEnd");
			}

			var OffworkPrompt = '';
			if(obj.get("OffworkPrompt") != null) {
				OffworkPrompt = obj.get("OffworkPrompt");
			}

			var HolidayStart = '';
			if(obj.get("HolidayStart") != null) {
				HolidayStart = obj.get("HolidayStart");
			}

			var HolidayEnd = '';
			if(obj.get("HolidayEnd") != null) {
				HolidayEnd = obj.get("HolidayEnd");
			}

			var DayOff = '';
			if(obj.get("DayOff") != null) {
				DayOff = obj.get("DayOff");
			}

			htmlArray[i] = '<tr>' +
				'<td>' + QueueName + '</td>' +
				'<td>' + QueueID + '</td>' +
				'<td>' + QueueDes + '</td>' +
				'<td>' + WorkTimeStart + "-" + WorkTimeEnd + '</td>' +
				'<td>' + OffworkPrompt + '</td>' +
				'<td>' + HolidayStart + "-" + HolidayEnd + '</td>' +
				'<td>' + weekChangeToString(DayOff) + '</td>' +
				'<td><a href="QueueEdit.html?id=' + Id + '">编辑</a>|<a href="javascript:del(\''+QueueID+'\',\''+Id+'\')"' + '>删除</a>' + '</td>' +
				'</tr>';
			count += 1;
			if(count == len) {
				for(var k = 0; k < len; k++) {
					html += htmlArray[k];
				}
				$("#table-body").html(html);
			}
		})(i);
	}
}

/*
 * 删除
 * 
 */
function del(qid,objectID) {
	layer.confirm('是否确认删除该队列？', {
		btn: ['确定', '取消'] //按钮
	}, function() {
		deleteQueueCloud(qid,objectID);
	});
}


/*
 * 
 * 删除队列云函数 
 */
function deleteQueueCloud(qid, objectID) {
	var data = {
		'func': 'ivr',
		'funcdes': 'delqueue',
		'opernode': 'DelQueue',
		'operparam': {
			'queuetype': qid
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			var newObj = AV.Object.createWithoutData("ServiceQueue", objectID);
			newObj.set("Enabled",false);
			newObj.save().then(function(){
				layer.msg('删除成功', {
					time: 600
				}, function() {
					window.location.reload();
				});
			});
		},
		error: function(err) {
			// 处理调用失败
			layer.msg('删除失败，请联系管理员');
			console.log(err);
		}
	});
}

/*
 *
 * 数组转换为
 */
function weekChangeToString(days) {
	var str = [];
	for(day in days) {
		str.push(weekChange(days[day]))
	}
	return str.toString();
}

/*
 * 
 *  Mon、Tue、Wed、Thu、Fri、Sat、Sun转换为周一、周二
 */
function weekChange(day) {
	var t = null;
	switch(day) {
		case 'Mon':
			t = "周一";
			break;
		case 'Tue':
			t = "周二";
			break;
		case 'Wed':
			t = "周三";
			break;
		case 'Thu':
			t = "周四";
			break;
		case 'Fri':
			t = "周五";
			break;
		case 'Sat':
			t = "周六";
			break;
		case 'Sun':
			t = "周日";
			break;
		default:
			break;
	}
	return t;
}