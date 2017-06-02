/*
 * 会员搜索JS by zhengyinhua 2016-9-28
 * 输入会员电话或姓名 查询各种订单记录  
 */
$(document).ready(function() {
	BindEvent()
});

function BindEvent(){
	$(".check-h1 .CounselSpan").click(function(){
		$(".table-list").hide();
		$("#Counsel-table").show();
		$(this).addClass('s-active');
		$(".check-h1 .complainSpan").removeClass('s-active');
		$(".check-h1 .OrderSpan").removeClass('s-active');
		page = 0;  //页数初始化为0
		showPages(queryA); //显示页数和总条数 在limit之前使用
   		showNowPageResults(queryA,'1');
		NowPageType = 1;//改变当前翻页的表
	});
	$(".check-h1 .complainSpan").click(function(){
		$(".table-list").hide();
		$("#complain-table").show();
		$(this).addClass('s-active');
		$(".check-h1 .CounselSpan").removeClass('s-active');
		$(".check-h1 .OrderSpan").removeClass('s-active');
		page = 0;
		showPages(queryB); //显示页数和总条数 在limit之前使用
   		showNowPageResults(queryB,'2');
   		NowPageType = 2;
	});
	$(".check-h1 .OrderSpan").click(function(){
		$(".table-list").hide();
		$("#order-table").show();
		$(this).addClass('s-active');
		$(".check-h1 .CounselSpan").removeClass('s-active');
		$(".check-h1 .complainSpan").removeClass('s-active');
		page = 0;
		showPages(queryC); //显示页数和总条数 在limit之前使用
   		showNowPageResults(queryC,'3');
   		NowPageType = 3; 
	});
}
//隐藏搜索栏
function hidenSerchMenu(){
	$(".s-head-div").animate({
		top:'-80px'
	},600,function(){
		$(".s-head-hide").show();
	});
}
  /*
   * 
   * 隐藏或者显示搜索menu
   */
function showOrHidenMenu(){
	var t = $(".s-head-div").css('top');
	if(t=='-80px'){
		$(".shade").show();
		$(".s-head-hide").addClass('transform');
		var lo = '0px';
	}else{
		$(".shade").hide();
		$(".s-head-hide").removeClass('transform');
		var lo = '-80px';
	}
	$(".s-head-div").animate({
		top:lo
	},600);
}

function hidenSearchMenu(){
	$(".s-head-div").animate({
		top:'-80px'
	},600,function(){
		$(".s-head-hide").show();
	});
}

//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小
var queryA;//咨询
var queryB;//投诉
var queryC;//预约
var NowPageType=1;//当前翻页是对应的哪个表，默认是第一个  就是咨询记录
/*
 * 根据用户 查询该用户的各种记录
 * checkbox value: 1-咨询 2-投诉 3：预约
 */
