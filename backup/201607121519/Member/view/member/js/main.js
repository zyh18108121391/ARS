/*
 * 2016-2-21
 * 公共js定义部分
 */


var Member = AV.Object.extend("Member");
var EventType = AV.Object.extend("EventType");
var Hospital = AV.Object.extend("Hospital");
var ConsultingRoom = AV.Object.extend("ConsultingRoom");
var EventFiles = AV.Object.extend("EventFiles");
var EventsCalendar = AV.Object.extend("EventsCalendar");
var MedicalResult = AV.Object.extend("MedicalResult");
/*
 * 注销
 * 
 */
function logout() {
	if (confirm("确定要注销吗？")) {
		AV.User.logOut();
		window.location.reload();
	}
}
/**
 * 按钮禁用与启用
 * 
 */
function subStart() {
	$("#subButton").attr("disabled", "disabled"); //按钮禁用
	$("#subButton").css("background-color", "#808080");
}

function subEnd() {
	$("#subButton").removeAttr("disabled"); //将按钮可用	
	$("#subButton").css('background-color', 'rgb(66, 139, 202)');
}

/*
 * 时间装换函数
 * 
 * 
 * 
 */
function ToTime(time) {
	if (time >= 0 && time < 10) {
		time = "0" + time;
	}
	return time;
}

//获取url上传入的id
function geturl() {
	var url = location.search.substr(1);
	var gethref;
	if (url.length > 0) {
		var ar = url.split(/[&=]/);
		for (i = 0; i < ar.length; i += 2) {
			gethref = ar[i + 1];
		}
	}
	return gethref;
}
/*
 * 
 * 判断当前登陆的用户是否为管理员
 * 
 */
function isAdmin() {
	if (AV.User.current() == null) {
		return false;
	} else { //已登录
		var user = AV.User.current();
		var username = user.get("username");
		var index = $.inArray(username, ADMINS);
		if (index == -1) {
			return false;
		} else {
			return true;
		}
	}
}

/*
 * OnInput(event) 搜索框触发事件
 * 
 */
function OnInput(event) {
	$("#input_ul").html('');
	$(".search_results").css("display", "none");
	var value = event.target.value;
	var len = value.length;
	if (len != 0) {
		searchTicket(value);
	}
}
/*
 * 
 * searchTicket()
 * 输入框查询工单或文档函数
 * 
 */
function searchTicket(value) {
	var html = '';
	//在工单中查询
	var sql = "select * from Ticket where status= 2 and (title like \'%" + value + "%\' or content like \'%" + value + "%\')";
	AV.Query.doCloudQuery(sql, {
		success: function(result) {
			var object = result.results;
			len = object.length;
			if (len != 0) {
				for (var i = 0; i < len; i++) {
					var obj = object[i];
					var title = obj.get('title');
					var time = obj.createdAt;
					var ID = obj.id;
					html += "<li onclick=\'checkTicket(\"" + ID + "\")\'>" + title + "<small>" + timeToString(time) + "</small></li>";
				}
				//$("#input_ul").html(html);
			}
			//在自主文档中查询
			var sql2 = "select * from Document where question like \'%" + value + "%\' or answer like \'%" + value + "%\'";
			AV.Query.doCloudQuery(sql2, {
				success: function(result) {
					var object = result.results;
					len = object.length;
					if (len != 0) {
						for (var i = 0; i < len; i++) {
							var obj = object[i];
							var question = obj.get('question');
							var order = obj.get('order');
							var time = obj.createdAt;
							html += "<li onclick=\'checkDocument(\"" + order + "\")\'>" + question + "<small>" + timeToString(time) + "</small></li>";
						}

					}
					$("#input_ul").html(html);
					$(".search_results").css('display', 'block');
				},
				error: function(error) {
					//alert('error' + error.message);
				}
			});
		},
		error: function(error) {
			//alert('error' + error.message);
		}
	});
}

/*
 * 
 * 国际标准时间 转换为2016-01-01 15:50:00格式
 * 
 */
function timeToString(time) {
	if (time) {
		return time.getFullYear() + '-' + (time.getMonth() + 1) + "-" + time.getDate() + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes()) + ":" + ToTime(time.getSeconds());
	} else {
		return " ";
	}
}
/*
 * 
 * 国际标准时间 转换为2016-01-01格式
 * 
 */
function timeToStringShort(time) {
	if (time) {
		return time.getFullYear() + '-' + (time.getMonth() + 1) + "-" + time.getDate();
	} else {
		return " ";
	}
}
/*
 * checkTicket()
 * 搜索框下拉列表 点击工单 跳转到该工单页面
 */
function checkTicket(id) {
	window.location.href = "ticket.html?id=" + id;
}
/*
 * checkDocument()
 * 搜索框下拉列表 点击工单 跳转到该工单页面
 */
function checkDocument(order) {
	$(".search_results").css("display", "none");
	window.location.href = "help.html#" + order;
}
/*
 * 
 * 鼠标离开下拉类表 隐藏
 * 
 */
function hide() {
	$(".search_results").css("display", "none");
}

function show() {
	$(".search_results").css("display", "block");
}

//状态切换函数
function getStatus(status) {
	var statusString = "";
	switch (status) {
		case -999:
			statusString = "未完成";
			break;
		case -989:
			statusString = "会员未履约";
			break;
		case -979:
			statusString = "医生未履约";
			break;
		case -969:
			statusString = "重新协调中";
			break;
		case 1:
			statusString = "新建";
			break;
		case 11:
			statusString = "已确认";
			break;
		case 21:
			statusString = "已提醒";
			break;
		case 31:
			statusString = "已完成";
			break;
		default:
			statusString = "未知状态";
			break;
	}
	return statusString;
}

Date.prototype.format = function(format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
} ; /*改变时间格式*/
//---------本地显示上传 的图片----------------
function ProImg(){
	$("#Image").change(function(){
		var objUrl=getObjectURL(this.files[0]);
		if(objUrl){
		$("#ImgPr").attr("src",objUrl);
		}
	})
	//建立一个可存取到该file的url
	function getObjectURL(file) {
		var url = null ; 
		if (window.createObjectURL!=undefined) { // basic
			url = window.createObjectURL(file) ;
			} else if (window.URL!=undefined) { // mozilla(firefox)
				url = window.URL.createObjectURL(file) ;
			} else if (window.webkitURL!=undefined) { // webkit or chrome
				url = window.webkitURL.createObjectURL(file) ;
		}
		return url ;
	}
}
function changeDate(str) {
	var arr = str.split(/-/);
	return new Date(arr[0], arr[1] - 1, arr[2]);
}
