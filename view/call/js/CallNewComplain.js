var AGETN; //记录登录的客服
var DoctorID; //记录会员的管理医生 在医生下拉框选择时默认使用
var DoctorHtml = 1; //医生htm
var AgentHtml; //客服htm
var ButlerHtml; //管家htm
var DepartmentHtml; //部门
$(document).ready(function() {
	ShowSelectOption("ComplainLevel", "LevelName", "ComplainLevel");
	getObjectSelectHtml("Doctor", "DoctorName", "main");
	getObjectSelectHtml("ServiceAgent", "AgentName");
	getObjectSelectHtml("Butler", "ButlerName");
	getObjectSelectHtml("Department", "DepName");
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
	showMenber();//根据url中的id 显示默认投诉对象
});
/*
 * //根据url中的id 显示默认投诉对象
 */
function showMenber() {
	var id = geturl();
	var query = new AV.Query("Member");
	query.include("MemberLevel");
	query.get(id, {
		success: function(mem) {
			var tel = mem.get("MobilePhoneNo") ? mem.get("MobilePhoneNo"):'' ;
			var MemberName = mem.get("MemberName");
			var LevelName = '';
			var LevelIconUrl = '';
			DoctorID = mem.get("PersonalDoctor").id;
			var levelID='';
			if(mem.get("MemberLevel") != null) {
				levelID = mem.get("MemberLevel").id;
				LevelName = mem.get("MemberLevel").get("LevelName");
				LevelIconUrl = mem.get("MemberLevel").get("LevelIcon").url();
			}
			
			$("#tellNo").val(tel);
			$("#memberName").html(MemberName);
			$("#memberName").attr(MemberName);
			$("#M_level").html(LevelName + '<img src=\"' + LevelIconUrl + '\" width=\"15px\">');
			$("#M_level").attr("data",levelID);
			selectOpionByValue(DoctorID);
			
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
			if(DoctorID) {
				selectOpionByValue(DoctorID);
			}
		} else if(p1 == "butler") {
			$("#ComplainObject").html(ButlerHtml);
		} else {
			$("#ComplainObject").html(AgentHtml);
		}
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
	});
}

function selectMember() {
	$(".memberList").css("display", "block");
	$(".NewComplain").css("display", "none");

}

function SelectBack() {
	$(".memberList").css("display", "none");
	$(".NewComplain").css("display", "block");
}

/*
 * 创建新投诉工单
 * 
 */
function NewComplain() {
	subStart();
	var tep = 1; //投诉类型 AB
	var sth; //投诉对象类型 123
	var memberID = geturl();
	var LevelID = $("#M_level").attr("data");
	var PhoneNo = $("#tellNo").val();
	var ComplainType = $("#ComplainType option:selected").val(); //投诉类型 A/B
	var ComplainLevelID = $("#ComplainLevel option:selected").val(); //投诉级别
	var ObjectType = $("#ObjectType option:selected").val(); //投诉对象类型
	var ComplainObjectID = $("#ComplainObject option:selected").val(); //投诉对象

	if(ComplainType == "B") {
		tep = 2;
		var TransferDepartmentID = $("#TransferDepartment option:selected").val();
	}
	var Contents = $("#Contents").val(); //投诉内容
	
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
	var myMember = AV.Object.createWithoutData('Member', memberID); //投诉人会员
	var myLevel = AV.Object.createWithoutData('ComplainLevel', ComplainLevelID); //投诉等级
	var myMemberLevel = AV.Object.createWithoutData('MemberLevel', LevelID); //会员等级
	if(ObjectType == "doctor") {
		sth = 1;
		myJson={
			Doctor: ComplainObjectID
		};
	} else if(ObjectType == "butler") {
		sth = 2;
		myJson={
			Butler: ComplainObjectID
		};
	} else {
		sth = 3;
		myJson={
			ServiceAgent: ComplainObjectID
		};
	}
	if(ComplainType == "B"&&TransferDepartmentID!='all') {
		var myDep = AV.Object.createWithoutData("Department", TransferDepartmentID); //转接部门
	}
	var NewComplain = new ComplainWorkOrder();
	NewComplain.set("Member", myMember);
	NewComplain.set("Agent", AGETN);
	NewComplain.set("PhoneNo", PhoneNo);
	NewComplain.set("ComplainType", parseInt(tep));
	NewComplain.set("ComplainLevel", myLevel);
	NewComplain.set("RespondentsType", parseInt(sth));
	NewComplain.set("Respondents", myJson);
	NewComplain.set("MemberLevel", myMemberLevel);
	
	if(ComplainType == "B"&&TransferDepartmentID!='all') {
		NewComplain.set("TransferDepartment", myDep);
		NewComplain.set("Statu", 2);
	}
	if(ComplainType=='A'){
		NewComplain.set("Statu", 2);
	}
	NewComplain.set("Contents", Contents);
	NewComplain.save(null, {
		success: function() {
			layer.msg("投诉成功!",{
				time:600
			},function(){
				window.location.reload();
			});
		}
	});
}
/*
 * 获取医生，管家，客服
 * @t：有值代表页面默认显示的下拉列表 
 */
function getObjectSelectHtml(className, typeName, t) {
	var html = '';
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
				DepartmentHtml = '<option value="all">-------------------部门(非必选)-------------------</option>'+html;
			}
			if(t) {
				$("#ComplainObject").html(html);
			}
		}
	});
}

//选择新的会员 改变input框默认值
function SelectBtn() {
	if(!$("#list input[type=radio]:checked").length) {
		layer.msg("请选择一个会员", {
			shift: 6,
			time: 600
		});
		return;
	}
	var m_id = $("#list input[type=radio]:checked").attr("id");
	var m_name = $("#list input[type=radio]:checked").attr("value");
	var DoctorName = $("#list input[type=radio]:checked").attr("DoctorName");
	DoctorID = $("#list input[type=radio]:checked").attr("DoctorID");
	var PhoneNo = $("#list input[type=radio]:checked").attr("PhoneNo");
	var LevelName = $("#list input[type=radio]:checked").attr("LevelName");
	var LevelIcon = $("#list input[type=radio]:checked").attr("LevelIcon");
	var LevelID = $("#list input[type=radio]:checked").attr("LevelID");
	$("#memberName").html(m_name);
	$("#memberName").attr("data_id", m_id);
	$("#memberName").attr("LevelID", LevelID);
	$("#tellNo").val(PhoneNo);
	$(".memberList").css("display", "none");
	$(".NewComplain").css("display", "block");
	$("#M_level").html(LevelName + '<img src=\"' + LevelIcon + '\" width=\"15px\">');
	selectOpionByValue(DoctorID);
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
            $("#" + id).append(html_op);
        }
    });
}

