var AGETN;
$(document).ready(function() {

	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				AGETN = cus;
				main();
			}
		});
	}
	ShowSelectOption("MemberLevel","LevelName", "ProductIntention");//显示套餐选项到搜索下拉框
});
//主函数
function main() {
	var query = new AV.Query('SaleWorkOrder');
	query.include('ProductIntention');
	query.descending('createdAt');
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}


/*
 * 
 * search fuc 搜索函数
 * 
 */
function search(){
	var statuValue =  $("#statu option:selected").val();
	var PurValue = $("#PurchaseIntention option:selected").val();
	var ProductValue = $("#ProductIntention option:selected").val();
	var query = new AV.Query('SaleWorkOrder');
	if(statuValue != 0 ){
		query.equalTo("Statu", parseInt(statuValue));
	}
	if(PurValue != 0){
		query.equalTo("PurchaseIntention", parseInt(PurValue));
	}
	if(ProductValue != 0){
		var t = AV.Object.createWithoutData("MemberLevel",ProductValue);
		query.equalTo("ProductIntention", t);
	}
	query.include('ProductIntention');
	query.descending('createdAt');
	query.find({
		success: function(results) {
			ShowObject(results);
		}
	});
}
//把query后的结果集输出到table中便于公用
function ShowObject(results) {
	var len = results.length;
	if(!len){
		layer.msg('没有查询到相关信息', {
			shift: 6,
			time: 600
		});
		return ;
	}
	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var Id = obj.id;

			var MemberName = '';
			if(obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}
			
			var Local = '暂无';
			if(obj.get("Local") != null) {
				Local = obj.get("Local");
			}
			
			var PurchaseIntention = '';
			if(obj.get("PurchaseIntention") != null) {
				PurchaseIntention = obj.get("PurchaseIntention");
			}
			
			var ProductIntention = '';
			if(obj.get("ProductIntention") != null) {
				ProductIntention = obj.get("ProductIntention").get("LevelName");
			}
			var Statu = '';
			if(obj.get("Statu") != null) {
				Statu = obj.get("Statu");
			}
			htmlArray[i] = '<tr>' +
				'<td>' + MemberName + '</td>' +
				'<td>' + Local + '</td>' +
				'<td>' + statuToStringPurchase(PurchaseIntention) + '</td>' +
				'<td>' + ProductIntention + '</td>' +
				'<td>' + statuToString(Statu) + '</td>';
				if(Statu==2){
					htmlArray[i]+='<td><a href="WorkHistoryDetail.html?id=' + Id + '">详情</a>|<a href="waitingDealWithDetail.html?id=' + Id + '">处理</a></td>';
				}else{
					htmlArray[i]+='<td><a href="WorkHistoryDetail.html?id=' + Id + '">详情</a>';
				}
				htmlArray[i]+='</tr>';
			count += 1;
			if(count == len) {
				for(var k = 0; k < len; k++) {
					html += htmlArray[k];
				}
				$("#table-body").html(html);
			}
		})(i);
	}
}

//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
    var html_op = '<option value="0">所有套餐意向</option>',obj;
    var query = new AV.Query(className);
    query.find({
        success: function(results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).html(html_op);
        }
    });
}