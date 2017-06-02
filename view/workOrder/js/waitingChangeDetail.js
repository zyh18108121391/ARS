$(document).ready(function(){
	main();
});


function main(){
	var  ID=geturl();
	var query = new AV.Query('SaleWorkOrder');
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
                    $("#Disease").html(DiseaseArray.toString());
                }
            });
		}
	});
}
