var AGETN; //记录登录的客服
var ObjectID; //记录被投诉人的ID 有可能是医生 管家 和 客服
var TransDepID; //记录转接部门ID
var DoctorHtml = 1; //医生htm
var AgentHtml; //客服htm
var ButlerHtml; //管家htm
var DepartmentHtml; //部门

$(document).ready(function() {
	EditMain();
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				AGETN = cus;
			}
		});
	}
	BindEvent();
});

function EditMain() {
	var ID = geturl();
	query = new AV.Query("ComplainWorkOrder");
	query.include("Member");
	query.include("MemberLevel");
	query.include("TransferDepartment");
	query.include("ComplainLevel");
	query.get(ID, {
		success: function(obj) {
			var MemberName = '';
			if(obj.get("Member") != null) {
				MemberName = obj.get("Member").get("MemberName");
				$("#MemberName").html(MemberName);
			}
			var PhoneNo = '';
			if(obj.get("PhoneNo") != null) {
				PhoneNo = obj.get("PhoneNo");
				$("#tellNo").val(PhoneNo);
			}
			var LevelName = '';
			var LevelIcon = '';
			if(obj.get("MemberLevel") != null) {
				var le = obj.get("MemberLevel");
				LevelName = le.get("LevelName");
				LevelIcon = le.get("LevelIcon").url();
				$("#M_level").html(LevelName + '<img src=\"' + LevelIcon + '\" width=\"15px\">');
			}
			var ComplainType = '';
			if(obj.get("ComplainType") != null) {
				ComplainType = obj.get("ComplainType");
				if(ComplainType == 1) {
					getObjectSelectHtml("Department", "DepName");
					$("#ComplainType option[value=A]").prop("selected", true);
					$("#TransferDepartment").addClass("hiden-doc");
				} else { //如果有转接部门
					$("#ComplainType option[value=B]").prop("selected", true);
					var transDepID = obj.get("TransferDepartment") ? obj.get("TransferDepartment").id : '';
					TransDepID = transDepID;
					getObjectSelectHtml("Department", "DepName", "TransferDepartment", transDepID);
				}
			}
			var ComplainLevelID = '';
			if(obj.get("ComplainLevel") != null) {
				ComplainLevelID = obj.get("ComplainLevel").id;
				ShowSelectOptionAndSel("ComplainLevel", "LevelName", "ComplainLevel", ComplainLevelID);
			}
			var ResTypeNumber = '';
			if(obj.get("RespondentsType") != null) {
				ResTypeNumber = obj.get("RespondentsType");
			}
			var RespondentsID = ''; //被投诉人ID
			var RespondentsType = ''; //被投诉人类型
			if(obj.get("Respondents") != null) {
				var Respondents = obj.get("Respondents");
				for(var p in Respondents) {
					RespondentsType = p;
					RespondentsID = Respondents[p];
				}
				ObjectID = RespondentsID;
				//根据被投诉类型和被投诉人对象 显示下拉列表并且选中
				if(ResTypeNumber == 1) { //医生
					$("#ObjectType option[value=doctor]").prop("selected", true);
					getObjectSelectHtml("Doctor", "DoctorName", "ComplainObject", RespondentsID);
					getObjectSelectHtml("ServiceAgent", "AgentName");
					getObjectSelectHtml("Butler", "ButlerName");
				} else if(ResTypeNumber == 2) {
					$("#ObjectType option[value=butler]").prop("selected", true);
					getObjectSelectHtml("Doctor", "DoctorName");
					getObjectSelectHtml("ServiceAgent", "AgentName");
					getObjectSelectHtml("Butler", "ButlerName", "ComplainObject", RespondentsID);
				} else {
					$("#ObjectType option[value=agent]").prop("selected", true);
					getObjectSelectHtml("Doctor", "DoctorName");
					getObjectSelectHtml("ServiceAgent", "AgentName", "ComplainObject", RespondentsID);
					getObjectSelectHtml("Butler", "ButlerName");
				}
			}
			var Contents = '';
			if(obj.get("Contents") != null) {
				Contents = obj.get("Contents");
			}
			var ResultByService = '';
			if(obj.get("ResultByService") != null) {
				ResultByService = obj.get("ResultByService");
			}

			$("#Contents").val(Contents);
			$("#ResultByService").val(ResultByService);

		}
	});

}
/*
 * 
 * select Option
 * 
 */
function selectOpionByValue(value) {
	$("#ComplainObject option[value=" + value + "]").prop("selected", true);
}

/*
 * 绑定事件
 */
function BindEvent() {
	$('#ObjectType').change(function() {
		var p1 = $(this).children('option:selected').val(); //这就是selected的值
		if(p1 == "doctor") {
			$("#ComplainObject").html(DoctorHtml);
		} else if(p1 == "butler") {
			$("#ComplainObject").html(ButlerHtml);
		} else {
			$("#ComplainObject").html(AgentHtml);
		}
		$("#ComplainObject option[value=" + ObjectID + "]").prop("selected", true);
	});
	$('#ComplainType').change(function() {
		var p1 = $(this).children('option:selected').val(); //这就是selected的值
		if(p1 == "A") {
			$("#TransferDepartment").addClass("hiden-doc");
			$("#TransferDepartment").html('');
			$("#TransferDepartment").attr("disabled", "disabled");
		}
		if(p1 == "B") {
			$("#TransferDepartment").removeClass("hiden-doc");
			$("#TransferDepartment").html(DepartmentHtml);
			$("#TransferDepartment").removeAttr("disabled");
		}
		$("#TransferDepartment option[value=" + TransDepID + "]").prop("selected", true);
	});
}

