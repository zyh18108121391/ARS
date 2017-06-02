var Member = null;
var doctorName = '';
var currentDoctorObj, currentMemberObj;
//当没有回复时保存咨询内容
var memberFirstAsk;
var saveAddFirstMemberAsk = 0,
	haveMemberAddAsk = 0;
var THIS,AGENTID;
$(document).ready(
	function() {
		var user = AV.User.current();
		var query = new AV.Query('ServiceAgent');
		query.equalTo('Account', user);
		query.first().then(function(result) {
			AGENTID = result.get("AgentID");
			main();
			// 每次调用生成一个聊天实例
		}, function(error) {
			layer.msg('查询错误', {
				shift: 6,
				time: 600
			})
		});
		createNew();
	}
);

// 请换成自己的 appId 和 appKey
var appId = 'to0nyg7vtky1bna4ybrclwrm3hm0r94oqw45eiost7mqrbi5';
var appKey = 'kbq185r1thmzpbod54og7ml9vll7pzmb5yegd2jyyfcw3qaa';
var push;

function createNew() {
	push = AV.push({
		appId: appId,
		appKey: appKey
	});

	// 可以链式调用
	push.open(function() {});

	// receive 方法是监听 message 的快捷方法
	push.receive(function(data) {
		console.log("----------" + JSON.stringify(data));
		ReceiveMain(data); //处理收到的所有消息
	});
	// 监听网络异常
	push.on('reuse', function() {
		console.log('网络中断正在重试');
	});
}

/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
	if(data.agentid != AgentIDChange(AGENTID)) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	var objectID = data.objectID; //agentconversation的id
	if(objectID){
		BindCallRecordToCounsel(objectID);//绑定改记录到当前咨询的relation中
	}
	var statu = data.agentstate;
	if(statu == 0) { //状态切换为0时执行
		changeCallBtn(THIS);
	}
}

/*
 * 
 * 绑定通话记录记录到当前咨询的relation中
 * @objectID：agentconversation的id
 */
function BindCallRecordToCounsel(objectID){
	var MyCousel = AV.Object.createWithoutData('Counsel',geturl()); 
	var relation = MyCousel.relation('CallRecord');
	var MyRecord = AV.Object.createWithoutData('AgentConversationRecord',objectID);
	relation.add(MyRecord);
	MyCousel.save();
}



function main() {
	var id = geturl();
	var query = new AV.Query('Counsel');
	query.include('Member');
	query.include('Doctor');
	query.include('CounselType');
	query.get(id, {
		success: function(obj) {

			//已完成 不需要回复
			if(obj.get("Statu") == '999') {
				$("#replay_div").css("display", "none");
			} else {
				$("#replay_div").css("display", "block");
			}
			var MemberName = '';
			if(obj.get("Member") != null) {
				currentMemberObj = obj.get("Member");
				MemberName = obj.get("Member").get("MemberName");
			}
			var MobilePhoneNo = '';
			if(obj.get("Doctor") != null) {
				MobilePhoneNo = obj.get("Doctor").get("MobilePhoneNo");
				$("#call").attr("name", MobilePhoneNo);
			}
			var DoctorName = '';
			if(obj.get("Doctor") != null) {
				DoctorName = obj.get("Doctor").get("DoctorName");
			}
			var HeadPortrait = '';
			if(obj.get("Member").get("HeadPortrait") != null) {
				HeadPortrait = obj.get("Member").get("HeadPortrait").url();
			}
			var TypeName = '';
			if(obj.get("CounselType") != null) {
				TypeName = obj.get("CounselType").get("TypeName");
			}
			var CounselContent = '';
			if(obj.get("CounselContent") != null) {
				CounselContent = obj.get("CounselContent");
				memberFirstAsk = CounselContent;
			}
			var time = obj.createdAt;
			var MemberLevelID = '';
			if(obj.get("CounselContent") != null) {
				MemberLevelID = obj.get("Member").get("MemberLevel").id;
				var query = new AV.Query('MemberLevel');
				query.get(MemberLevelID, {
					success: function(le) {
						var html = '<img src="' + le.get("LevelIcon").url() + '"/>' + le.get("LevelName");
						$("#level").html(html);
					}
				})
			}
			//显示回复列表
			var Posts = obj.relation('Posts');
			var query1 = Posts.query();
			query1.include("Doctor");
			query1.descending("createdAt");
			query1.find({
				success: function(results) {
					var html = '';
					for(var j = 0; j < results.length; j++) {
						var ob = results[j];
						var content = '暂无回复';
						if(ob) {
							var name = '';
							var headUrl = '';
							if(ob.get("PostType") == '1') {
								name = "ARS--" + DoctorName;
								content = ob.get("DoctorPost");
								if(ob.get("Doctor")) {
									if(ob.get("Doctor").get("HeadPortrait")) {
										headUrl = ob.get("Doctor").get("HeadPortrait").url();
									}
								}
							} else {
								haveMemberAddAsk = 1;
								if(saveAddFirstMemberAsk == 0) {
									saveAddFirstMemberAsk = ob.get('MemberPost');
								}
								headUrl = HeadPortrait;
								name = MemberName;
								content = ob.get("MemberPost");
							}
						}
						var time_li = ob.createdAt;

						html += '<div class="ticket-thread">' +
							'<div class="thread-status">' +
							'<div class="head"><img src=\"' + headUrl + '\"/></div>' +
							'<div class="head-name">' +
							'<div><strong class="ticket-username">' + name + '</strong></div>' +
							'<div><span class="time">@ ' + timeToString(time_li) + '</span></div>' +
							'</div>' +
							'<div class="clear"></div>' +
							'</div>' +
							'<div class="thread-contant">' +
							'<div class="pre">' + content + '</div>' +
							'</div>' +
							'</div>'
					}
					if(html==''){
						$("#thread").html('<div class="content-null">医生暂未回复</div>');
					}else{
						$("#thread").html(html);
					}
				}
			});
			var h = '<img src=\"' + HeadPortrait + '\"/>';
			$("#head").html(h);
			$("#name").html(MemberName);
			$("#content").html(CounselContent);
			$("#time").html(timeToString(time));
		}
	});
}

