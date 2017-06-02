//会员搜索 模块
var pageMemberLisFirstLoad = true;
var pageMemberListMemberName = [];
var pageMemberListMemberNamePinYin = [];

var AGETN;
$(document).ready(function() {
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				AGETN = cus;
				main();
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
//主函数
function main() {
	var query = new AV.Query('AgentConversationRecord');
	query.include("Member");
	query.include("Agent");
	query.descending('createdAt');
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}

/*
 * 
 * 查询函数
 * 
 */
function search() {
	var query = new AV.Query('AgentConversationRecord');
	var timeStart = $("#timeStart").val();
	var timeEnd = $("#timeEnd").val();
	var name = $("#memberName").val();
	if(timeStart) {
		var t_s = new Date(timeStart);
		t_s.setHours(0);
		query.greaterThanOrEqualTo("ConversationBeginTime", t_s);
	}
	if(timeEnd) {
		var t_e = new Date(timeEnd);
		t_e.setHours(23);
		query.lessThanOrEqualTo("ConversationBeginTime", t_e);
	}
	query.include("Member");
	query.include("Agent");
	query.descending('createdAt');

	if(name) { //姓名查询
		var que = new AV.Query("Member");
		que.equalTo("MemberName", name);
		que.find({
			success: function(results) {
				var len = results.length;
				if(len) {
					var obj = results[0];
					query.equalTo("Member", obj);
					query.find({
						success: function(results) {
							ShowObject(results);
						}
					});
				}else{
					layer.msg('没有查询到相关信息', {
						shift: 6,
						time: 600
					});
				}
			}
		});
	} else {
		query.find({
			success: function(results) {
				ShowObject(results);
			}
		});
	}
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

			var MemberName = '';
			if(obj.get("Member") != null) {
				MemberName = obj.get("Member").get("MemberName");
				if(jQuery.inArray(MemberName, pageMemberListMemberName) == -1) pageMemberListMemberName.push(MemberName);
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
			var RecordFileURL = '' ;
			if(obj.get("RecordFile") != null) {
				RecordFileURL = obj.get("RecordFile").url();
				var leng = RecordFileURL.length;
				RecordFile = RecordFileURL.substring(leng-28,leng);
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
			var creatTime = obj.createdAt;
			htmlArray[i] = '<tr>' +
				'<td>' + MemberName + '</td>' +
				'<td>' + alertingTimeChange(AlertingTime) + '</td>' +
				'<td>' + alertingTimeChange(Duration)  + '</td>' +
				'<td>' + '<span class="auto-text" data="'+RecordFileURL+'" onclick="play(this)">'+RecordFile+'</span>'+ '</td>' +
				'<td>' + Memo + '</td>' +
				'<td>' + timeToString(creatTime) + '</td>' +
				'<td><a href="RecordDetail.html?id=' + Id + '">详情</a>' +
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
function closeBtn(){
	$(".audio-div").hide();
	$("#audio").attr("src", "");
}
