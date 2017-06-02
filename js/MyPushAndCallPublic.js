/**
 * push模块 和 拨打电话 用到的共用代码 
 * 涉及页面：会员模块的MemberDetail.html  咨询模块的 advisoryDetail.html、  counselList.html 弹窗页面的historyAdvisory.html othercall.html  callIIndex.html
 *  calloutmenu.html
 */

/***************push********************/
/*
 * push 初始化
 */
// 请换成自己的 appId 和 appKey
var appId = 'to0nyg7vtky1bna4ybrclwrm3hm0r94oqw45eiost7mqrbi5';
var appKey = 'kbq185r1thmzpbod54og7ml9vll7pzmb5yegd2jyyfcw3qaa';
var push;
var door;
function createNew(sub) {
	push = AV.push({
		appId: appId,
		appKey: appKey
	});
	// 可以链式调用
	push.open(function() {
		door = true;
		//showLog('index可以接收推送');
		var obj =  $(".net-icon");
		if(obj){
			obj.removeClass('net-bad-icon');
			obj.addClass('net-good-icon');
			$(".net-work").html('网络正常');
		}
	});
	push.subscribe(['1','2'], function(data) {
		//关注频道 这个同云函数推送的频道 且必须一样
	});
	// receive 方法是监听 message 的快捷方法
	push.receive(function(data) {
		ReceiveMain(data); //处理收到的所有消息
	});
	// 监听网络异常
	push.on('reuse', function() {
		door = false;
		var obj =  $(".net-icon");
		if(obj){
			obj.removeClass('net-good-icon');
			obj.addClass('net-bad-icon');
			$(".net-work").html('网络异常，正在重新连接')
		}
		console.log('网络中断重新连接---');
	});
}



/***************call********************/



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
function call(th,id) {
	Pageflag = true;
	THIS = th;
	var tellNo = $(th).attr("name");
	if(id){ //当telNo需要用id获取时 获取否则直接使用tellNo全局变量 即可
		COUNSELID = id;//记录咨询对象的ID
	}
	var data = {
		'func': 'ivr',
		'funcdes': 'agentmakecall',
		'opernode': 'AgentMakeCall',
		'operparam': {
			'number': tellNo,
			'agentid': AgentIDChange(AgentID),
			'disnumber': '02388658982',
			'answerurl': 'callOutAnswer',
			'agenthangupurl': 'CustomerMark'
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			CID = data.Response.callSid;
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
function hangUp() {
	$("#call").attr("value","挂断中...");
	var data = {
		'func': 'ivr',
		'funcdes': 'call',
		'opernode': 'AgentServiceEnd',
		'callid': CID,
		'operparam': { 
			'agentid': AgentIDChange(AgentID),
			'callid': CID,
			'action': ''
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			//{"Response":{"callSid":"1608251026112348000100750024538a","orderId":"CM1007520160825102611497662","statusCode":"000000"}}
			changeCallBtn();//改变按钮和事件
			layer.msg('挂断成功！');
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
 * 保存通话备注
 * rush: norush代表不刷新
 */
function SetRecordMemo(id,rush) {
	layer.prompt({
		title: '请输入本次通话备注',
		formType: 2
	}, function(text) {
		var query = new AV.Query('AgentConversationRecord');
		query.get(id).then(function(obj) {
			obj.set('Memo', text);
			obj.save().then(function(obj) {
				layer.msg('保存成功', {
					time: 600
				}, function() {
					if(rush!='norush'){
						window.location.reload();
					}
				});
			});
		});
	});
}



/*
 * 
 * 改变拨打按钮的文字和颜色 切换拨打和挂断
 */
function changeCallBtn(th,reset) {
	var type = $(th).attr("date-type");
	var obj = $(th);
	if(reset){
		obj.removeClass("btn-call-before");
		obj.removeClass("btn-hang-up");
		obj.html("拨打电话");
		$(th).attr("date-type", "call");
		obj.attr("onclick", "call(this)");
		return ;
	}
	if(type == "call") {
		obj.addClass("btn-call-before");
		obj.html("拨号中...");
		$(th).attr("date-type", "before");
		obj.attr("onclick", "");
	} else if(type=='before'){
		obj.removeClass("btn-call-before");
		obj.addClass("btn-hang-up");
		obj.html("挂断电话");
		$(th).attr("date-type", "hang-up");
		obj.attr("onclick", "hangUp()");
	}else{
		obj.removeClass("btn-hang-up");
		obj.html("拨打电话");
		$(th).attr("date-type", "call");
		obj.attr("onclick", "call(this)");
	}
}

/*
 * 
 * 绑定改记录到当前咨询的relation中
 * @objectID：agentconversation的id
 */
function BindCallRecordToCounsel(counselID,objectID) {
	var query = new AV.Query('Counsel');
	query.get(counselID).then(function(Cousel) {
		var relation = Cousel.relation('CallRecord');
		var MyRecord = AV.Object.createWithoutData('AgentConversationRecord', objectID);
		relation.add(MyRecord);
		Cousel.save();
	});
}


/*
 * 
 * 查询状态  如果是通话结束状态 则显示关闭按钮
 */
function searchStatu(agentID) {
	var data = {
		'func': 'ivr',
		'funcdes': 'queryagentstate',
		'opernode': 'QueryAgentState',
		'operparam': {
			'agentid': agentID
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			var statu = data.Response.agents.agent.state;
			if(statu==0||statu==1){// 
				$(".calloutHpBtn").show();
				$(".calloutHpBtn").attr("value","关闭页面");
				$(".calloutHpBtn").css('background-color',"#c9302c");
				$(".calloutHpBtn").css('border-color',"#ac2925");
				$(".calloutHpBtn").attr('onclick','backToCallOut()');
			}
		},
		error: function(err) {
			// 处理调用失败
			console.log(err);
		}
	});
}
/*
 * 
 */
function backToCallOut(){
	window.location.href = '../callOut/callOutMenu.html';
}
