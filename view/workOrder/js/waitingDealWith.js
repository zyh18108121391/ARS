var AGETN;
var AgentName;
$(document).ready(function(){
	
	user = AV.User.current();
	if(user) {
		var user = AV.User.current();
		Query = new AV.Query('ServiceAgent');
		Query.equalTo("Account", user);
		Query.first({
			success: function(cus) {
				AGETN = cus;
				AgentName  = cus.get("AgentName");
				main();
			}
		});
	}
});
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10;//翻页大小默认为10
var query = new AV.Query('SaleWorkOrder');
//主函数
function main() {
    var queryA = new AV.Query('SaleWorkOrder');
    var queryB = new AV.Query('SaleWorkOrder');
    //失败和已签约的不现实 其他都是显示在处理模块
   	queryA.notEqualTo("Statu",-1);
   	queryB.notEqualTo("Statu",21);
   	query = AV.Query.and(queryA,queryB);
    query.descending('createdAt');
    showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query);//显示当前页数据
}


//把query后的结果集输出到table中便于公用
function ShowObject(results) {
    var len = results.length;
    var html = '',htmlArray=[];
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function(i) {
            var obj = results[i];
            var Id = obj.id;
            var MemberName = '';
            if (obj.get("MemberName") != null) {
                MemberName = obj.get("MemberName");
            }
            var PhoneNo = '';
            if (obj.get("PhoneNo") != null) {
                PhoneNo = obj.get("PhoneNo");
            }
            var PurchaseIntention = '';
			if(obj.get("PurchaseIntention") != null) {
				PurchaseIntention = obj.get("PurchaseIntention");
			}
            var Memo = '';
            if (obj.get("Memo") != null) {
                Memo = obj.get("Memo");
            }
            var Statu = '';
            if (obj.get("Statu") != null) {
                Statu = obj.get("Statu");
            }
            var creatTime = obj.createdAt;
           	var updateTime = obj.updatedAt;
            var DiseaseArray = []; //疾病数组
            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function(result) {
                    for (var j = 0; j < result.length; j++) {
                        DiseaseArray.push(result[j].get('DiseaseName'));
                    }
                    htmlArray[i]= '<tr>' 
                        +'<td>' + MemberName + '</td>'
                        + '<td>' + PhoneNo + '</td>'
                        + '<td>' + DiseaseArray.toString() + '</td>'
                        + '<td>' + AgentName + '</td>'
                        +'<td>' + statuToStringPurchase(PurchaseIntention) + '</td>'
                        +'<td>' + statuToString(Statu) + '</td>'
                        + '<td class="td-content">' + Memo + '</td>'
                        + '<td class="td-time">' + timeToString(creatTime) + '</td>'
                        + '<td class="td-time">' + timeToString(updateTime) + '</td>'
                        + '<td><a href="waitingDealWithDetail.html?id=' + Id + '">处理</a></td>' +
                        '</tr>';
                  	count+=1;
                     if (count == len) {
                        for(var k=0;k<len;k++){
                            html+=htmlArray[k];
                        }
                        $("#table-body").html(html);
                    }
                }
            });
        })(i);
    }
}