function SearchFun() {
	subStart();
	$(".shade").hide();//关闭遮罩
	hidenSerchMenu();//隐藏搜索栏
	$(".check-h1 span").hide();
	$(".check-h1 span").removeClass('s-active');
	$(".table-list").hide();
	var MemberID = $("#SearchMember").attr("data");
	var keyword = $("#SearchMember").val();
	if(!MemberID){
		layer.msg("请先查找会员",{
			shift:6,
			time:1000
		},function(){
			subEnd();
		});
		return ;
	}
	$("#keyword").html(keyword);
	//显示基本资料
	showBasicData(MemberID);

	var checkList = [];
	$("input[name='work'][type=checkbox]").each(function() {
		if(this.checked) {
			checkList.push($(this).val());
		}
	});
	if(checkList.length == 0) {
		layer.msg("至少选一种作为查询条件", {
			shift: 6,
			time: 1000
		}, function() {
			subEnd();
			return;
		});
	}
	var NewMember = AV.Object.createWithoutData('Member', MemberID);
	//咨询
	var first = checkList[0];
	switch (first){
		case '1':
			$("#Counsel-table").show();
			$(".check-h1 .CounselSpan").addClass('s-active');
			break;
		case '2':
			$("#complain-table").show();
			$(".check-h1 .complainSpan").addClass('s-active');
			break;
		case '3':
			$("#order-table").show();
			$(".check-h1 .OrderSpan").addClass('s-active');
			break;
		default:
			break;
	}
	//咨询
	if($.inArray('1', checkList) >= 0) {
		$(".check-h1 .CounselSpan").show();
		queryA = new AV.Query('Counsel');
		queryA.equalTo('Member', NewMember);
		queryA.include('Doctor');
		queryA.include('CounselType');
		queryA.include('FollowAgent');
		queryA.descending('createdAt');
		showPages(queryA); //显示页数和总条数 在limit之前使用
   		showNowPageResults(queryA,'1');
		
	}
	//投诉
	if($.inArray('2', checkList) >= 0) {
		$(".check-h1 .complainSpan").show();
		queryB = new AV.Query('ComplainWorkOrder');
		queryB.equalTo('Member', NewMember);
		queryB.include("MemberLevel");
		queryB.include("TransferDepartment");
		queryB.include("ComplainLevel");
		queryB.descending('createdAt');
		showNowPageResults(queryB,'2');
		
	}
	//预约
	if($.inArray('3', checkList) >= 0) {
		$(".check-h1 .OrderSpan").show();
		queryC = new AV.Query('EventsCalendar');
		queryC.equalTo('Member', NewMember);
		queryC.notEqualTo('Statu', -999); //取消了的日程不显示
		queryC.include('EventType');
		queryC.include('Hospital');
		queryC.include('Doctor');
		queryC.include('ConsultingRoom');
		queryC.include('MedicalResult');
		queryC.greaterThan('ConfirmAT', new Date());
		queryC.descending('createdAt');
		showNowPageResults(queryC,'3');
		
	}
	$(".s-content-before").hide();
	$(".s-content").show();
	subEnd();
}
/****************翻页********************/
/*
 * 全局变量     page query
 * 调用函数    ShowObject(results);
 * pageNumber：翻页大小
 */
/*
 * 翻页主函数
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
	switch (NowPageType){
		case 1:
			showNowPageResults(queryA,'1');
			break;
		case 2:
			showNowPageResults(queryB,'2');
			break;
		case 3:
			showNowPageResults(queryC,'3');
			break;
		default:
			break;
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
			switch (type){
				case '1':
					showCounselList(results);
					break;
				case '2':
					showComplainList(results);
					break;
				case '3':
					showOrderList(results);
					break;
				default:
					break;
			}
		}
	});
}




/*
 * 显示咨询counsel列表
 */
function showCounselList(results){
	var len = results.length;
	if(len == 0) {
		$("#Counsel-table-body").html('<tr><td class="null-td" colspan="8">暂无记录</td></tr>');
		return;
	}
	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var Id = obj.id;
			var DoctorName = '';
			if(obj.get("Doctor") != null) {
				DoctorName = obj.get("Doctor").get("DoctorName");
			}
			var tellNo = '';
			if(obj.get("Doctor") != null) {
				tellNo = obj.get("Doctor").get("MobilePhoneNo");
			}
			var FollowAgent = '';
			if(obj.get("FollowAgent") != null) {
				FollowAgent = obj.get("FollowAgent").get("AgentName");
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
					htmlArray[i] = "<tr>" + '<td>' + DoctorName + '</td>' + '<td>' + FollowAgent + '</td>' + '<td>' + TypeName + '</td>' + '<td>' + CounselContent + '</td>' + '<td>' + content + '</td>' + '<td>' + chageTime(LastUpdateTime) + '</td>' +
						'<td class="td-time">' + timeToString(CreatedTime) + '</td>'+
               			'<td class="td-time">' + timeToString(LastUpdateTime) + '</td>'+
               			/*'<td><a href=\"../Counsel/advisoryDetail.html?id=' + Id + '\">详情</a></td>' +*/
						'</tr>';
					if(count == len) {
						for(var k = 0; k < len; k++) {
							html += htmlArray[k];
						}
						$("#Counsel-table-body").html(html);
					}
				}
			});
		})(i);
	}
}

/*
 * 投诉记录
 * 
 */
