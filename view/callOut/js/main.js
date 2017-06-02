var Member = AV.Object.extend("Member");
var ComplainWorkOrder = AV.Object.extend("ComplainWorkOrder");
var MedicalResult = AV.Object.extend("MedicalResult");
var AgentConversationRecord = AV.Object.extend("AgentConversationRecord");
var ServiceQueue = AV.Object.extend("ServiceQueue");
var Counsel = AV.Object.extend("Counsel");

/*
 * 
 * 国际标准时间 转换为2016-01-01格式
 * 
 */
function timeToStringShort(time) {
	if(time) {
		return time.getFullYear() + '-' + (time.getMonth() + 1) + "-" + time.getDate();
	} else {
		return " ";
	}
}
/*
 * 
 * 获取url参数
 */
function getUrlParam(name) {
	//构造一个含有目标参数的正则表达式对象  
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	//匹配目标参数  
	var r = window.location.search.substr(1).match(reg);
	//返回参数值  
	if(r != null) return unescape(r[2]);
	return null;
}
/*
 * 时间转换函数
 * 
 * 
 * 
 */
function ToTime(time) {
	if(time >= 0 && time < 10) {
		time = "0" + time;
	}
	return time;
}
/*
 * 
 * 国际标准时间 转换为2016-01-01 15:30:00格式
 * 
 */
function timeToString(time) {
	if(time) {
		return time.getFullYear() + '-' + ToTime((time.getMonth() + 1)) + "-" + ToTime(time.getDate()) + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes()) + ":" + ToTime(time.getSeconds());
	} else {
		return " ";
	}
}


/*
 * 按钮禁用与启用
 * 
 */
function subStart() {
	$("#subButton").attr("disabled", "disabled"); //按钮禁用
	$("#subButton").css("background-color", "#808080");
	$("#subButton").css("border-color", "#808080");
}

function subEnd() {
	$("#subButton").removeAttr("disabled"); //将按钮可用	
	$("#subButton").css('background-color', '#D9534F');
	$("#subButton").css("border-color", "#D9534F");
}

//获取url上传入的id
function geturl() {
	var url = location.search.substr(1);
	var gethref;
	if(url.length > 0) {
		var ar = url.split(/[&=]/);
		for(i = 0; i < ar.length; i += 2) {
			gethref = ar[i + 1];
		}
	}
	return gethref;
}
//生成星级html
function getStartlevalDivPersonal(leval) {
	if(leval == null) leval = 5;
	var temp = (leval * 10) % 10; //判断是否有半颗心
	var lev2 = leval;
	var lev1_html = ''; //保存半颗心的html
	var len_0 = null; //保存零星的数量
	if(temp) {
		lev2 = Math.floor(leval);
		lev1_html = "<div class='p-1'></div>";
		len_0 = 5 - lev2 - 1;
	} else {
		len_0 = 5 - lev2;
	}
	var html = '';
	for(var i = 0; i < lev2; i++) {
		html += "<div class='p-2'></div>";
	}
	html += lev1_html;
	for(var j = 0; j < len_0; j++) {
		html += "<div class='p-0'></div>";
	}
	return html;
}

/*
 * 关闭来电弹窗  之前需要先保存来电信息备注
 */
function closeWindow() {
	var Memo = $("#Memo").val();
	if(Memo == '') {
		layer.msg('请输入通话备注', {
			time: 600
		})
		return;
	}
	var id = $("#QueueName").attr("data");
	var query = new AV.Query("AgentConversationRecord");
	query.get(id, {
		success: function(result) {
			result.set("Memo", Memo);
			result.save(null, {
				success: function(result) {
					layer.msg('保存成功,跳转到等待页面中...', {
						time: 1000
					}, function() {
						window.location.href = "CallIndex.html";
					});
				}
			});
		}
	});
}

/*
 * 关闭来电弹窗  之前需要先保存来电信息备注并且切换当前客服状态为：准备就绪
 */
function closeWindowAndSave() {
	subStart();
	var Memo = $("#Memo").val();
	if(Memo == '') {
		layer.msg('请输入通话备注', {
			time: 600
		})
		return;
	}
	var id = $("#QueueName").attr("data");
	var query = new AV.Query("AgentConversationRecord");
	query.get(id, {
		success: function(result) {
			result.set("Memo", Memo);
			result.save().then(function() {
				//改变客服状态为就绪
				var user = AV.User.current();
				var query = new AV.Query('ServiceAgent');
				query.equalTo('Account', user);
				query.first().then(function(result) {
					//保存到全局变量 方便后面调用云函数改变状态等
					var AgentID = result.get("AgentID");
					var relation = result.relation("WorkQueues");
					changStatuByCloud(AgentIDChange(AgentID), relation, true);
				});
			});
		}
	});
}

/*
 * 
 * 调用云函数改变状态
 * statu：调用后的状态false true
 */
