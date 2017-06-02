//会员搜索 模块
var pageMemberLisFirstLoad = true;
var pageMemberListMemberName = [];
var pageMemberListMemberNamePinYin = [];

var AgentID, AGETN;
$(document).ready(function() {
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				AGETN = cus;
				AgentID = parseInt(cus.get("AgentID")) + 1000;
				var obj = urlStrToObj(window.location.href);
				showRecordWithOpts(obj);
				recoverSearchInput(obj);
			}
		});
	}
});

//添加会员姓名搜索下拉
function addMemberHtml() {
	var htmlStr = '';
	for(var i = 0; i < pageMemberListMemberName.length; i++) {
		htmlStr += '<option value="' + pageMemberListMemberName[i] + '"></option>';
		pageMemberListMemberNamePinYin.push(codefans_net_CC2PY(pageMemberListMemberName[i]).toLowerCase());
	}
	$('#memberList').html(htmlStr);
}
//添加姓名搜索事件
addELByMemberName();

function addELByMemberName() {
	var ulObj = $('.member_list_by_py');
	var nameInput = $('#memberName');

	nameInput.keyup(function() {
		var t = this.value;
		var liHtmlStr = '';
		if(t) {
			var r = new RegExp('^' + t, 'g');
			for(var i = 0; i < pageMemberListMemberNamePinYin.length; i++) {
				if(r.test(pageMemberListMemberNamePinYin[i])) {
					liHtmlStr += '<li>' + pageMemberListMemberName[i] + '</li>';
				}
			}
			ulObj.html(liHtmlStr).show();
		} else {
			ulObj.html('').hide();
		}
	});

	ulObj.on('click', 'li', function() {
		var t = this.innerHTML;
		ulObj.hide();
		nameInput.val(t);
	});
}
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var query = new AV.Query('AgentConversationRecord');
//主函数
function showRecord(opts) {
	query = new AV.Query('AgentConversationRecord');
	query.include("Member");
	query.include("Doctor");
	query.include("Agent");
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
}
/*
 * 
 * 查询函数
 * 
 */
function search() {
	var opts={};
	page = 0;//每次搜索页数初始化
	
	query = new AV.Query('AgentConversationRecord');
	var timeStart = $("#timeStart").val();
	var timeEnd = $("#timeEnd").val();
	var name = $("#memberName").val();
	var Direction = $("#Direction option:selected").val();

	if(timeStart) opts.timeStart = timeStart;
	if(timeEnd) opts.timeEnd = timeEnd;
	if(Direction) opts.Direction = Direction;
	if(name) opts.name = name;
	showRecordWithOpts(opts);
}
function showRecordWithOpts(opts) {
	query = new AV.Query('AgentConversationRecord');
	if(opts.page)page = parseInt(opts.page);

	if(opts.timeStart) {
		var t_s = new Date(opts.timeStart);
		t_s.setHours(0);
		query.greaterThanOrEqualTo("createdAt", t_s);
	}
	if(opts.timeEnd) {
		var t_e = new Date(opts.timeEnd);
		t_e.setDate(t_e.getDate()+1);
		query.lessThan("createdAt", t_e);
	}
	if(t_s>t_e){
		layer.msg('开始时间不能大于结束时间');
		return;
	}
	if(opts.Direction==0||opts.Direction==1) query.equalTo("Direction", parseInt(opts.Direction));
	query.include("Member");
	query.include("Doctor");
	query.include("Agent");
	query.descending('createdAt');

	if(opts.name) { //姓名查询
		if(opts.name=='普通用户'){
			layer.msg('普通用户无法正常查询，请输入正确的姓名');
			return;
		}
		var que = new AV.Query("Member");
		que.equalTo("MemberName", opts.name);
		que.find({
			success: function(results) {
				var len = results.length;
				if(len) {
					var t ='historyRecord.html?' + parseParam(opts);
					if(t.indexOf('?&')!=-1) t = t.replace('&','');
					history.replaceState({}, '', t);
					var obj = results[0];
					query.equalTo("Member", obj);
					showPages(query); //显示页数和总条数 在limit之前使用
					showNowPageResults(query);//显示当前页数据
				} else {
					layer.msg('没有查询到相关信息', {
						shift: 6,
						time: 600
					});
				}
			}
		});
	} else {
		query.count().then(function (count) {
			if(count){
				var t ='historyRecord.html?' + parseParam(opts);
				if(t.indexOf('?&')!=-1) t = t.replace('&','');
				history.replaceState({}, '', t);
			}
		});
		showPages(query); //显示页数和总条数 在limit之前使用
		showNowPageResults(query);//显示当前页数据
	}
}
/********************翻页********************/
/*
 * 翻页函数
 */
