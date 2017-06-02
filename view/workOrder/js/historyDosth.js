$(document).ready(function() {
	main();
});
var Disease = AV.Object.extend("Disease");
var STATU; //记录该单的状态

function main() {
	var ID = geturl();
	var query = new AV.Query('SaleWorkOrder');
	query.include('Saleman');
	query.include('Agent');
	query.get(ID, {
		success: function(obj) {
			var Id = obj.id;

			var Statu = '';
			if(obj.get("Statu") != null) {
				Statu = obj.get("Statu");
				STATU = Statu;
			}

			var MemberName = '';
			if(obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}
			var Agent = '';
			if(obj.get("Agent") != null) {
				Agent = obj.get("Agent").get('AgentName');
			}
			var PhoneNo = '';
			if(obj.get("PhoneNo") != null) {
				PhoneNo = obj.get("PhoneNo");
			}
			var Memo = '';
			if(obj.get("Memo") != null) {
				Memo = obj.get("Memo");
			}
			var Saleman = '未分配';
			if(obj.get("Saleman") != null) {
				Saleman = obj.get("Saleman").get('SalemanName');
			}
			var ResultByDepartment = '无';
			if(obj.get("ResultByDepartment") != null) {
				ResultByDepartment = obj.get('ResultByDepartment');
			}

			var CallbackResult = '无';
			if(obj.get("CallbackResult") != null) {
				CallbackResult = obj.get('CallbackResult');
			}

			DiseaseIDArray = []; //疾病的id数组
			var DiseaseArray = []; //疾病中文数组
			var Disease = obj.relation('Disease');
			Disease.query().find({
				success: function(result) {
					for(var j = 0; j < result.length; j++) {
						DiseaseIDArray.push(result[j].id);
						DiseaseArray.push(result[j].get("DiseaseName"));
					}
					if(Statu == 1) { //新单 可修改
						var tempName = '<input type="text" class="MemberName" name="" value="' + MemberName + '" />';
						$("#MemberName").html(tempName);

						var tempPh = '<input type="text" class="PhoneNo" name="" value="' + PhoneNo + '" />';
						$("#PhoneNo").html(tempPh);
						ShowCheckBoxsAndChecked("Disease", "DiseaseName", "Disease", DiseaseIDArray); //显示病情列表

						var tempMemo = '<textarea class="Memo" name="" rows="" cols="" style="width: 300px;" placeholder="备注">' + Memo + '</textarea>';
						$("#Memo").html(tempMemo);
						$("#ResultByDepartment").html(ResultByDepartment);
						$("#CallbackResult").html(CallbackResult);
						$("#Saleman").html(Saleman);

						$(".btn-div1").css("display", "block");
					} else if(Statu == 4) {
						$("#MemberName").html(MemberName);
						$("#PhoneNo").html(PhoneNo);
						$("#Disease").html(DiseaseArray.toString());
						$("#Memo").html(Memo);
						$("#Saleman").html(Saleman);
						$("#ResultByDepartment").html(ResultByDepartment);
						var tempCallbackResult = '<textarea class="CallbackResult" name="" rows="" cols="" style="width: 300px;" placeholder="客服回访结果">' + CallbackResult + '</textarea>';
						$("#CallbackResult").html(tempCallbackResult);
						$(".btn-div4").css("display", "block");
					} else {
						$("#MemberName").html(MemberName);
						$("#PhoneNo").html(PhoneNo);
						$("#Disease").html(DiseaseArray.toString());
						$("#Memo").html(Memo);
						$("#Saleman").html(Saleman);
						$("#ResultByDepartment").html(ResultByDepartment);
						$("#CallbackResult").html(CallbackResult);
					}
					$("#Agent").html(Agent);
					$("#Statu").html(statuToString(Statu));
				}
			});
		}
	});
}

/*
 * 状态为新单时的 statu==1 动作
 * 保存、修改
 * @tap save：保存  change：流转
 */
function saveA(tap) {
	subStart();
	var name = $(".MemberName").val();
	var tellNo = $(".PhoneNo").val();
	var notice = $(".Memo").val();
	var DiseaseArray = [];

	$("#Disease input[type=checkbox]").each(function() {
		if(this.checked) {
			DiseaseArray.push($(this).val());
		}
	});

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
	var ID = geturl();
	var query = new AV.Query("SaleWorkOrder");
	query.get(ID, {
		success: function(obj) {

			obj.set("MemberName", name);
			obj.set("PhoneNo", tellNo);
			obj.set("Memo", notice);
			if(tap == 'change') {
				obj.set("Statu", 2);
			}
			var relation = obj.relation("Disease");
			//删除以前的relation

			for(var i = 0; i < DiseaseIDArray.length; i++) {
				var did = DiseaseIDArray[i];
				var newDiease = new Disease();
				newDiease.id = did;
				relation.remove(newDiease);
			}
			obj.save(null, {  //relation修改 需要remove后保存 再从新add 再save
				success: function(obj) {
					//增加新的relation
					for(var j = 0; j < len; j++) {
						var ID = DiseaseArray[j];
						var MyDisease = new Disease();
						MyDisease.id = ID;
						relation.add(MyDisease);
					}
					obj.save(null, {
						success: function(obj) {
							if(tap == 'save') {
								layer.msg('保存成功', {
									time: 600
								}, function() {
									window.location.reload();
								});
							} else {
								layer.msg('保存成功并流转', {
									time: 600
								}, function() {
									window.location.reload();
								});
							}
						},
						error:function(error){
							layer.msg('保存失败，请重试', {
								time: 600
							});
						}
					})
				},
				error:function(error){
					layer.msg('保存失败，请重试', {
						time: 600
					});
				}
			});
		}
	});
}


/*
 * 状态为销售员已处理完毕  statu==4时的 动作
 * 保存、修改
 * @tap save：保存  change：流转
 */
function saveB(tap) {
	subStart();
	var name = $(".MemberName").val();
	var tellNo = $(".PhoneNo").val();
	var notice = $(".Memo").val();
	var DiseaseArray = [];

	$("#Disease input[type=checkbox]").each(function() {
		if(this.checked) {
			DiseaseArray.push($(this).val());
		}
	});

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
	var ID = geturl();
	var query = new AV.Query("SaleWorkOrder");
	query.get(ID, {
		success: function(obj) {

			obj.set("MemberName", name);
			obj.set("PhoneNo", tellNo);
			obj.set("Memo", notice);
			if(tap == 'change') {
				obj.set("Statu", 2);
			}
			var relation = obj.relation("Disease");
			//删除以前的relation

			for(var i = 0; i < DiseaseIDArray.length; i++) {
				var did = DiseaseIDArray[i];
				var newDiease = new Disease();
				newDiease.id = did;
				relation.remove(newDiease);
			}
			obj.save(null, {  //relation修改 需要remove后保存 再从新add 再save
				success: function(obj) {
					//增加新的relation
					for(var j = 0; j < len; j++) {
						var ID = DiseaseArray[j];
						var MyDisease = new Disease();
						MyDisease.id = ID;
						relation.add(MyDisease);
					}
					obj.save(null, {
						success: function(obj) {
							if(tap == 'save') {
								layer.msg('保存成功', {
									time: 600
								}, function() {
									window.location.reload();
								});
							} else {
								layer.msg('保存成功并流转', {
									time: 600
								}, function() {
									window.location.reload();
								});
							}
						}
					})
				}
			});
		}
	});
}