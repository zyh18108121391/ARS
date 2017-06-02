var AgentID = null; //客服ID 外呼需用到
var CID = null; //拨打成功后返回的cid 挂断用掉
var RECORDID; //通话记录ID
var THIS;
var Pageflag = false; //记录是否弹出备注输入框 

var Statu = '';
$(document).ready(function() {
	var user = AV.User.current();
	var query = new AV.Query('ServiceAgent');
	query.equalTo('Account', user);
	query.first().then(function(result) {
		AgentID = result.get("AgentID");
		main();
		// 每次调用生成一个聊天实例
	}, function(error) {
		layer.msg('查询错误', {
			shift: 6,
			time: 600
		})
	});
	Event();
	ShowSelectOption("MemberLevel", "LevelName", "MemberLevel"); //显示套餐列表
	createNew();
});

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
			if(val == 1) {
				$(".playClass").addClass("hide-block");
				$(".playNone").removeClass("hide-block");
			}
			if(val == 11 && Statu == 11) {
				$(".playClass").removeClass("hide-block");
				$(".playNone").addClass("hide-block");
			}
		} else {
			$(".hide-t").removeClass("hiden");
			$(".hidenOrShow").addClass("hide-block");
		}
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
	if(data.objectID) {
		RECORDID = data.objectID; //agentconversation的id
	}
	var statu = data.agentstate;
	if(statu == 0) { //状态切换为0时执行
		//如果按钮已经是"拨打电话的情况 则不执行"
		var type = $("#call").attr("date-type");
		if(type != 'call') {
			changeCallBtn(THIS);
		}
		//如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
		//Pageflag为True 代标有拨打电话的动作，否则不弹窗。
		if(RECORDID && Pageflag) {
			Pageflag = false;
			SetRecordMemo(RECORDID);
		}
	}
}

function main() {
	var ID = getUrlParam('id');
	if(!getUrlParam('t')){
		$("#back").show();
		$("#call").show();
	}
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
				$("#call").attr("name", PhoneNo);
			}
			var Memo = '';
			if(obj.get("Memo") != null) {
				Memo = obj.get("Memo");
			}
			if(obj.get("Statu") != null) {
				Statu = obj.get("Statu");
			}
			var AgentName = '';
			if(obj.get("Agent") != null) {
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
					if(Statu == 11) { //如果销售成功 显示是否付款选项
						$(".playClass").removeClass("hide-block");
					} else {
						$(".playNone").removeClass("hide-block");
					}
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
/*
 * 保存动作
 * 
 */
function save() {
	subStart();
	var play = $("input[type=radio][name=play]:checked").val();
	if(play == '0') {
		savefun();
	} else {
		layer.confirm('确认用户已支付并继续？', {
			btn: ['确认', '取消'] //按钮
		}, function() {
			savefun(21); //签约
		});
	}

	function savefun(tep) {
		var IntentionType = $("#Intention option:selected").val();
		var MemberLevel = $("#MemberLevel option:selected").val();
		var payType = $("#payType option:selected").val();
		var Memo = $("#Memo").val();
		var id = getUrlParam('id');
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
				var Member = sale.get('Member');
				
				sale.set("PurchaseIntention", parseInt(IntentionType));
				var statu = '';
				switch(parseInt(IntentionType)) {
					case -1:
						statu = -1;
						if(Member)Member.set('SaleStatu',-1); //关注者状态改为销售失败
						break;
					case 1:
						statu = 2;
						var myLevel = AV.Object.createWithoutData("MemberLevel", MemberLevel);
						sale.set("ProductIntention", myLevel);
						sale.set("PaymentIntention", parseInt(payType));
						if(Member)Member.set('SaleStatu',4); //关注者状态改为销售中
						break;
					case 11:
						statu = 11;
						var myLevel = AV.Object.createWithoutData("MemberLevel", MemberLevel);
						sale.set("ProductIntention", myLevel);
						sale.set("PaymentIntention", parseInt(payType));
						if(Member)Member.set('SaleStatu',4); //关注者状态改为销售中
						break;
					default:
						break;
				}
				sale.set("Memo", Memo);
				if(tep) {
					sale.set("Statu", 21);
					if(Member)Member.set('SaleStatu',5); //关注者状态改为销售成功
					sale.save().then(function() {
						layer.confirm('保存成功，该销售单已经进入历史工单!', {
							btn: ['查看历史工单', '返回上页'] //按钮
						}, function() {
							window.location.href = "history.html";
						}, function() {
							back();
						});
					});
				} else {
					sale.set("Statu", parseInt(statu));
					sale.save().then(function() {
						layer.confirm('保存成功!', {
							btn: ['返回上一页', '取消'] //按钮
						}, function() {
							back();
						}, function() {
							window.location.reload();
						});
					});
				}
				if(Member)Member.save();
			}
		});
	}
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