function pageChange(tag) {
	if(tag == "nextpage") {
		page++;
		if(page * 10 >= maincount) {
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
function showPages(query) {
	query.count({
		success: function(count) {
			maincount = count;
			totlePage = Math.ceil(maincount / 10); //向上取整 获取总页数
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
	qu.limit(10);
	qu.skip(10 * page);
	qu.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}
/*
 * 播放录音文件
 */
function play(th) {
	$(".audio-div").show();
	var top = $(th).position().top;
	var left = $(th).position().left;
	var w = $(th).width();
	$(".audio-div").css({
		top: (top - 10) + "px",
		left: (left + w + 30) + "px"
	})
	var audioUrl = $(th).attr("data");
	$("#audio").attr("src", audioUrl);
	/*var aud = document.getElementById("audio");
	aud.reload();*/
}

/*
 * 
 * 关闭播放窗口
 */
function closeBtn() {
	$(".audio-div").hide();
	$("#audio").attr("src", "");
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
	var pg = getUrlParam('page');
	if (page != pg) {//翻页操作 则urlpage随之变化
		var url = window.location.href;
		if (url.indexOf('page') == -1) {
			if (url.indexOf('?') == -1) {
				history.replaceState({}, '', url + '?page=' + page);
			} else {
				history.replaceState({}, '', url + '&page=' + page);
			}
		} else {
			history.replaceState({}, '', url.replace('page=' + pg, 'page=' + page));
		}
	}
	var t = window.location.href;
	if(t.indexOf('?&')!=-1)t = t.replace('&','');
	history.replaceState({}, '', t);

	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var Id = obj.id;
			var Name = '';
			var telNo = '';
			if(obj.get("Member") != null) {
				Name = obj.get("Member").get("MemberName");
				if(jQuery.inArray(Name, pageMemberListMemberName) == -1) pageMemberListMemberName.push(Name);
				Name += '【会员】';
			} else if(obj.get("Doctor") != null) {
				Name = obj.get("Doctor").get("DoctorName");
				if(jQuery.inArray(Name, pageMemberListMemberName) == -1) pageMemberListMemberName.push(Name);
				Name += '【医生】';
			} else {
				Name = '陌生客户';
				telNo = obj.get("ToTelNo");
			}
			var AgentName = '';
			if(obj.get("Agent") != null) {
				AgentName = obj.get("Agent").get("AgentName");
				var AgentID = obj.get("Agent").get("AgentID");
			}
			var Direction = '';
			
			if(obj.get("Direction") != null) {
				var D =  obj.get("Direction");
				if(D==0){
					Direction = '呼入';
				}else if(D==1){
					Direction = '呼出';
				}else{
					Direction = '未知';
				}
			}
			
			var AlertingTime = '';
			if(obj.get("AlertingTime") != null) {
				AlertingTime = obj.get("AlertingTime");
			}

			var Duration = '0';
			if(obj.get("Duration") != null) {
				Duration = obj.get("Duration");
			}
			
			var RecordFile = '';
			var RecordFileURL = '';
			if(obj.get("RecordFile") != null) {
				RecordFileURL = obj.get("RecordFile").url();
				RecordFile = '点击播放';
			}

			var Memo = '';
			if(obj.get("Memo") != null) {
				Memo = obj.get("Memo");
			}

			var ConversationBeginTime = '';
			if(obj.get("ConversationBeginTime") != null) {
				ConversationBeginTime = obj.get("ConversationBeginTime");
			}

			var ConversationEndTime = '';
			if(obj.get("ConversationEndTime") != null) {
				ConversationEndTime = obj.get("ConversationEndTime");
			}

			var Satisfaction = '';
			if(obj.get("Satisfaction") != null) {
				Satisfaction = obj.get("Satisfaction");
			}
			var creatTime = obj.createdAt;
			if(telNo){
				var strName = Name+"/"+telNo;
			}else{
				var strName  = Name;
			}
			htmlArray[i] = '<tr>' +
				'<td>' + strName + '</td>' +
				'<td>' + AgentName + "/" + AgentID + '</td>' +
				'<td>' + Direction + '</td>' +
				'<td>' + alertingTimeChange(Duration) + '</td>' +
				'<td>' + '<span class="auto-text" data="' + RecordFileURL + '" onclick="play(this)">' + RecordFile + '</span>' + '</td>' +
				'<td>' + Memo + '</td>' +
				'<td>' + timeToString(creatTime) + '</td>' +
				'<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' +
				'<td><a href="historyDetail.html?id=' + Id + '">详情</a>' +
				'</tr>';
			count += 1;
			if(count == len) {
				for(var k = 0; k < len; k++) {
					html += htmlArray[k];
				}
				$("#table-body").html(html);

				//显示会员到 搜索框ul中
				if(pageMemberLisFirstLoad) {
					addMemberHtml();
					pageMemberLisFirstLoad = false;
				}
			}
		})(i);
	}
}
//更据满意度 生成html代码 --个人中心
function getStartlevalDivPersonal(leval) {
	if(leval == 0) {
		return '';
	}
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
/**
 * 根据据url参数 恢复搜索框填入的内容
 * @param opts
 * {Belong:"all" ,HospitalID:"all",level:"576bd57c128fe1005a14e1e3",memberName:"123",page:"0",rep:"all",telNo:"18108121391"}
 */
function recoverSearchInput(opts) {
	if (opts.name) {
		$("#memberName").val(opts.name);
	}
	if (opts.Direction) {
		$("#Direction").val(opts.Direction);
	}
	if (opts.level) {
		$("#level").val(opts.level);
	}
	if (opts.timeStart) {
		$("#timeStart").val(opts.timeStart);
	}
	if (opts.timeEnd) {
		$("#timeEnd").val(opts.timeEnd);
	}
}
/**
 * json数据转换为url参数  eg:a=1&b=2
 * @param param
 * @param key
 * @returns {string}
 */
var parseParam = function (param, key) {
	var paramStr = "";
	if (param instanceof String || param instanceof Number || param instanceof Boolean) {
		paramStr += "&" + key + "=" + encodeURIComponent(param);
	} else {
		$.each(param, function (i) {
			var k = key == null ? i : key + (param instanceof Array ? "[" + i + "]" : "." + i);
			paramStr += '&' + parseParam(this, k);
		});
	}
	return paramStr.substr(1);
};
/**
 * url参数转json
 * @param url
 * @returns {{}}
 */
function urlStrToObj(url) {
	var url = decodeURI(url);
	var obj={};
	var keyvalue=[];
	var key="",value="";
	if(url.indexOf('?')==-1){
		return obj;
	}
	var paraString=url.substring(url.indexOf("?")+1,url.length).split("&");
	for(var i in paraString)
	{
		keyvalue=paraString[i].split("=");
		key=keyvalue[0];
		value=keyvalue[1];
		obj[key]=value;
	}
	return obj;
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