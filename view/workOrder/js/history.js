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
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber =10;//翻页大小默认为10
var query = new AV.Query('SaleWorkOrder');
//主函数
function main() {
	var queryA = new AV.Query('SaleWorkOrder');
	var queryB = new AV.Query('SaleWorkOrder');
	queryA.equalTo('Statu',-1);
	queryB.equalTo('Statu',21);
	query = AV.Query.or(queryA,queryB);
	query.include('ProductIntention');
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
}


/*
 * 
 * search fuc 搜索函数
 * 
 */
function search(){
	page = 0;//每次搜索页数初始化
	
	var statuValue =  $("#statu option:selected").val();
	var ProductValue = $("#ProductIntention option:selected").val();
	var queryA = new AV.Query('SaleWorkOrder');
	var queryB = new AV.Query('SaleWorkOrder');
	queryA.equalTo('Statu',-1);
	queryB.equalTo('Statu',21);
	query = AV.Query.or(queryA,queryB);
	if(statuValue != 0 ){
		query.equalTo("Statu", parseInt(statuValue));
	}
	if(ProductValue != 0){
		var t = AV.Object.createWithoutData("MemberLevel",ProductValue);
		query.equalTo("ProductIntention", t);
	}
	query.include('ProductIntention');
	query.descending('createdAt');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
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
			var creatTime = obj.createdAt;
            var updateTime = obj.updatedAt;
			htmlArray[i] = '<tr>' +
				'<td>' + MemberName + '</td>' +
				'<td>' + Local + '</td>' +
				'<td>' + statuToStringPurchase(PurchaseIntention) + '</td>' +
				'<td>' + ProductIntention + '</td>' +
				'<td>' + statuToString(Statu) + '</td>'+
				'<td class="td-time">' + timeToString(creatTime) + '</td>'+
                '<td class="td-time">' + timeToString(updateTime) + '</td>';
               
				if(Statu==2){
					htmlArray[i]+='<td><a href="historyDetail.html?id=' + Id + '">详情</a>|<a href="waitingDealWithDetail.html?id=' + Id + '">处理</a></td>';
				}else{
					htmlArray[i]+='<td><a href="historyDetail.html?id=' + Id + '">详情</a>';
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