function changStatuByCloud(AgentID, relation, statu) {
	var query = relation.query();
	query.find({
		success: function(work) {
			var len = work.length;
			for(var j = 0; j < len; j++) {
				var obj = work[j];
				var qID = obj.get("QueueID");
				funca(AgentID, qID, statu, len);
			}
		}
	});
	var count = 0;

	function funca(AgentID, qID, statu, len) {
		var data = {
			'func': 'ivr',
			'funcdes': 'agentready',
			'opernode': 'AgentReady',
			'operparam': {
				'agentid': AgentID,
				'agenttype': qID,
				'state': statu,
				'priority': 'false'
			}
		}
		AV.Cloud.run('RLCallIvrApi', data, {
			success: function(data) {
				// 调用成功，得到成功的应答data
				count += 1;
				if(count == len) {
					subEnd();
					layer.msg('保存成功,跳转到等待页面中...', {
						time: 1000
					}, function() {
						window.location.href = "CallIndex.html";
					});
				}
			},
			error: function(err) {
				subEnd();
				// 处理调用失败
				console.log(err.code);
				if(err.code == 1) {
					window.location.href = "CallIndex.html";
				} else {
					/*layer.msg('操作失败，请联系管理员'+err.message, {
					});*/
				}
			}
		});

	}

}

/*
 * 
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
	return id + 1000;
}

/*
 * 秒数转换为 几分分 几秒
 * 
 */
function alertingTimeChange(time) {
	var m = parseInt(time / 60);
	var t = time % 60;
	return m + " 分 " + t + " 秒";
}

/*
 * 返回
 */
function back() {
	window.history.back(-1);
}

//更据时间戳 算出离现在时间的差  用文字体现
function chageTime(time) {
	var nowDate = new Date(); //开始时间
	var date3 = nowDate.getTime() - time.getTime(); //时间差的毫秒数
	//计算出相差天数
	var days = Math.floor(date3 / (24 * 3600 * 1000));
	//计算出小时数
	var leave1 = date3 % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
	var hours = Math.floor(leave1 / (3600 * 1000));
	var th = 24 - (hours + 24 * days);
	if(th < 0) {
		return 0;
	} else {
		return th;
	}
}

/*
 * 禁用除弹出窗口的其他div
 * 
 * 
 */
function jy(num) {
	var window_width = $(document).width();
	var window_height = $(document).height();
	$(".jy").css("display", "block");
	$(".jy").css("width", window_width);
	$(".jy").css("height", window_height);
	$(".jy").fadeTo("fast", num);
}

/*
 * 
 * 加载中弹出层 开始
 */
var layerStart = null;

function locadStart() {
	layerStart = layer.load(2, {
		time: 10 * 1000
	}); //又换了种风格，并且设定最长等待10秒
}

/*
 * 
 * 加载中弹出层 结束
 */
function locadEnd() {
	layer.close(layerStart);
}

/****************翻页********************/
/*
 * 全局变量     page query
 * 调用函数    ShowObject(results);
 * pageNumber：翻页大小
 */
/*
 * 翻也主函数
 */
function pageChange(tag) {
	if(tag == "nextpage") {
		page++;
		if(page * pageNumber >= maincount) {
			layer.msg("没有了", {
				shift: 6,
				time: 600
			});
			page--;
			return false;
		}
	}
	if(tag == "pastpage") {
		if(page > 0) {
			page--;
		} else {
			layer.msg("没有了", {
				shift: 6,
				time: 600
			});
			return false;
		}
	}
	if(tag == "index") {
		page = 0;
	}
	if(tag == "end") {
		page = totlePage - 1;
	}
	$("#now").text(page + 1); //显示当前页数
	showNowPageResults(query, 'memberList');
}
/*
 * 显示页数和总数
 * 
 */
function showPages(qu) {
	qu.count({
		success: function(count) {
			maincount = count;
			totlePage = Math.ceil(maincount / pageNumber); //向上取整 获取总页数
			$("#maincount").text(maincount);
			$("#totle").text(totlePage); //显示总页数
			$("#now").text(page + 1); //显示当前页数
		}
	});
}
/*
 * 显示当前页数据
 * 
 */
function showNowPageResults(qu, pageName) {
	qu.limit(pageNumber);
	qu.skip(pageNumber * page);
	qu.find({
		success: function(results) {
			ShowObject(results, pageName);
		}
	});
}

/*
 * 打开知识库div
 */
function openWiki() {
	var window_height = $(window).height(); //当前窗口的宽高
	var window_width = $(window).width();

	$(".wiki-div").css("left", window_width * 0.1 + "px");
	$(".wiki-div").css("top", window_height * 0.08 + "px");
	jy(0.8);
	$(".wiki-div").css("display", "block");
}
/*
 * 关闭wikidiv
 */
function closeWiki() {
	$(".jy").css("display", "none");
	$(".wiki-div").css("display", "none");
}

