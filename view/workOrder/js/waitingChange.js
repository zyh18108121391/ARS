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
    query.equalTo("Statu",1);//状态为1
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
                        + '<td><a href="waitingChangeDetail.html?id=' + Id + '">详情</a>|<a href="historyDetail.html?id=' + Id + '">编辑</a></td>' +
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
/*
 * 
 * 状态装换为中文
 * 
 */
function statuToString(statu){
	var  str;
	switch (statu){
		case 1:
			str = '新建';
			break;
		case 2:
			str = '已流转';
			break;
		case 3:
			str = '已分派销售员';
			break;
		case 4:
			str = '销售员已处理完毕';
			break;
		case 5:
			str = '已回访';
			break;
		default:
			break;
	}
	return str;
}
