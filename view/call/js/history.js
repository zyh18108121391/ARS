var Doctor = AV.Object.extend("Doctor");
var AGENT; //客服
var COUNSELID;//当前拨号的咨询记录的id
var AgentID; //id
var CID;
var THIS; //当前拨打电话对应的dom对象
var RECORDID;//通话记录ID
var Pageflag = false;//记录是否弹出备注输入框 

var DoctorLisFirstLoad = true;
var DoctorNameListArray = [];
var DoctorNameListArrayPinYin = [];

$(document).ready(
	function() {
		var user = AV.User.current();
		var query = new AV.Query('ServiceAgent');
		query.equalTo('Account', user);
		query.first().then(function(result) {
			AGENT = result;
			AgentID = result.get("AgentID");
			HistoryMain('history');
			HistoryMain('agent');
		}, function(error) {
			layer.msg('查询错误', {
				shift: 6,
				time: 600
			})
		});
		EventBind();
		createNew(); //创建push对象
	}
);

function EventBind(){
	//绑定checkbox事件
	$("#check").click(function() {
		var bl = $(this).is(":checked");
		HistoryMain('agent',bl);
	});
}

//添加会员姓名搜索下拉
function addMemberHtml() {
	var htmlStr = '';
	console.log(DoctorNameListArray.toString());
	for(var i = 0; i < DoctorNameListArray.length; i++) {
		htmlStr += '<option value="' + DoctorNameListArray[i] + '"></option>';
		DoctorNameListArrayPinYin.push(codefans_net_CC2PY(DoctorNameListArray[i]).toLowerCase());
	}
	$('#DoctorList').html(htmlStr);
}
//添加姓名搜索事件
addELByMemberName();

