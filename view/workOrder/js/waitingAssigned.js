var AGETN;
$(document).ready(function(){
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
});
//主函数
function main() {
    var query = new AV.Query('SaleWorkOrder');
    query.equalTo("Agent", AGETN);
    query.equalTo("Statu",2);//状态为2
    query.descending('createdAt');
    query.find({
        success: function (results) {
            ShowObject(results);
        }
    });
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
                    htmlArray[i]= '<tr>' 
                        +'<td>' + MemberName + '</td>'
                        + '<td>' + PhoneNo + '</td>'
                        + '<td>' + DiseaseArray.toString() + '</td>'
                        + '<td>' + Memo + '</td>'
                        + '<td>' +statuToString(Statu)+ '</td>'
                        + '<td><a href="waitingAssignedDetail.html?id=' + Id + '">详情</a></td>' +
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

