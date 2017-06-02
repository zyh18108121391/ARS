$(document).ready(function() {
	main();
	Event();
	ShowSelectOption("MemberLevel", "LevelName", "MemberLevel"); //显示套餐列表
	createNew();
});

var AgentID = null; //客服ID 外呼需用到
var tellNo = null; //全局电话号码
var CID = null; //拨打成功后返回的cid 挂断用掉
/*
 * 绑定事件
 * 
 */
function Event() {
	$("#Intention").change(function() {
		var val = $(this).val();
		if(val != -1) {
			$(".hiden-t").addClass("hiden");
			$(".hidenOrShow").removeClass("hide-block");
		} else {
			$(".hide-t").removeClass("hiden");
			$(".hidenOrShow").addClass("hide-block");
		}
	});
}


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
	push.open(function() {
	});

	// receive 方法是监听 message 的快捷方法
	push.receive(function(data) {
		console.log("----------"+JSON.stringify(data));
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
	if(data.agentid != AgentIDChange(AgentID)) { //推送消息不是推送给当前客服 忽略此消息
		return;
	}
	
	var statu = data.agentstate;
	if(statu==0){
		changeCallBtn();
	}
}

function main() {
	var ID = geturl();
	var query = new AV.Query('SaleWorkOrder');
	query.include('Agent');
	query.include('ProductIntention');
	query.get(ID, {
		success: function(obj) {
			var Id = obj.id;
			var MemberName = '';
			if(obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}

			var PhoneNo = '';
			if(obj.get("PhoneNo") != null) {
				PhoneNo = obj.get("PhoneNo");
				tellNo = PhoneNo;
			}
			var Memo = '';
			if(obj.get("Memo") != null) {
				Memo = obj.get("Memo");
			}
			var Statu = '';
			if(obj.get("Statu") != null) {
				Statu = obj.get("Statu");
			}
			var AgentName = '';
			if(obj.get("Agent") != null) {
				AgentID = obj.get("Agent").get('AgentID');
				AgentName = obj.get("Agent").get('AgentName');
			}

			var ProductIntentionID = '';
			if(obj.get("ProductIntention") != null) {
				ProductIntentionID = obj.get("ProductIntention").id;
			}
			var PaymentIntention = '';
			if(obj.get("PaymentIntention") != null) {
				PaymentIntention = obj.get("PaymentIntention");
			}
			var PurchaseIntention = '';
			if(obj.get("PurchaseIntention") != null) {
				PurchaseIntention = obj.get("PurchaseIntention");
			}
			var time = obj.createdAt;
			var DiseaseArray = []; //疾病数组
			var Disease = obj.relation('Disease');
			Disease.query().find({
				success: function(result) {
					for(var j = 0; j < result.length; j++) {
						DiseaseArray.push(result[j].get('DiseaseName'));
					}
					$("#MemberName").html(MemberName);
					$("#PhoneNo").html(PhoneNo);
					$("#Memo").html(Memo);
					$("#Statu").html(statuToString(Statu));
					$("#saleman").html(AgentName);
					$("#time").html(timeToString(time));
					$("#Disease").html(DiseaseArray.toString());

					if(PurchaseIntention == -1) {
						selectOption("Intention", PurchaseIntention);
					} else {
						//下拉默认设置
						selectOption("Intention", PurchaseIntention);
						selectOption("MemberLevel", ProductIntentionID);
						selectOption("payType", PaymentIntention);
						$(".hiden-t").addClass("hiden");
						$(".hidenOrShow").removeClass("hide-block");
					}
				}
			});
		}
	});
}

function selectOption(id, value) {
	$("#" + id + " option[value=" + value + "]").prop("selected", true);
}

function save() {
	subStart();
	var IntentionType = $("#Intention option:selected").val();
	var MemberLevel = $("#MemberLevel option:selected").val();
	var payType = $("#payType option:selected").val();
	var Memo = $("#Memo").val();
	var id = geturl();
	var query = new AV.Query('SaleWorkOrder');
	if(Memo == '') {
		subEnd();
		layer.msg('请输入备注', {
			shift: 6,
			time: 600
		});
		return;
	}
	query.get(id, {
		success: function(sale) {
			sale.set("PurchaseIntention", parseInt(IntentionType));
			var statu = '';
			switch(parseInt(IntentionType)) {
				case -1:
					statu = -1;
					break;
				case 1:
					statu = 2;
					var myLevel = AV.Object.createWithoutData("MemberLevel", MemberLevel);
					sale.set("ProductIntention", myLevel);
					sale.set("PaymentIntention", parseInt(payType));
					break;
				case 11:
					statu = 11;
					var myLevel = AV.Object.createWithoutData("MemberLevel", MemberLevel);
					sale.set("ProductIntention", myLevel);
					sale.set("PaymentIntention", parseInt(payType));
					break;
				default:
					break;
			}
			sale.set("Memo", Memo);
			sale.set("Statu", parseInt(statu));
			sale.save().then(function() {
				layer.msg('保存成功', {
					time: 600
				}, function() {
					window.location.reload();
				});
			});
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
function call() {
	$("#call").attr("value","呼叫中...");
	var data = {
		'func': 'ivr',
		'funcdes': 'agentmakecall',
		'opernode': 'AgentMakeCall',
		'operparam': {
			'number': tellNo,
			'agentid': AgentIDChange(AgentID),
			'disnumber': '',
			'answerurl': '',
			'agenthangupurl': ''
		}
	}
	AV.Cloud.run('RLCallIvrApi', data, {
		success: function(data) {
			// 调用成功，得到成功的应答data
			CID = data.Response.callSid;
			changeCallBtn();//改变按钮和事件
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
	$("#call").attr("value","挂断中...")
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
//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
	var html_op = '',
		obj;
	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			for(var i = 0; i < results.length; i++) {
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
 * 改变拨打按钮的文字和颜色 切换拨打和挂断
 */
function changeCallBtn() {
	var obj = $("#call");
	var type = obj.attr("name");
	if(type == "call") {
		obj.addClass("btn-hang-up");
		obj.attr("value","挂断");
		obj.attr("onclick","hangUp()");
	}else{
		obj.removeClass("btn-hang-up");
		obj.attr("value","呼叫");
		obj.attr("onclick","call()");
	}
}

/*
 * 
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
	return id + 1000;
}