$(document).ready(function(){
	main();
});


function main(){
	var  ID=geturl();
	var query = new AV.Query('SaleWorkOrder');
	query.include('Saleman');
	query.get(ID,{
		success:function(obj){
            var Id = obj.id;
            var MemberName = '';
            if (obj.get("MemberName") != null) {
                MemberName = obj.get("MemberName");
            }
            
            var PhoneNo = '';
            if (obj.get("PhoneNo") != null) {
                PhoneNo = obj.get("PhoneNo");
            }
            var Memo = '';
            if (obj.get("Memo") != null) {
                Memo = obj.get("Memo");
            }
            var Statu = '';
            if (obj.get("Statu") != null) {
                Statu = obj.get("Statu");
            }
            var Saleman = '';
            if (obj.get("Saleman") != null) {
                Saleman = obj.get("Saleman").get('SalemanName');
            }
            var Saleman = '未分配';
			if(obj.get("Saleman") != null) {
				Saleman = obj.get("Saleman").get('SalemanName');
			}
			var ResultByDepartment = '';
			if(obj.get("ResultByDepartment") != null) {
				ResultByDepartment = obj.get('ResultByDepartment');
			}

			var CallbackResult = '';
			if(obj.get("CallbackResult") != null) {
				CallbackResult = obj.get('CallbackResult');
			}
            var DiseaseArray = []; //疾病数组
            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function(result) {
                    for (var j = 0; j < result.length; j++) {
                        DiseaseArray.push(result[j].get('DiseaseName'));
                    }
                    $("#MemberName").html(MemberName);
                    $("#PhoneNo").html(PhoneNo);
                    $("#Memo").html(Memo);
                    $("#Statu").html(statuToString(Statu));
                    $("#Saleman").html(Saleman);
                    $("#Disease").html(DiseaseArray.toString());
                    $("#ResultByDepartment").html(ResultByDepartment);
                    $("#CallbackResult").html(CallbackResult);
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
function save() {
	subStart();
	var CallbackResult = $("#CallbackResult").val();

	if(CallbackResult == '') {
		subEnd();
		layer.msg('请输入客服回访结果', {
			shift: 6,
			time: 600
		});
		return;
	}
	
	var ID = geturl();
	var query = new AV.Query("SaleWorkOrder");
	query.get(ID, {
		success: function(obj) {
			obj.set("CallbackResult", CallbackResult);
			var relation = obj.relation("Disease");
			obj.save(null, {  //relation修改 需要remove后保存 再从新add 再save
				success: function(obj) {
					layer.msg('保存成功', {
						time: 600
					},function(){
						window.location.reload();
					});
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
