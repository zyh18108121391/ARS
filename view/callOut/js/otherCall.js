var SaleWorkOrder = AV.Object.extend("SaleWorkOrder");
var Disease = AV.Object.extend("Disease");
var CUSTOMER;//记录登录的客服
$(document).ready(function() {
	createNew();
	var tel =getUrlParam("telNo");
	$("#phone").html(tel);
	$("#tellNo").val(tel);
	searchStatu(getUrlParam('AgentID'));//查询状态 如果不在通话中 则显示关闭按钮
	showOrder(tel);//查询并显示销售工单
	//自定义时间选择
	bindEvent();
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
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	console.log("---"+JSON.stringify(data));
	if(data.agentid != getUrlParam("AgentID")) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	if(data.callid==getUrlParam('callid')&&data.connect){ //外呼 用户接通电话
		console.log('接通电话');
		$(".calloutHpBtn").show();
	}
	var statu = data.agentstate;
	if(data.callid==getUrlParam('callid')&&statu=='0'){//通话结束
		$(".calloutHpBtn").show();
		$(".calloutHpBtn").attr("value","关闭页面");
		$(".calloutHpBtn").css('background-color',"#c9302c");
		$(".calloutHpBtn").css('border-color',"#ac2925");
		$(".calloutHpBtn").attr('onclick','backToCallOut()');
		var query = new AV.Query('AgentConversationRecord');
		query.equalTo('CalIID',getUrlParam('callid'));
		query.first().then(function(obj){
			SetRecordMemo(obj.id,'norush');
		});
	}
}


/*
 * 查询是否有销售工单 有则显示
 */
function showOrder(telNo){
	var query = new AV.Query('SaleWorkOrder');
	query.equalTo('PhoneNo',telNo);
	query.descending('createdAt');//最近的一个销售工单
	query.include('Agent');
	query.include('ProductIntention');
	query.first().then(function(obj){
		if(obj){//如果有销售工单
			var MemberName = '';
            if (obj.get("MemberName") != null) {
                MemberName = obj.get("MemberName");
            }
            var PhoneNo = '';
            if (obj.get("PhoneNo") != null) {
                PhoneNo = obj.get("PhoneNo");
            }
            var agentName = ''
            if(obj.get("Agent") != null) {
				agentName = obj.get("Agent").get('AgentName');
			}
            var ProductIntention = '';
			if(obj.get("ProductIntention") != null) {
				ProductIntention = obj.get("ProductIntention").get('LevelName');
			}
            var PurchaseIntention = '';
			if(obj.get("PurchaseIntention") != null) {
				PurchaseIntention = obj.get("PurchaseIntention");
			}
			
            var Memo = '';
            if (obj.get("Memo") != null) {
                Memo = obj.get("Memo");
            }
            var Statu = '';
            if (obj.get("Statu") != null) {
                Statu = obj.get("Statu");
            }
            if(Statu==-1){//签约失败
            	$("#mybtn").val('新增销售工单');
            	$("#mybtn").attr('onclick','addNewOrder()');
            }else if(Statu==21){
            	$("#mybtn").hide();
            }else{
            	$("#mybtn").val('去处理');
            	$("#mybtn").attr('onclick','dealWithOrder("'+obj.id+'")');
            }
            var creatTime = obj.createdAt;
           	var updateTime = obj.updatedAt;
            var DiseaseArray = []; //疾病数组
            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function(result) {
                    for (var j = 0; j < result.length; j++) {
                        DiseaseArray.push(result[j].get('DiseaseName'));
                    }
                  	$("#order-name").html(MemberName);
                  	$("#order-tel").html(PhoneNo);
                  	$("#order-disease").html(DiseaseArray.toString());
                  	$("#order-agent").html(agentName);
                  	$("#order-intention").html(statuToStringPurchase(PurchaseIntention));
                  	$("#order-pro").html(ProductIntention);
                  	$("#order-createdTime").html(timeToString(creatTime));
                  	$("#order-updateTime").html(timeToString(updateTime));
                  	$("#order-memo").html(Memo);
                  	$("#order-statu").html(statuToString(Statu));
                  	$(".haveOrder").show();
                }
            });
			
		}else{//没有销售工单 显示新增销售工单
			$(".haveNoOrder").show();
		}
	});
}

/*
 * 
 */
function addNewOrder(){
	$(".haveNoOrder").show();
}
/*
 * 
 */
function dealWithOrder(id){
	var t = '../workOrder/waitingDealWithDetail.html?id='+id+'&t=callout';
	$("#dealWithIfreame").attr('src',t);
	openDealWith();
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
function openDealWith(){
	var window_height = $(window).height(); //当前窗口的宽高
	var window_width = $(window).width();
	var wiki_h=window_height*0.8;
	var wiki_w=window_width*0.8;
	$(".dealWith-div").css("left",window_width*0.1+"px");
	$(".dealWith-div").css("top",window_height*0.08+"px");
	jy(0.8);
	$(".dealWith-div").css("display","block");
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
/*
 * 关闭DealWithdiv
 */
function closeDealWith(){
	$(".jy").css("display","none");
	$(".dealWith-div").css("display","none");
	showOrder(getUrlParam("telNo"));
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


/*
 * 
 * 状态装换为中文
 * 
 */
function statuToString(statu) {
	var str;
	switch(statu) {
		case -1:
			str = '销售失败';
			break;
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
		case 11:
			str = '意向销售成功';
			break;
		case 21:
			str = '签约';
			break;
		default:
			break;
	}
	return str;
}
/*
 * 
 * 意向转中文
 * 
 */
function statuToStringPurchase(statu) {
	var str;
	switch(statu) {
		case -1:
			str = '失败';
			break;
		case 1:
			str = '待跟进';
			break;
		case 11:
			str = '有意向';
			break;
		default:
			break;
	}
	return str;
}
/*
 * 
 * 支付方式意向转中文
 * 
 */
function statuToStringPay(statu) {
	var str;
	switch(statu) {
		case 1:
			str = '现金支付';
			break;
		case 11:
			str = '微支付';
			break;
		default:
			break;
	}
	return str;
}
/*
 * 挂断
 */
function callOutHangUp(){
	$(".calloutHpBtn").attr("value","挂断中...");
	var cid = getUrlParam('callid');
	var AgentID = getUrlParam("AgentID");
	var data = {
		'func': 'ivr',
		'funcdes': 'call',
		'opernode': 'AgentServiceEnd',
		'callid': cid,
		'operparam': { 
			'agentid':AgentID ,
			'callid': cid,
			'action': ''
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			console.log("挂断成功");
		},
		error: function(err) {
			// 处理调用失败
			console.log("挂断失败" + JSON.stringify(err));
			if(err.code == 1) {} else {
				layer.msg('操作失败，请联系管理员' + err.message, {});
			}
		}
	});
}
function backToCallOut(){
	window.location.href='callOutMenu.html';
}
