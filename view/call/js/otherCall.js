var SaleWorkOrder = AV.Object.extend("SaleWorkOrder");
var Disease = AV.Object.extend("Disease");
var CUSTOMER;//记录登录的客服
$(document).ready(function() {
	createNew();
	var tel =getUrlParam("id");
	$("#phone").html(tel);
	$("#tellNo").val(tel);
	//自定义时间选择
	bindEvent();
	showCall(); //显示热线信息
	ShowCheckBoxs("Disease", "DiseaseName", "Disease"); //显示病情下拉列表
	ShowSelectOption("MemberLevel", "LevelName", "MemberLevel"); //显示病情列表
	RecentlyCallRecord(tel);//根据电话号码筛选通话记录
	
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				CUSTOMER = cus;
			}
		});
	}
});

/*
 * 
 * 显示热线信息 根据url
 */
function showCall() {
	var AgentID = getUrlParam("AgentID");
	var callid = getUrlParam("callid");
	var query = new AV.Query("AgentConversationRecord");
	query.equalTo("CalIID", callid);
	query.equalTo("AgentID", AgentID);
	query.first({
		success: function(result) {
			var QID = result.get("QueueID");
			var IsQueue = result.get("IsQueue") ? "是" : "否";
			AGENT = result.get("Agent");//顺便获取agent 方便后面新建咨询
			var query1 = new AV.Query("ServiceQueue");
			var AlertingTime = result.get("AlertingTime") ? result.get("AlertingTime") : null;
			var RecordID = result.id;
			query1.equalTo("QueueID", QID);
			query1.first({
				success: function(qu) {
					var qName = qu.get("QueueName");
					$("#QueueName").html(qName);
					$("#QueueName").attr("data", RecordID);
					$("#IsQueue").html(IsQueue);
					if(AlertingTime) {
						$("#AlertingTime").html(alertingTimeChange(AlertingTime));
					} else {
						//页面打开开始计时响铃
						$('#AlertingTime').timer({
							format: '%m 分 %s 秒'
						});
					}
				}
			});
		}
	});
}

/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	if(data.agentid != getUrlParam("AgentID")) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	var statu = data.agentstate;
	if(statu == 3 || statu == 0 || statu == 4) {
		//响铃时间停止
		$('#AlertingTime').timer('remove');
		updateAlertingTime();
	}
}

/*
 * 挂断或者接通 记录振铃时间
 * 
 */
function updateAlertingTime() {
	var timeStr = $("#AlertingTime").html();
	var t = timeStr.split(' ');
	var minu = parseInt(t[0]) * 60 + parseInt(t[2]);
	var id = $("#QueueName").attr("data");
	var query = new AV.Query("AgentConversationRecord");
	query.get(id, {
		success: function(result) {
			result.set("AlertingTime", minu);
			result.save(null, {
				success: function(result) {
					console.log("振铃时间记录成功");
				}
			});
		}
	});
}


/*
 * 显示5条最近历史通话记录
 * 
 */

function RecentlyCallRecord(telNo) {
	var query = new AV.Query('AgentConversationRecord');
	query.equalTo('ToTelNo', telNo);
	query.descending('createdAt');
	query.include('Agent');
	query.limit(5);
	query.find({
		success: function(results) {
			var len = results.length;
			var html = '';
			for(var i = 0; i < len; i++) {
				var obj = results[i];
				var AgentName = obj.get('Agent') ? obj.get('Agent').get('AgentName') : '';
				var Duration = obj.get('Duration') ? obj.get('Duration') : '0';
				var RecordFile = '';
				var RecordFileURL = '';
				if(obj.get("RecordFile") != null) {
					RecordFileURL = obj.get("RecordFile").url();
					RecordFile='点击播放';
				}
				var Memo = obj.get('Memo') ? obj.get('Memo') : '';
				var Satisfaction = '';
            	if (obj.get("Satisfaction") != null) {
           	    	Satisfaction = obj.get("Satisfaction");
            	}
				var time = obj.createdAt;
				
				html += '<tr>' +
					'<td>' + AgentName + '</td>' +
					'<td>' + alertingTimeChange(Duration) + '</td>' +
					'<td>' + '<span class="auto-text" data="'+RecordFileURL+'" onclick="play(this)">'+RecordFile+'</span>'+ '</td>' +
					'<td>' + Memo + '</td>' +
					'<td>' +getStartlevalDivPersonal(Satisfaction)+ '</td>' +
					'<td>' + timeToString(time) + '</td>' +
					'</tr>';
			
			}
			if(html!='')$("#CallRecordList").html(html);
		}
	});
}


