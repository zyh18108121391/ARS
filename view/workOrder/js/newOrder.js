var SaleWorkOrder = AV.Object.extend("SaleWorkOrder");
var Disease = AV.Object.extend("Disease");
var AGETN; //记录登录的客服

var AgentID = null; //客服ID 外呼需用到
var CID = null; //拨打成功后返回的cid 挂断用掉
var RECORDID; //通话记录ID
var THIS;
var Pageflag = false; //记录是否弹出备注输入框 

var  MEMBER;//当前记录的会员 全局 
$(document).ready(function() {
	Event(); //绑定事件
	ShowCheckBoxs("Disease", "DiseaseName", "Disease"); //显示病情列表
	ShowSelectOption("MemberLevel", "LevelName", "MemberLevel"); //显示套餐列表
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				AGETN = cus;
				AgentID = cus.get("AgentID");
			}
		});
	}
	createNew();
	main();
});

function main() {
	var id = geturl();
	if(!id) return;
	var query = new AV.Query('Member')
	query.get(id).then(function(obj) {
		MEMBER = obj;
		if(obj.get("MemberName") != null) {
			var MemberName = obj.get("MemberName");
			$("#memberName").val(MemberName);
			$("#memberName").attr("readonly", "readonly");
		}
		if(obj.get("MobilePhoneNo") != null) {
			var MobilePhoneNo = obj.get("MobilePhoneNo");
			$("#tellNo").val(MobilePhoneNo);
			$("#tellNo").attr("readonly", "readonly");
			$("#call").show();
			$("#call").attr("name", MobilePhoneNo);
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

function selectMember() {
	$(".memberList").css("display", "block");
	$(".NewEvent").css("display", "none");

}

function SelectBack() {
	$(".memberList").css("display", "none");
	$(".NewEvent").css("display", "block");
}

/*
 * 创建新销售工单
 * 
 */
function NewWordOrder() {
	subStart();
	var name = $("#memberName").val();
	var tellNo = $("#tellNo").val();
	var notice = $("#notice").val();
	var DiseaseArray = [];
	$("#Disease input[type=checkbox]").each(function() {
		if(this.checked) {
			DiseaseArray.push($(this).val());
		}
	});
	var IntentionType = $("#Intention option:selected").val();
	var MemberLevel = $("#MemberLevel option:selected").val();
	var payType = $("#payType option:selected").val();
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
	var len = DiseaseArray.length;
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
	NewObj.set("PurchaseIntention", parseInt(IntentionType));
	var statu = '';
	switch(parseInt(IntentionType)) {
		case -1:
			statu = -1;
			break;
		case 1:
			statu = 2;
			var myLevel = AV.Object.createWithoutData("MemberLevel", MemberLevel);
			NewObj.set("ProductIntention", myLevel);
			NewObj.set("PaymentIntention", parseInt(payType));
			break;
		case 11:
			statu = 11;
			var myLevel = AV.Object.createWithoutData("MemberLevel", MemberLevel);
			NewObj.set("ProductIntention", myLevel);
			NewObj.set("PaymentIntention", parseInt(payType));
			break;
		default:
			break;
	}
	if(geturl()) {
		var newMember = AV.Object.createWithoutData('Member', geturl());
		NewObj.set("Member", newMember);
		MEMBER.set("SaleStatu", 4);//关注者的状态改为销售中
		MEMBER.save();
	}
	NewObj.set("MemberName", name);
	NewObj.set("PhoneNo", tellNo);
	NewObj.set("Memo", notice);
	NewObj.set("Statu", parseInt(statu));
	NewObj.set("Agent", AGETN);
	NewObj.save(null, {
		success: function() {
			if(geturl()) {
				layer.confirm('新建成功', {
					btn: ['查看销售工单', '返回上页'] //按钮
				}, function() {
					window.location.href = "waitingDealWith.html";
				}, function() {
					window.location.href = "../member/myFollowlist.html";
				});
			} else {
				layer.msg('新建成功', {
					time: 600
				}, function() {
					window.location.reload();
				});
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
				if(Name=='普通用户')continue;
				html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
			}
			$("#" + id).html(html_op);
		}
	});
}