function addELByMemberName() {
	var ulObj = $('.doctor_list_by_py');
	var nameInput = $('#DoctorName');

	nameInput.keyup(function() {
		var t = this.value;
		var liHtmlStr = '';
		if(t) {
			var r = new RegExp('^' + t, 'g');
			for(var i = 0; i < DoctorNameListArrayPinYin.length; i++) {
				if(r.test(DoctorNameListArrayPinYin[i])) {
					liHtmlStr += '<li>' + DoctorNameListArray[i] + '</li>';
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

// 请换成自己的 appId 和 appKey
var appId = 'to0nyg7vtky1bna4ybrclwrm3hm0r94oqw45eiost7mqrbi5';
var appKey = 'kbq185r1thmzpbod54og7ml9vll7pzmb5yegd2jyyfcw3qaa';
var push;

/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"AgentID":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","objectID":"57d903657db2a24eb1977d9f","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	if(data.agentid != AgentIDChange(AgentID)) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	var objectID = data.objectID; //agentconversation的id
	if(objectID) {
		RECORDID = objectID;//保存通话记录id
		BindCallRecordToCounsel(COUNSELID,objectID); //绑定改记录到当前咨询的relation中
	}
	var statu = data.agentstate;
	if(statu == 0) { //状态切换为0时执行
		//如果按钮已经是"拨打电话的情况 则不执行"
		var type = $(THIS).attr("date-type");
		if(type!='call'){
			changeCallBtn(THIS);
		}
		//如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
		if(RECORDID&&Pageflag){
			Pageflag=false;
			SetRecordMemo(RECORDID);
		}
	}
}




//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小
var queryA;//客服参与
var queryB;//自主咨询
var querySearch;//搜索
var searchFlag = false;
var NowPageType=1;//当前翻页是对应的哪个表，默认是第一个  就是咨询记录
/*
 * 
 * 显示所有历史咨询
 * @type：显示历史记录还是客服参与的咨询
 * @isMine:是否显示当前客服负责的咨询
 */
function HistoryMain(type,isMine) {
	var query = new AV.Query('Counsel');
	var memberID = geturl();
	var myMember = AV.Object.createWithoutData("Member", memberID);
	query.equalTo('Member', myMember);
	query.include('FollowAgent');
	query.include('Doctor');
	query.include('CounselType');
	query.descending("createdAt");

	if(type == 'agent') {
		query.exists('FollowAgent');
		if(isMine){
			query.equalTo("FollowAgent", AGENT);
		}
		queryA = query;
		showPages(queryA); //显示页数和总条数 在limit之前使用
	}else{
		queryB = query;
	}
	showNowPageResults(query,type);
}

/*
 * CounselClick
 * 切换显示栏目 table
 */
function CounselClick(type) {
	searchFlag = false;
	if(type == 'agent') {
		$(".addQueBtn1").addClass("check-active");
		$(".addQueBtn2").addClass("active2");
		$(".addQueBtn2").removeClass("check-active");
		$(".addQueBtn1").removeClass("active1");
		$("#askj-list-history").hide();
		$("#askj-list-service").show();
		$("#DoctorName").attr("search_type", "agent");
		$(".check-position").show();
		page = 0;
		NowPageType = 1;
		showPages(queryA); //显示页数和总条数 在limit之前使用
		showNowPageResults(queryA,type);
	} else {
		$(".addQueBtn2").addClass("check-active");
		$(".addQueBtn1").addClass("active1");
		$(".addQueBtn1").removeClass("check-active");
		$(".addQueBtn2").removeClass("active2");
		$("#askj-list-history").show();
		$("#askj-list-service").hide();
		$("#DoctorName").attr("search_type", "history");
		$(".check-position").hide();
		page = 0;
		NowPageType = 2;
		showPages(queryB); //显示页数和总条数 在limit之前使用
		showNowPageResults(queryB,type);
	}
}

/*
 * 
 * 查询函数
 */
function searchFunc(check) {
	searchFlag = true;
	var doctorName = $("#DoctorName").val();
	var type = $("#DoctorName").attr("search_type");
	querySearch = new AV.Query('Counsel');
	querySearch.include('Doctor');
	querySearch.include('Member');
	querySearch.include('CounselType');
	querySearch.include('FollowAgent');
	querySearch.descending("createdAt");
	if(type == 'agent') { //我的咨询 查询
		querySearch.exists('FollowAgent');
	}
	if(doctorName != '') { //有mermber 进行筛选
		var DoctorQuery = new AV.Query("Doctor");
		DoctorQuery.equalTo('DoctorName', doctorName);
		DoctorQuery.find({
			success: function(results) {
				var len = results.length;
				if(len) {
					var obj = results[0];
					querySearch.equalTo("Doctor", obj);
					showPages(querySearch); //显示页数和总条数 在limit之前使用
					querySearch.limit(pageNumber);
					querySearch.skip(pageNumber * page);
					querySearch.find({
						success: function(results) {
							if(results.length == 0) {
								layer.msg('没有查询到数据');
							} else {
								ShowObject(results, type);
							}
						}
					});
				} else {
					layer.msg('没有查询到数据');
				}

			}
		});

	} else { //直接显示所有记录 
		showPages(queryA); //显示页数和总条数 在limit之前使用
		showNowPageResults(querySearch,type);
	}

}

/*
 * 把query后的结果集输出到table中 
 * 便于公用
 * @type :区分是显示客服参与查询出来的results 还是所有历史记录查询出来的results
 */
function ShowObject(results, type) {
	var len = results.length;
	var htmlArray=[];
	if(type == 'history') {
		if(len==0)$("#table-body-history").html('<tr><td class="null-td" colspan="6">暂无记录</td></tr>');
	} else {
		if(len==0)$("#table-body-service").html('<tr><td class="null-td" colspan="7">暂无记录</td></tr>');
	}
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var Id = obj.id;

			var AgentName = '';
			if(obj.get("FollowAgent") != null) {
				AgentName = obj.get("FollowAgent").get("AgentName");
			}

			var DoctorName = '';
			if(obj.get("Doctor") != null) {
				DoctorName = obj.get("Doctor").get("DoctorName");
				if(type == 'history') {
					if(jQuery.inArray(DoctorName, DoctorNameListArray) == -1) DoctorNameListArray.push(DoctorName);
				}
			}

			var TellNo = '';
			if(obj.get("Doctor") != null) {
				TellNo = obj.get("Doctor").get("MobilePhoneNo");
			}
			var TypeName = '';
			if(obj.get("CounselType") != null) {
				TypeName = obj.get("CounselType").get("TypeName");
			}
			var CounselContent = '';
			if(obj.get("CounselContent") != null) {
				CounselContent = obj.get("CounselContent");
			}

			//咨询建立的时间
			var CreatedTime = obj.createdAt;
			var LastUpdateTime = new Date();
			if(obj.get("LastUpdateTime") != null) {
				LastUpdateTime = obj.get("LastUpdateTime");
			}
			var Posts = obj.relation('Posts');
			var P_query = Posts.query();
			P_query.descending("createdAt");
			P_query.first({
				success: function(res) {
					var content = '暂无回复';
					if(res) {
						if(res.get("MemberPost") == null) {
							content = res.get("DoctorPost");
						} else {
							content = res.get("MemberPost");
						}
						if(!content) content = '[图片]';
					}
					count += 1;
					if(type == "history") {
						htmlArray[i]= "<tr>" + '<td>' + DoctorName + '</td>' + '<td>' + TypeName + '</td>' + '<td class="td-content">' + CounselContent + '</td>' + '<td class="td-content">' + content + '</td>' + '<td>' + chageTime(CreatedTime) + '</td>' 
						+'<td class="td-time">' + timeToString(CreatedTime) + '</td>'
               			+'<td class="td-time">' + timeToString(LastUpdateTime) + '</td>'
						+ '<td><a href=\"../Counsel/advisoryDetail.html?id=' + Id + '\">详情</a></td>' + '</tr>';
					} else {
						htmlArray[i]= "<tr>" + '<td>' + DoctorName + '</td>' + '<td>' + AgentName + '</td>' + '<td>' + TypeName + '</td>' + '<td class="td-content">' + CounselContent + '</td>' + '<td class="td-content">' + content + '</td>' + '<td>' + chageTime(CreatedTime) + '</td>' +
							'<td class="td-time">' + timeToString(CreatedTime) + '</td>'
               				+'<td class="td-time">' + timeToString(LastUpdateTime) + '</td>'
							+'<td><a href=\"../Counsel/advisoryDetail.html?id=' + Id + '\">详情</a><span class="btn btn-primary list-btn" date-type="call" name="' + TellNo + '" onclick="call(this,\''+Id+'\')">拨打电话</span></td>' +
							'</tr>';
					}
					if(count == len) {
						var html='';
						for(var k = 0; k < len; k++) {
							html += htmlArray[k];
						}
						if(type == 'history') {
							if(DoctorLisFirstLoad) {
								addMemberHtml();
								DoctorLisFirstLoad = false;
							}
							$("#table-body-history").html(html);
						} else {
							$("#table-body-service").html(html);
						}
					}
				}
			});
		})(i);
	}
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
	if(NowPageType == 1){
		if(searchFlag){
			showNowPageResults(querySearch,'agent');
		}else{
			showNowPageResults(queryA,'agent');
		}
		
	}else if(NowPageType ==2){
		if(searchFlag){
			showNowPageResults(querySearch,'history');
		}else{
			showNowPageResults(queryB,'history');
		}
	}
	
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
function showNowPageResults(qu,type) {
	qu.limit(pageNumber);
	qu.skip(pageNumber * page);
	qu.find({
		success: function(results) {
			ShowObject(results,type);
		}
	});
}