/*
 * 编辑投诉工单
 * 
 */
function EditComplain(type) {
	subStart();
	var tep = 1; //投诉类型 AB
	var sth; //投诉对象类型 123
	var PhoneNo = $("#tellNo").val();
	var ComplainType = $("#ComplainType option:selected").val(); //投诉类型 A/B
	var ComplainLevelID = $("#ComplainLevel option:selected").val(); //投诉级别
	var ObjectType = $("#ObjectType option:selected").val(); //投诉对象类型
	var ComplainObjectID = $("#ComplainObject option:selected").val(); //投诉对象

	if(ComplainType == "B") { //转接部门
		tep = 2;
		var TransferDepartmentID = $("#TransferDepartment option:selected").val();
	}
	var Contents = $("#Contents").val(); //投诉内容
	var ResultByService = $("#ResultByService").val(); //客服处理内容
	if(PhoneNo == '') {
		subEnd();
		layer.msg('联系电话不能为空', {
			shift: 6,
			time: 600
		})
		return;
	}
	if(Contents == '') {
		subEnd();
		layer.msg('投诉内容不能为空', {
			shift: 6,
			time: 600
		})
		return;
	}
	if(ObjectType == "doctor") {
		sth = 1;
		myJson = {
			Doctor: ComplainObjectID
		};
	} else if(ObjectType == "butler") {
		sth = 2;
		myJson = {
			Butler: ComplainObjectID
		};
	} else {
		sth = 3;
		myJson = {
			ServiceAgent: ComplainObjectID
		};
	}
	if(ComplainType == "B" && TransferDepartmentID != 'all') {
		var myDep = AV.Object.createWithoutData("Department", TransferDepartmentID); //转接部门
	} else if(ComplainType == "B" && TransferDepartmentID == 'all' && type == 2) {
		subEnd();
		layer.msg('投诉类型为B类，请选择转接部门！', {
			shift: 6,
			time: 1000
		})
		return;
	}
	var myLevel = AV.Object.createWithoutData('ComplainLevel', ComplainLevelID); //投诉等级

	var ID = geturl();
	var query = new AV.Query("ComplainWorkOrder");
	query.get(ID, {
		success: function(obj) {
			obj.set("PhoneNo", PhoneNo);
			obj.set("ComplainType", parseInt(tep));
			obj.set("ComplainLevel", myLevel);
			obj.set("RespondentsType", parseInt(sth));
			obj.set("Respondents", myJson);
			obj.set("Contents", Contents);
			if(ComplainType == "B" && TransferDepartmentID != 'all') {
				obj.set("TransferDepartment", myDep);
			} else if(ComplainType == "B" && TransferDepartmentID == 'all') {
				obj.set("TransferDepartment", null);
			}
			if(ComplainType == 'A') {
				obj.set("TransferDepartment", null);
			}
			if(ResultByService) {
				obj.set("ResultByService", ResultByService);
			}
			if(type == 2) {
				obj.set("Statu", 2);
			}
			obj.save(null, {
				success: function(obj) {
					if(type == 1) {
						layer.msg('保存成功', {
							time: 600
						}, function() {
							back();
						});
					} else {
						layer.confirm('保存并转接成功!', {
							btn: ['查看结果', '返回上页'] //按钮
						}, function() {
							window.location.href = "waitingDealWith.html";
						}, function() {
							back();
						});
					}
				},
				error: function(obj) {
					subEnd();
					layer.msg('编辑失败，请重试', {
						time: 600
					});
				}
			});
		}
	});
}

/*
 * 获取医生，管家，客服
 * domID：默认显示的下拉列表dom id
 * optionId：编辑页面 工单原有的选中
 */
function getObjectSelectHtml(className, typeName, domID, optionId) {
	var html = '';
	if(className == 'Department') {
		html = '<option value="all">------------------请选择部门----------------------</option>';
	}

	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			for(var i = 0; i < results.length; i++) {
				obj = results[i];
				var Name = obj.get(typeName);
				html += '<option value="' + obj.id + '">' + Name + '</option>';
			}
			if(className == "Doctor") {
				DoctorHtml = html;
			} else if(className == "ServiceAgent") {
				AgentHtml = html;
			} else if(className == "Butler") {
				ButlerHtml = html;
			} else {
				DepartmentHtml = html;
			}
			if(domID) {
				$("#" + domID).html(html);
				if(optionId != '') {
					$("#" + domID + " option[value=" + optionId + "]").prop("selected", true);
				}
			}
		}
	});
}

/*
 * 
 * 
 */
//显示下拉框列表
function ShowSelectOptionAndSel(className, typeName, id, optionId) {
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
			$("#" + id).append(html_op);
			$("#" + id + " option[value=" + optionId + "]").prop("selected", true);
		}
	});
}