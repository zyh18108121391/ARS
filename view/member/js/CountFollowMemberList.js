//会员搜索 模块
var pageMemberLisFirstLoad = true;
var pageMemberListMemberName = [];
var pageMemberListMemberNamePinYin = [];
var doctorObject = {};

//添加会员姓名搜索下拉
function addMemberHtml() {
	var htmlStr = '';
	for(var i = 0; i < pageMemberListMemberName.length; i++) {
		htmlStr += '<option value="' + pageMemberListMemberName[i] + '"></option>';
		pageMemberListMemberNamePinYin.push(codefans_net_CC2PY(pageMemberListMemberName[i]).toLowerCase());
	}
	$('#memberList').html(htmlStr);
}
//添加姓名搜索事件
addELByMemberName();

function addELByMemberName() {
	var ulObj = $('.member_list_by_py');
	var nameInput = $('#memberName');

	nameInput.keyup(function() {
		var t = this.value;
		var liHtmlStr = '';
		if(t) {
			var r = new RegExp('^' + t, 'g');
			for(var i = 0; i < pageMemberListMemberNamePinYin.length; i++) {
				if(r.test(pageMemberListMemberNamePinYin[i])) {
					liHtmlStr += '<li>' + pageMemberListMemberName[i] + '</li>';
				}
			}
			ulObj.html(liHtmlStr).show();
		} else {
			ulObj.html('').hide();
		}
	});

	ulObj.on('click', 'li', function() {
		var t = this.innerHTML;
		ulObj.hide();
		nameInput.val(t);
	});
}

var AgentID;
var Agent;
$(document).ready(function() {
	SearchAllObjectToSelectUl();
	ShowSelectOption("Hospital", "HospitalName", "search-Hospital"); //显示会员等级下拉列表
	var user = AV.User.current();
	var query = new AV.Query('ServiceAgent');
	query.equalTo('Account', user);
	query.first().then(function(result) {
		AgentID = result.get("AgentID");
		Agent = result;
		main();
		// 每次调用生成一个聊天实例
	});
});

//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小
var query;

function main() {
	query = new AV.Query('Member');
	var doctor = AV.Object.createWithoutData('Doctor', '576b5db5a633bd0064053436');
	query.exists('SubscribeByDoctor');
	query.notEqualTo('SubscribeByDoctor', doctor);
	query.include("SubscribeByDoctor");
	query.include("SubscribeHospital");
	query.include("PersonalAgent");
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);
}

/*
 * 搜索框的下拉提示实现
 */
function SearchAllObjectToSelectUl() {
	var queryMember = new AV.Query('Member');
	queryMember.select(['SubscribeByDoctor']);
	queryMember.exists('SubscribeByDoctor');
	queryMember.include('SubscribeByDoctor');
	queryMember.find().then(function(results) {
		var len = results.length;
		console.log(len);
		for(var i = 0; i < len; i++) {
			var obj = results[i];
			if(obj.get('SubscribeByDoctor')) {
				var SubscribeByDoctor = obj.get('SubscribeByDoctor').get('DoctorName');
				if(jQuery.inArray(SubscribeByDoctor, pageMemberListMemberName) == -1) {
					pageMemberListMemberName.push(SubscribeByDoctor);
					doctorObject[SubscribeByDoctor] = obj.get("SubscribeByDoctor").id;
				}
			}
		}
	});
}