/*
 * 电话外呼 调用云函数发起呼叫
 * {
    'func':'ivr',
    'funcdes':'agentmakecall',
    'opernode':'AgentMakeCall',
    'operparam':{
        'number':'18981892803',
        'agentid':'1000',
        'disnumber':'',
        'answerurl':'',
        'agenthangupurl':''
    }
}	
 */
function call(th) {
	THIS = th;
	$(th).html("呼叫中...");
	var tellNo = $(th).attr("name");
	console.log(AgentIDChange(AGENTID));
	var data = {
		'func': 'ivr',
		'funcdes': 'agentmakecall',
		'opernode': 'AgentMakeCall',
		'operparam': {
			'number': tellNo,
			'agentid': AgentIDChange(AGENTID),
			'disnumber': '',
			'answerurl': '',
			'agenthangupurl': ''
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			CID = data.Response.callSid;
			console.log(JSON.stringify(data));
			changeCallBtn(th); //改变按钮和事件
		},
		error: function(err) {
			// 处理调用失败
			console.log("拨打失败" + JSON.stringify(err));
			if(err.code == 1) {
				console.log(err.message, {});
				layer.msg('操作失败，请联系管理员' + err.message);
			}
		}
	});
}

/*
 * 
 * 挂掉电话
 *  {
      'func':'ivr',
      'funcdes':'call',
      'opernode':'AgentServiceEnd',
        'callid':'',
      'operparam':{
          'agentid':'1000',
          'callid':'',
          'action':''
      }
  }
 */
function hangUp(th) {
	$(th).html("挂断中...");
	var data = {
		'func': 'ivr',
		'funcdes': 'call',
		'opernode': 'AgentServiceEnd',
		'callid': CID,
		'operparam': {
			'agentid': AgentIDChange(AGENTID),
			'callid': CID,
			'action': ''
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			//{"Response":{"callSid":"1608251026112348000100750024538a","orderId":"CM1007520160825102611497662","statusCode":"000000"}}
			changeCallBtn(th); //改变按钮和事件
			alert("挂断成功");
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

/*
 * 
 * 改变拨打按钮的文字和颜色 切换拨打和挂断
 */
function changeCallBtn(th) {
	var type = $(th).attr("date-type");
	var obj = $(th);
	if(type == "call") {
		obj.addClass("btn-hang-up");
		obj.html("挂断");
		$(th).attr("date-type", "hangup");
		obj.attr("onclick", "hangUp(this)");
	} else {
		obj.removeClass("btn-hang-up");
		obj.html("拨打电话");
		$(th).attr("date-type", "call");
		obj.attr("onclick", "call(this)");
	}
}