function showComplainList(results){
	var len = results.length;
	if(len == 0) {
		$("#complain-table-body").html('<tr><td class="null-td" colspan="11">暂无记录</td></tr>');
		return;
	}
    var html = '',htmlArray=[];
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function(i) {
            var obj = results[i];
            var Id = obj.id;
            var PhoneNo = '';
            if (obj.get("PhoneNo") != null) {
                PhoneNo = obj.get("PhoneNo");
            }
            var LevelName = '';
            var LevelIcon= '';
            if (obj.get("MemberLevel") != null) {
            	var le = obj.get("MemberLevel");
                LevelName = le.get("LevelName");
                LevelIcon = le.get("LevelIcon").url();
            }
            var ComplainType = '';
            if (obj.get("ComplainType") != null) {
                ComplainType = obj.get("ComplainType");
            }
            var ComplainLevel = '';
            if (obj.get("ComplainLevel") != null) {
                ComplainLevel = obj.get("ComplainLevel").get("LevelName");
            }
            var ResTypeString = '';
            if (obj.get("RespondentsType") != null) {
                var t = obj.get("RespondentsType");
               ResTypeString= ResTypeStatuToStr(t);
            }
            var RespondentsID = '';
            var RespondentsType = '';
            if (obj.get("Respondents") != null) {
               var Respondents = obj.get("Respondents");
               for(var p in Respondents){
               		RespondentsType =p;
    				RespondentsID = Respondents[p];
				}
            }
            
            var Contents = '';
            if (obj.get("Contents") != null) {
                Contents = obj.get("Contents");
            }
            var ResultByService = '';
            if (obj.get("ResultByService") != null) {
                ResultByService = obj.get("ResultByService");
            }
            var ResultByDepartment = '';
            if (obj.get("ResultByDepartment") != null) {
                ResultByDepartment = obj.get("ResultByDepartment");
            }
             var CallbackResult = '';
            if (obj.get("CallbackResult") != null) {
                CallbackResult = obj.get("CallbackResult");
            }
            var Statu = '';
            if (obj.get("Statu") != null) {
                Statu = obj.get("Statu");
            }
            //咨询建立的时间
			var creatTime = obj.createdAt;
            var updateTime = obj.updatedAt;
            var query=new AV.Query(RespondentsType);
            query.get(RespondentsID,{
            	success:function(resp){
            		if(RespondentsType=="Doctor"){
            			var getName="DoctorName";
            		}else if(RespondentsType=="Butler"){
            			var getName="ButlerName";
            		}else{
            			var getName="AgentName";
            		}
            		var RespondentsName=resp.get(getName);
            		htmlArray[i]= '<tr>' 
                		+ '<td><img src="'+LevelIcon+'" width="15px">'+ LevelName + '</td>'
               		 	+ '<td>' + ComplainLevel + '</td>'
               		 	+ '<td>' + ResTypeString + '</td>'
               		 	+ '<td>' + RespondentsName + '</td>'
               		 	+ '<td>' + Contents + '</td>'
               		 	+ '<td>' + ResultByDepartment + '</td>'
               		 	+ '<td>' + ResultByService + '</td>'
               		 	+ '<td>' + CallbackResult + '</td>'
               		 	+ '<td>' + CompStatuToString(Statu) + '</td>'
               		 	+ '<td class="td-time">' + timeToString(creatTime) + '</td>'
               		 	+ '<td class="td-time">' + timeToString(updateTime) + '</td>';
                	htmlArray[i]+='</tr>';
          			count+=1;
           			if (count == len) {
                		for(var k=0;k<len;k++){
                   			html+=htmlArray[k];
                		}
               			$("#complain-table-body").html(html);
          			}
            	}
            });
        })(i);
    }
}

/*
 * 预约
 */
function showOrderList(results){
	var len = results.length;
	if(len == 0) {
		$("#order-table-body").html('<tr><td class="null-td" colspan="8">暂无记录</td></tr>');
		return;
	}
	var html = '';
	for(var i = 0; i < len; i++) {
		var obj = results[i];
		var Id = obj.id;
		var EventType = obj.get('EventType') ? obj.get('EventType').get('EventTypeName') : '无';
		var ConfirmAT = obj.get('ConfirmAT');
		var Hospital = obj.get('Hospital') ? obj.get('Hospital').get('HospitalName') : '无';
		var ConsultingRoom = obj.get('ConsultingRoom') ? obj.get('ConsultingRoom').get('RoomName') : '无';
		var MedicalResult = obj.get('MedicalResult') ? obj.get('MedicalResult').get('MedicalResult') : '无';
		var Statu = results[i].get('Statu');
		var RatingByMember = "未评分"
		var canstr = '';
		var creatTime = obj.createdAt;
		html += '<tr>' +
			'<td>' + EventType + '</td>' +
			'<td>' + Hospital + '</td>' +
			'<td>' + ConsultingRoom + '</td>' +
			'<td>' + MedicalResult + '</td>' +
			'<td>' + getStatus(Statu) + '</td>' +
			'<td>' + RatingByMember + '</td>' +
			'<td>' + timeToString(creatTime) + '</td>' +
			'<td>' + timeToString(ConfirmAT) + '</td>' +
			'</tr>';
	}
	if(html!='')$("#order-table-body").html(html);
}

