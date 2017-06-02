var ServiceAgent = AV.Object.extend("ServiceAgent");

/*
 * 返回
 */
function back() {
	history.go(-1);
}

/*
 * 按钮禁用与启用
 * 
 */
function subStart() {
	$(".subButton").attr("disabled", "disabled"); //按钮禁用
}

function subEnd() {
	$(".subButton").removeAttr("disabled"); //将按钮可用	
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
 * 时间转换函数 个位数加0
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
		return time.getFullYear() + '-' + (time.getMonth() + 1) + "-" + time.getDate() + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes()) + ":" + ToTime(time.getSeconds());
	} else {
		return " ";
	}
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


//显示队列列表 
function ShowCheckBoxs(className, typeName, id ,valueArray) {
	var html = '';
	var query = new AV.Query(className);
	query.equalTo("Enabled",true);
	query.find({
		success: function(results) {
			for(var i = 0; i < results.length; i++) {
				obj = results[i];
				var Name = obj.get(typeName);
				html += '<input type="checkbox" name="" id="" value="' + obj.id + '" />' + Name;
			}
			$("#" + id).html(html);
			if(valueArray){
				for (k in valueArray) {
					var temp = valueArray[k];
					$("#" + id + " input:checkbox[value="+temp+"]").prop("checked",true);
				}
			}
		}
	});
}


function ProImg() {
	$("#HeadPortrait").change(function() {
			var objUrl = getObjectURL(this.files[0]);
			if (objUrl) {
				$("#ImgPr").attr("src", objUrl);
			}
		})
		//建立一个可存取到该file的url

	function getObjectURL(file) {
		var url = null;
		if (window.createObjectURL != undefined) { // basic
			url = window.createObjectURL(file);
		} else if (window.URL != undefined) { // mozilla(firefox)
			url = window.URL.createObjectURL(file);
		} else if (window.webkitURL != undefined) { // webkit or chrome
			url = window.webkitURL.createObjectURL(file);
		}
		return url;
	}
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
function showNowPageResults(qu) {
	qu.limit(pageNumber);
	qu.skip(pageNumber * page);
	qu.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}