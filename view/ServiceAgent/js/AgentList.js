$(document).ready(function() {
	main();
	//searchAgentsStatu();//查询所有坐席状态；
});
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber =10;//翻页大小默认为10
var query = new AV.Query('ServiceAgent');
//主函数
function main() {
	query = new AV.Query('ServiceAgent');
	query.equalTo("Enabled", true);
	query.ascending('createdAt');
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

			var AgentID = '';
			if(obj.get("AgentID") != null) {
				AgentID = obj.get("AgentID");
			}
			var AgentName = '';
			if(obj.get("AgentName") != null) {
				AgentName = obj.get("AgentName");
			}

			var HeadPortrait = '../../images/ARSLogo.png';
			if(obj.get("HeadPortrait") != null) {
				HeadPortrait = obj.get("HeadPortrait").url();
			}
			var TelNo = '';
			if(obj.get("TelNo") != null) {
				TelNo = obj.get("TelNo");
			}
			var IsMonitor = '';
			if(obj.get("IsMonitor") != null) {
				IsMonitor = obj.get("IsMonitor")?"是":"否";
			}
			var QueueArray = []; //疾病数组
			var relation = obj.relation("WorkQueues")
			relation.query().find({
				success: function(result) {
					for(var j = 0; j < result.length; j++) {
						QueueArray.push(result[j].get('QueueName'));
					}
					htmlArray[i] = '<tr>' +
						'<td>' + "<img src='"+HeadPortrait+"' />" + '</td>' +
						'<td>' + AgentID + '</td>' +
						'<td>' + AgentName + '</td>' +
						'<td>' + TelNo + '</td>' +
						'<td>' + QueueArray.toString() + '</td>' +
						'<td>' + IsMonitor+ '</td>' +
						'<td><a href="EditAgent.html?id=' + Id + '">编辑</a>|<a href="javascript:del(\'' + Id + '\')"' + '>删除</a>' + '</td>' +
						'</tr>';
					count += 1;
					if(count == len) {
						for(var k = 0; k < len; k++) {
							html += htmlArray[k];
						}
						$("#table-body").html(html);
					}
				}
			});
		})(i);
	}
}

/*
 * 删除事件
 * 
 */
function del(id) {
	layer.confirm('是否确认删除该坐席？', {
		btn: ['确定', '取消'] //按钮
	}, function() {
		deleteAgent(id);
	});
}

/*
 * 
 * 删除坐席
 */
function deleteAgent(id) {
	var myObj = AV.Object.createWithoutData("ServiceAgent",id);
	myObj.set("Enabled",false);
	myObj.save().then(function(){
		layer.msg("删除成功",{
			time:600
		},function(){
			window.location.reload();
		})
	});
}

/*
 * 查询队列的上班情况
 */
function searchAgentsStatu(){
	var data = {
		'func': 'ivr',
		'funcdes': 'queryagentstate',
		'opernode': 'QueryAgentState'
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			console.log("坐席状态："+JSON.stringify(data));
			var data = data.Response.agents.agent;
			var len = data.length;
			for (var i=0;i<len;i++) {
				$("#console").append("<div>"+JSON.stringify(data[i])+"</div>")
			}
		},
		error: function(err) {
			// 处理调用失败
			console.log(err);
		}
	});
}