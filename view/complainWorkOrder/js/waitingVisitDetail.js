$(document).ready(function() {
	main();
});

function main() {
	var ID = geturl();
	var query = new AV.Query('ComplainWorkOrder');
	query.include("Member");
	query.include("MemberLevel");
	query.include("TransferDepartment");
	query.include("ComplainLevel");
	query.get(ID, {
		success: function(obj) {
			var Id = obj.id;
			var MemberName = '';
			if(obj.get("Member") != null) {
				MemberName = obj.get("Member").get("MemberName");
			}
			var PhoneNo = '';
			if(obj.get("PhoneNo") != null) {
				PhoneNo = obj.get("PhoneNo");
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
					$("#ComplainType").html("A类-(客服可内部处理的)");
				} else { //如果有转接部门
					$("#ComplainType").html("B类-(需转接其他部门的)");
					var DepName = obj.get("TransferDepartment").get("DepName");
					$("#TransferDepartment").html(DepName);
				}
			}
			if(obj.get("ComplainLevel") != null) {
				ComplainLevelName = obj.get("ComplainLevel").get("LevelName");
				$("#ComplainLevel").html(ComplainLevelName);
			}
			var ResTypeNumber = '';
			if(obj.get("RespondentsType") != null) {
				ResTypeNumber = obj.get("RespondentsType");
				var ResType = ResTypeStatuToStr(ResTypeNumber);
				$("#ObjectType").html(ResType);
			}
			var Statu = '';
			if(obj.get("Statu") != null) {
				Statu = obj.get("Statu");
			}
			var Contents = '';
			if(obj.get("Contents") != null) {
				Contents = obj.get("Contents");
			}
			var ResultByService = '';
			if(obj.get("ResultByService") != null) {
				ResultByService = obj.get("ResultByService");
			}
			var ResultByDepartment = '';
			if(obj.get("ResultByDepartment") != null) {
				ResultByDepartment = obj.get("ResultByDepartment");
			}
			$("#MemberName").html(MemberName);
			$("#tellNo").html(PhoneNo);
			$("#Contents").html(Contents);
			$("#ResultByService").html(ResultByService);
			$("#ResultByDepartment").html(ResultByDepartment);
			if(obj.get("Respondents") != null) {
				var Respondents = obj.get("Respondents");
				for(var p in Respondents) {
					RespondentsType = p;
					RespondentsID = Respondents[p];
				}
				 var query=new AV.Query(RespondentsType);
				query.get(RespondentsID, {
					success: function(resp) {
						if(RespondentsType == "Doctor") {
							var getName = "DoctorName";
						} else if(RespondentsType == "Butler") {
							var getName = "ButlerName";
						} else {
							var getName = "AgentName";
						}
						var RespondentsName = resp.get(getName);
						$("#ComplainObject").html(RespondentsName);
					}
				});
			}
		}
	});
}