//搜索函数
function Search() {
	page = 0; //每次搜索页数初始化
	var doctor = $("#memberName").val();
	var Hospital = $("#search-Hospital option:selected").val();
	if(doctorObject[doctor]) {
		var doctorID = doctorObject[doctor];
	}
	var timeStart = $("#timeStart").val();
	var timeEnd = $("#timeEnd").val();
	query = new AV.Query('Member');
	if(timeStart) {
		var t_s = new Date(timeStart);
		t_s.setHours(0);
		query.greaterThanOrEqualTo("createdAt", t_s);
	}
	if(timeEnd) {
		var t_e = new Date(timeEnd);
		t_e.setHours(23);
		query.lessThanOrEqualTo("createdAt", t_e);
	}
	if(doctorID) {
		var doctor = AV.Object.createWithoutData('Doctor', doctorID);
		query.equalTo('SubscribeByDoctor', doctor);
	} else {
		var doctor = AV.Object.createWithoutData('Doctor', '576b5db5a633bd0064053436');
		query.exists('SubscribeByDoctor');
		query.notEqualTo('SubscribeByDoctor', doctor);
	}
	if(Hospital != 'all') {
		var newHosp = AV.Object.createWithoutData('Hospital', Hospital);
		query.equalTo("SubscribeHospital", newHosp);
	}
	query.include("SubscribeByDoctor");
	query.include("SubscribeHospital");
	query.include("PersonalAgent");
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	query.limit(10);
	query.skip(10 * page);
	query.find({
		success: function(results) {
			if(results.length == 0) {
				layer.msg("没有找到相关结果", {
					time: 1000,
					shift: 6
				});
			} else {
				ShowObject(results);
			}
		}
	});
}

//把query后的结果集输出到table中便于公用
function ShowObject(results, pageName) {
	var len = results.length;
	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		//console.log(JSON.stringify(results[i]));
		var obj = results[i];
		var memberId = obj.id;
		var MemberName = '';
		if(obj.get("MemberName") != null) {
			MemberName = obj.get("MemberName");
		}
		var MobilePhoneNo = '未绑定';
		if(obj.get("MobilePhoneNo") != null) {
			MobilePhoneNo = obj.get("MobilePhoneNo");
		}
		var SubscribeByDoctor = '';
		var Hospital = '';
		if(obj.get("SubscribeByDoctor") != null) {
			Hospital = obj.get("SubscribeHospital") ? obj.get("SubscribeHospital").get('HospitalName') : '';
			SubscribeByDoctor = obj.get("SubscribeByDoctor").get('DoctorName');
			if(jQuery.inArray(SubscribeByDoctor, pageMemberListMemberName) == -1) {
				pageMemberListMemberName.push(SubscribeByDoctor);
				doctorObject[SubscribeByDoctor] = obj.get("SubscribeByDoctor").id;
			}
		}
		var DoctorTel = '';
		if(obj.get("SubscribeByDoctor") != null && obj.get("SubscribeByDoctor").get('MobilePhoneNo') != null) {
			DoctorTel = obj.get("SubscribeByDoctor").get('MobilePhoneNo');
		}

		var PersonalAgent = '未分配';
		if(obj.get("PersonalAgent") != null) {
			PersonalAgent = obj.get("PersonalAgent").get('AgentName');
		}
		var SaleStatu = '';
		if(obj.get("SaleStatu") != null) {
			SaleStatu = obj.get("SaleStatu");
		}
		var createdTime = obj.createdAt;

		htmlArray[i] = '<tr>' +
			'<td>' + MemberName + '</td>' +
			'<td>' + MobilePhoneNo + '</td>' +
			'<td>' + SubscribeByDoctor + '</td>' +
			'<td>' + Hospital + '</td>' +
			'<td>' + DoctorTel + '</td>' +
			'<td>' + PersonalAgent + '</td>' +
			'<td>' + timeToString(createdTime) + '</td>';
		htmlArray[i] += '<td></td>';
		htmlArray[i] += '</tr>';
	}
	for(var k = 0; k < len; k++) {
		html += htmlArray[k];
	}
	if(html != '') $("#table-body").html(html);
	//显示会员到 搜索框ul中
	if(pageMemberLisFirstLoad) {
		addMemberHtml();
		pageMemberLisFirstLoad = false;
	}
}

function reload() {
	window.location.reload();
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
			$("#" + id).append(html_op);
		}
	});
}