/*
 * 
 * 查询会员
 * 
 */
function search() {
	subStart();
	var name = $("#input-name").val();
	var tel = $("#input-tell").val();

	if(name == '' && tel == '') {
		subEnd();
		layer.msg('查询条件不能为空', {
			time: 1500
		});
	}
	var query = new AV.Query('Member');
	if(tel != '') {
		query.equalTo('MobilePhoneNo', tel);
	}
	if(name != '') {
		query.equalTo('MemberName', name);
	}
	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.descending('JoinTime');
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}

//把query后的结果集输出到table中便于公用
function ShowObject(results) {
	var len = results.length;
	if(len == 0) {
		layer.msg('没有找到相关会员', {
			time: 1500
		});
		$("#member_list").show();
		return;
	}
	if(len == 1) {
		var objID = results[0].id;
		window.location.href = "call.html?id=" + objID;
	}
	var html = '';
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var menberId = obj.id;
			var HeadPortrait = '';
			if(obj.get("HeadPortrait")) {
				HeadPortrait = obj.get("HeadPortrait").url();
			} else {
				HeadPortrait = '../../images/touxiang.jpg';
			}

			var MemberName = '';
			if(obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}
			var LevelName = '';
			var LevelIcon = '';
			if(obj.get("MemberLevel") != null) {
				LevelName = obj.get("MemberLevel").get("LevelName");
				LevelIcon = obj.get("MemberLevel").get("LevelIcon").url();
			}
			var JoinTime = '';
			if(obj.get("JoinTime") != null) {
				JoinTime = obj.get("JoinTime");
			}
			var LevelIconUrl = '';
			if(obj.get("MemberLevel") != null) {
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
					//最后一次复诊记录查询
					var Eventquery1 = new AV.Query('EventsCalendar');
					var Eventquery2 = new AV.Query('EventsCalendar');
					var Eventquery3 = new AV.Query('EventsCalendar');
					var EventType = AV.Object.extend("EventType");
					var Event_fuzheng = new EventType();
					var Event_suifang = new EventType();
					var Event_xuyao = new EventType();
					Event_fuzheng.id = "576bd5ce1532bc005faf4133";
					Event_suifang.id = "576bd5f7165abd00545d487e";
					Event_xuyao.id = "576bd5ed128fe1005a14e654";

					Eventquery1.equalTo("EventType", Event_fuzheng);
					Eventquery2.equalTo("EventType", Event_suifang);
					Eventquery3.equalTo("EventType", Event_xuyao);

					var query = AV.Query.or(Eventquery1, Eventquery2);
					var queryAll = AV.Query.or(query, Eventquery3);

					//queryAll.equalTo("Doctor", doctor);
					queryAll.equalTo("Member", obj);
					// 按时间，降序排列
					queryAll.descending('FirstAT');
					queryAll.first({
						success: function(result) {
							if(result) {
								var time_3 = result.get("FirstAT");
								if(result.get("Statu") != '31') {
									var time_3_html = '<span style="color:green">' + timeToString(time_3) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
								} else {
									var time_3_html = timeToString(time_3);
								}
							} else {
								var time_3_html = '';
							}
							count += 1;

							//输出html时间到了
							//alert(Satisfaction+"//"+getStartlevalDivPersonal(Satisfaction));
							html += '<tr id="' + menberId + '">' + '<td><img src="../../images/touxiang.jpg" width="30px"></td>' + '<td>' + MemberName + '</td>' + '<td><img src=\"../../images/level.png\" width=\"15px\">' + LevelName + '</td>' +
								'<td>' + timeToStringShort(JoinTime) + '</td>' +
								'<td>' + DiseaseArray.toString() + '</td>' +
								'<td>' + city + '</td>' +
								'<td>' + time_3_html + '</td>' +
								'<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' + '<td>' + getStartlevalDivPersonal(Activeness) + '</td>';
							if(count == len) {
								$("#member_list").show();
								if(html!='') $("#table-body").html(html);
								$('#member_list tr').click(function() {
									//alert($(this).attr('id'));
								});
							}
						}
					});
				}
			});
		})(i);
	}
}

