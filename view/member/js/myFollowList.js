var AgentID;
var Agent;
$(document).ready(function() {
	ShowSelectOption("Hospital", "HospitalName", "search-Hospital"); //显示会员等级下拉列表

	var user = AV.User.current();
	var query = new AV.Query('ServiceAgent');
	query.equalTo('Account', user);
	query.first().then(function(result) {
		AgentID = result.get("AgentID");
		Agent = result;
		main();
	}, function(error) {
		layer.msg('查询错误', {
			shift: 6,
			time: 600
		})
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
	query.equalTo('PersonalAgent', Agent);
	query.equalTo('SaleStatu', 3);

	query.include("SubscribeByDoctor");
	query.include("SubscribeHospital");
	query.include("PersonalAgent");
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);
}

//搜索函数
function Search() {
	page = 0; //每次搜索页数初始化
	var Statu = $("#search-Statu option:selected").val();
	var Hospital = $("#search-Hospital option:selected").val();
	var timeStart = $("#timeStart").val();
	var timeEnd = $("#timeEnd").val();
	query = new AV.Query('Member');
	query.equalTo('PersonalAgent', Agent);
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
	if(Statu != 'all') {
		query.equalTo("SaleStatu", parseInt(Statu));
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
		(function(i) {
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
			if(obj.get("SubscribeByDoctor") != null) {
				SubscribeByDoctor = obj.get("SubscribeByDoctor").get('DoctorName');
			}
			var SubscribeHospital = '无';
			if(obj.get("SubscribeHospital") != null) {
				SubscribeByDoctor = obj.get("SubscribeHospital").get('HospitalName');
			}
			var SaleStatu = '';
			if(obj.get("SaleStatu") != null) {
				SaleStatu = obj.get("SaleStatu");
			}
			var createdTime = obj.createdAt;
			var query = new AV.Query('SaleWorkOrder');
			query.equalTo('Member', obj);
			query.first().then(function(obj) {
				if(obj) {
					var workID = obj.id;
				}
				htmlArray[i] = '<tr>' +
					'<td>' + MemberName + '</td>' +
					'<td>' + MobilePhoneNo + '</td>' +
					'<td>' + SubscribeByDoctor + '</td>' +
					'<td>' + SubscribeHospital + '</td>' +
					'<td>' + getSaleStatus(SaleStatu) + '</td>' +
					'<td>' + timeToString(createdTime) + '</td>';
				if(SaleStatu == 3) { //已分配的 可以电话销售
					htmlArray[i] += '<td><a class="btn btn-danger" href="../workOrder/newOrder.html?=' + memberId + '">电话销售 </a></td>';
				} else if(SaleStatu == 1) { //已关注的  不显示操作
					htmlArray[i] += '<td></td>';
				}else if(SaleStatu == -1||SaleStatu == 5){//销售或者成功 进入历史销售工单详情
					htmlArray[i] += '<td><a href="../workOrder/historyDetail.html?=' + workID + '">详情 </a></td>';
				}else { //其他状态  销售中 进入销售处理页面
					htmlArray[i] += '<td><a href="../workOrder/waitingDealWithDetail.html?=' + workID + '">详情 </a></td>';
				}
				htmlArray[i] += '</tr>';
				count += 1;
				if(count == len) {
					for(var k = 0; k < len; k++) {
						html += htmlArray[k];
					}
					if(html != '') $("#table-body").html(html);
				}
			});
		})(i);
	}
}
/*
 * 客服领取该会员  绑定客服
 * 
 */
function bindAgent(id) {
	var query = new AV.Query('Member');
	query.get(id).then(function(member) {
		member.set('PersonalAgent', Agent);
		member.set("SaleStatu", 3);
		member.save().then(function(obj) {
			layer.confirm('领取成功', {
				btn: ['查看领取列表', '继续'] //按钮
			}, function() {

			}, function() {
				window.location.reload();
			});
		});
	});
}

//状态切换函数
function getSaleStatus(status) {
	var statusString = "";
	switch(status) {
		case -1:
			statusString = "销售失败";
			break;
		case 1:
			statusString = "已关注";
			break;
		case 2:
			statusString = "待分配"; //绑定了电话
			break;
		case 3:
			statusString = "已分配"; //分配了客服
			break;
		case 4:
			statusString = "销售中";
			break;
		case 5:
			statusString = "销售成功";
			break;
		default:
			statusString = "未知状态";
			break;
	}
	return statusString;
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

function reload() {
	window.location.reload();
}