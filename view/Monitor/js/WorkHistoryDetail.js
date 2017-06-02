$(document).ready(function(){
	main();
});


function main(){
	var  ID=geturl();
	var query = new AV.Query('SaleWorkOrder');
	query.include('ProductIntention');
	query.include('Agent');
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
           /* var Saleman = '';
            if (obj.get("Saleman") != null) {
                Saleman = obj.get("Saleman").get('SalemanName');
            }*/
            var ProductIntention = '';
			if(obj.get("ProductIntention") != null) {
				ProductIntention = obj.get("ProductIntention").get("LevelName");
			}
			var PaymentIntention = '';
			if(obj.get("PaymentIntention") != null) {
				PaymentIntention = obj.get("PaymentIntention");
			}
			var PurchaseIntention = '';
			if(obj.get("PurchaseIntention") != null) {
				PurchaseIntention = obj.get("PurchaseIntention");
			}
            var AgentName= '';
            if (obj.get("Agent") != null) {
                AgentName = obj.get("Agent").get('AgentName');
            }
            var ResultByDepartment = '';
            if (obj.get("ResultByDepartment") != null) {
                ResultByDepartment = obj.get("ResultByDepartment");
            }
            
            var CallbackResult = '';
            if (obj.get("CallbackResult") != null) {
                CallbackResult = obj.get("CallbackResult");
            }
            var time = obj.createdAt;
            
            var DiseaseArray = []; //疾病数组
            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function(result) {
                    for (var j = 0; j < result.length; j++) {
                        DiseaseArray.push(result[j].get('DiseaseName'));
                    }
                    $("#Disease").html(DiseaseArray.toString());
                }
            });
            
            $("#MemberName").html(MemberName);
            $("#PhoneNo").html(PhoneNo);
            $("#time").html(timeToString(time));
            $("#Statu").html(statuToString(Statu));
            $("#Agent").html(AgentName);
            $("#saleman").html(AgentName);
            $("#PurchaseIntention").html(statuToStringPurchase(PurchaseIntention));
           	$("#ProductIntention").html(ProductIntention);
           	$("#PaymentIntention").html(statuToStringPay(PaymentIntention));
            $("#Memo").html(Memo);
            $("#ResultByDepartment").html(ResultByDepartment);
            $("#CallbackResult").html(CallbackResult);
		}
	});
}