//显示下拉框列表 
function ShowCheckBoxs(className, typeName, id) {
	//载入产品类型下拉框列表
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


/*
 * 播放录音文件
 */
function play(th) {
	$(".audio-div").show();
	var top = $(th).position().top;
	var left = $(th).position().left;
	console.log(top+"/"+left);
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

/*
 * 绑定事件
 * 
 */
function bindEvent() {
	//绑定回车事件
	$('#input-tell').bind('keypress', function(event) {
		if(event.keyCode == "13") {
			search();
		}
	}); //绑定回车事件
	$('#input-name').bind('keypress', function(event) {
		if(event.keyCode == "13") {
			search();
		}
	});
	$("#Intention").change(function(){
		var val = $(this).val();
		if(val!=-1){
			$(".hiden-t").addClass("hiden");
			$(".hidenOrShow").removeClass("hide-block");
		}else{
			$(".hide-t").removeClass("hiden");
			$(".hidenOrShow").addClass("hide-block");
		}
	});
}
/*
 * 创建新销售工单
 * 
 */
function NewWordOrder() {
	subStart();
	var name = $("#Name").val();
	var tellNo = $("#tellNo").val();
	var notice = $("#notice").val();
	var DiseaseArray = [];
	$("#Disease input[type=checkbox]").each(function() {
		if(this.checked) {
			DiseaseArray.push($(this).val());
		}
	});
	var  IntentionType = $("#Intention option:selected").val();
	var  MemberLevel = $("#MemberLevel option:selected").val();
	var  payType = $("#payType option:selected").val();
	if(name == '') {
		subEnd();
		layer.msg('姓名不能为空', {
			shift: 6,
			time: 600
		});
		return;
	}
	if(tellNo == '') {
		subEnd();
		layer.msg('联系电话不能为空', {
			shift: 6,
			time: 600
		})
		return;
	}
	var len= DiseaseArray.length;
	if(len == 0) {
		subEnd();
		layer.msg('至少选择一项病症', {
			shift: 6,
			time: 600
		})
		return;
	}
	var NewObj = new SaleWorkOrder();
	var relation = NewObj.relation("Disease");
	for(var i = 0; i < len; i++) {
		var MyDisease = new Disease();
		var ID = DiseaseArray[i];
		MyDisease.id = ID;
		relation.add(MyDisease);
	}
	NewObj.set("PurchaseIntention",  parseInt(IntentionType));
	var statu = '';
	switch (parseInt(IntentionType)){
		case -1:
			statu = -1;
			break;
		case 1:
			statu = 2;
			var myLevel = AV.Object.createWithoutData("MemberLevel",MemberLevel);
			NewObj.set("ProductIntention", myLevel);
			NewObj.set("PaymentIntention", parseInt(payType));
			break;
		case 11:
			statu = 11;
			var myLevel = AV.Object.createWithoutData("MemberLevel",MemberLevel);
			NewObj.set("ProductIntention", myLevel);
			NewObj.set("PaymentIntention", parseInt(payType));
			break;
		default:
			break;
	}
	NewObj.set("MemberName", name);
	NewObj.set("PhoneNo", tellNo);
	NewObj.set("Memo", notice);
	NewObj.set("Statu", parseInt(statu));
	NewObj.set("Agent", CUSTOMER);
	NewObj.save(null, {
		success: function() {
			layer.msg('保存成功', {
				time: 600
			},function(){
				window.location.reload();
			});
		}
	});
}

/*
 * 禁用除弹出窗口的其他div
 * 
 * 
 */
function jy(num) {
	var window_height = $(window).height(); //当前窗口的宽高
	var window_width = $(window).width();
	$(".jy").css("display", "block");
	$(".jy").css("width", window_width);
	$(".jy").css("height", window_height);
	$(".jy").fadeTo("fast", num);
}

/*
 * 打开知识库div
 */
function openWiki(){
	var window_height = $(window).height(); //当前窗口的宽高
	var window_width = $(window).width();
	
	var wiki_h=window_height*0.8;
	var wiki_w=window_width*0.8;
	
	$(".wiki-div").css("left",window_width*0.1+"px");
	$(".wiki-div").css("top",window_height*0.08+"px");
	jy(0.8);
	$(".wiki-div").css("display","block");
}
/*
 * 关闭wikidiv
 */
function closeWiki(){
	$(".jy").css("display","none");
	$(".wiki-div").css("display","none");
}
//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
    var html_op = '',obj;
    var query = new AV.Query(className);
    query.find({
        success: function(results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).html(html_op);
        }
    });
}