/*
 * 显示会员基本资料
 * 
 */
function showBasicData(MemberID) {
	var query = new AV.Query('Member');
	query.include('MemberLevel');
	query.include("City");
	query.get(MemberID).then(function(obj) {
		var menberId = obj.id;
		var MemberName = '';
		if(obj.get("MemberName") != null) {
			MemberName = obj.get("MemberName");
		}
		if(obj.get("MobilePhoneNo") != null) {
			var tellNo = obj.get("MobilePhoneNo");
			$("#call").attr("name", tellNo);
		}

		var JoinTime = '';
		if(obj.get("JoinTime") != null) {
			JoinTime = obj.get("JoinTime");
		}
		
		var LevelIconUrl = '';
		var LevelName = '';
		if(obj.get("MemberLevel") != null) {
			LevelName = obj.get("MemberLevel").get("LevelName");
			LevelIconUrl = obj.get("MemberLevel").get("LevelIcon").url();
		}
		var city = '';
		if(obj.get("City") != null) {
			city = obj.get("City").get("CityName");
		}
		var Activeness = '';
		if(obj.get("Activeness") != null) {
			Activeness = obj.get("Activeness");
		}
		var Satisfaction = '';
		if(obj.get("Satisfaction") != null) {
			Satisfaction = obj.get("Satisfaction");
		}
		var DiseaseArray = []; //疾病数组
		var Disease = obj.relation('Disease');
		Disease.query().find({
			success: function(result) {
				for(var j = 0; j < result.length; j++) {
					DiseaseArray.push(result[j].get('DiseaseName'));
				}
				$("#Name").html(MemberName);
				$("#Leval").html(LevelName + '<img src=\"' + LevelIconUrl + '\" width=\"15px\">');
				$("#JoinTime").html(timeToString(JoinTime));
				$("#Disease").html(DiseaseArray.toString());
				$("#City").html(city);
				$("#Satisfaction").html(getStartlevalDivPersonal(Satisfaction));
				$("#Activeness").html(getStartlevalDivPersonal(Activeness));
			}
		});
	});
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
	if(len != 0) {
		searchMember(value);
	}
}
/*
 * 查询会员显示再列表中
 */
function searchMember(value) {
	var query = new AV.Query('Member');
	if(parseInt(value) > 0) { //搜索的电话号码 并且号码数大于2 也就是输入2位号码才开始搜 第一位都是1
		if(value.length >= 2) {
			query.startsWith('MobilePhoneNo', value);
		} else {
			return;
		}
	} else { //搜索的姓名
		query.contains('MemberName', value);
	}
	query.find().then(function(results) {
		ShowResults(results);
	});

	function ShowResults(results) {
		var html = '';
		var len = results.length;
		for(var i = 0; i < len; i++) {
			var obj = results[i];
			var MemberName = obj.get('MemberName') ? obj.get('MemberName') : '';
			var MobilePhoneNo = obj.get('MobilePhoneNo') ? obj.get('MobilePhoneNo') : '';
			var Url = '';
			if(obj.get('HeadPortrait')) {
				Url = obj.get('HeadPortrait').url();
			}
			var ID = obj.id;
			html += "<li onclick=\'checkLi(\"" + ID + "\",\"" + MemberName + "\")\'>" + '<img src="' + Url + '"/>' + MemberName + "<small>" + MobilePhoneNo + "</small></li>";
		}
		$("#input_ul").html(html);
		$(".search_results").css('display', 'block');
	}
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
//生成星级html
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
/**
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
function checkLi(id, name) {
	$("#SearchMember").attr('data', id);
	$("#SearchMember").val(name);
	$(".search_results").css("display", "none");
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