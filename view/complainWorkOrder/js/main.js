
var Member = AV.Object.extend("Member");
var MedicalResult = AV.Object.extend("MedicalResult");
var SaleWorkOrder = AV.Object.extend("SaleWorkOrder");
var Disease = AV.Object.extend("Disease");
var ComplainLevel = AV.Object.extend("ComplainLevel");
var Doctor = AV.Object.extend("Doctor");
var ServiceAgent = AV.Object.extend("ServiceAgent");
var Butler = AV.Object.extend("Butler");
var ComplainWorkOrder = AV.Object.extend("ComplainWorkOrder");


/*
 * 
 * 国际标准时间 转换为2016-01-01格式
 * 
 */
function timeToStringShort(time) {
	if (time) {
		return time.getFullYear() + '-' + ToTime((time.getMonth() + 1)) + "-" + ToTime(time.getDate());
	} else {
		return " ";
	}
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
/*
 * 
 * 国际标准时间 转换为2016-01-01 15:30:00格式
 * 
 */
function timeToString(time) {
	if (time) {
		return time.getFullYear() + '-' + ToTime((time.getMonth() + 1)) + "-" + ToTime(time.getDate()) + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes()) + ":" + ToTime(time.getSeconds());
	} else {
		return " ";
	}
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
/*
 * 按钮禁用与启用
 * 
 */
function subStart() {
	$(".subButton").attr("disabled", "disabled"); //按钮禁用
	$(".subButton").css("background-color", "#808080");
}
function subEnd() {
	$(".subButton").removeAttr("disabled"); //将按钮可用	
	$(".subButton").css('background-color', '#D9534F');
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

//更据经理星数 生成html代码 --个人中心
function getStartlevalDivPersonal(leval) {
	if (leval == null) leval = 5;
	var temp = (leval * 10) % 10; //判断是否有半颗心
	var lev2 = leval;
	var lev1_html = ''; //保存半颗心的html
	var len_0=null; //保存零星的数量
	if (temp) {
		lev2 = Math.floor(leval);
		lev1_html = "<div class='p-1'></div>";
		len_0=5-lev2-1;
	}else{
		len_0=5-lev2;
	}
	var html = '';
	for (var i = 0; i < lev2; i++) {
		html += "<div class='p-2'></div>";
	}
	html += lev1_html;
	for (var j = 0; j < len_0; j++) {
		html += "<div class='p-0'></div>";
	}
	return html;
}
/*
 * 
 * 状态装换为中文
 * 
 */
function statuToString(statu){
	var  str;
	switch (statu){
		case 1:
			str = '新建';
			break;
		case 2:
			str = '已流转';
			break;
		case 3:
			str = '已分派销售员';
			break;
		case 4:
			str = '销售员已处理完毕';
			break;
		case 5:
			str = '已回访';
			break;
		default:
			break;
	}
	return str;
}

/*
 * 
 * 状态装换为中文 complain模块
 * 
 */
function CompStatuToString(statu){
	var  str;
	switch (statu){
		case 1:
			str = '新建';
			break;
		case 2:
			str = '已转接';
			break;
		case 3:
			str = '已处理';
			break;
		case 4:
			str = '已回访';
			break;
		default:
			break;
	}
	return str;
}

function back(){
	history.go(-1);
}


//显示疾病列表 
function ShowCheckBoxs(className, typeName, id) {
	//载入疾病checkbox
	var html = '';
	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			for(var i = 0; i < results.length; i++) {
				if(i == 0 || (i % 2) == 0) {
					html += "<tr>"
				}
				obj = results[i];
				var Name = obj.get(typeName);
				html += '<td><input type="checkbox" name="" id="" value="' + obj.id + '" />' + Name + '</td>';
				if((i % 2) != 0) {
					html += "</tr>";
				}
			}
			$("#" + id).html(html);
		}
	});
}

//显示疾病列表 并选择默认值
function ShowCheckBoxsAndChecked(className, typeName, id , dieaseIDArray) {
	//载入疾病checkbox
	var html = '';
	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			for(var i = 0; i < results.length; i++) {
				if(i == 0 || (i % 2) == 0) {
					html += "<tr>"
				}
				obj = results[i];
				var Name = obj.get(typeName);
				html += '<td><input type="checkbox" name="1" id="" value="' + obj.id + '" />' + Name + '</td>';
				if((i % 2) != 0) {
					html += "</tr>";
				}
			}
			$("#" + id).html(html);
			var  len=dieaseIDArray.length;
			for (var i= 0; i< len; i++) {
				var t=dieaseIDArray[i];
				$(":checkbox[value='" + t + "']").prop("checked", true);
			}
		}
	});
}
/*
 * 投诉人类型 转换
 * 
 */
function ResTypeStatuToStr(statu){
	var  str;
	switch (statu){
		case 1:
			str = '医生';
			break;
		case 2:
			str = '会员管家';
			break;
		case 3:
			str = '客服';
			break;
		default:
			break;
	}
	return str;
}
/*
 * 
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
	return id + 1000;
}
/****************翻页********************/
/*
 * 全局变量     page query
 * 调用函数    ShowObject(results);
 * pageNumber:翻页大小默认为10
 */
/*
 * 翻页函数
 */
function pageChange(tag) {
	if(tag == "nextpage") {
		page++;
		if(page * pageNumber >= maincount) {
			layer.msg("没有了",{
				shift:6,
				time:600
			});
			page--;
			return false;
		}
	}
	if(tag == "pastpage") {
		if(page > 0) {
			page--;
		} else {
			layer.msg("没有了",{
				shift:6,
				time:600
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
	showNowPageResults(query);//显示当前页数据
}
/*
 * 显示页数和总数
 * 
 */
function showPages(query,search) {
	query.count({
		success: function(count) {
			if(search){
				if(count==0){
					layer.msg('没有查询到数据');
				}
			}
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
function showNowPageResults(qu) {
	qu.limit(pageNumber);
	qu.skip(pageNumber * page);
	qu.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}