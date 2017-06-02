$(document).ready(function(){
	main();
});
//主函数
function main() {
    var query = new AV.Query('ComplainWorkOrder');
    query.include("Member");
    query.include("MemberLevel");
    query.include("TransferDepartment");
    query.include("ComplainLevel");
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
            if (obj.get("Member") != null) {
                MemberName = obj.get("Member").get("MemberName");
            }
            var PhoneNo = '';
            if (obj.get("PhoneNo") != null) {
                PhoneNo = obj.get("PhoneNo");
            }
            var LevelName = '';
            var LevelIcon= '';
            if (obj.get("MemberLevel") != null) {
            	var le = obj.get("MemberLevel");
                LevelName = le.get("LevelName");
                LevelIcon = le.get("LevelIcon").url();
            }
            
            var ComplainType = '';
            if (obj.get("ComplainType") != null) {
                ComplainType = obj.get("ComplainType");
            }
            var ComplainLevel = '';
            if (obj.get("ComplainLevel") != null) {
                ComplainLevel = obj.get("ComplainLevel").get("LevelName");
            }
            var ResTypeString = '';
            if (obj.get("RespondentsType") != null) {
                var t = obj.get("RespondentsType");
               ResTypeString= ResTypeStatuToStr(t);
            }
            var RespondentsID = '';
            var RespondentsType = '';
            if (obj.get("Respondents") != null) {
               var Respondents = obj.get("Respondents");
               for(var p in Respondents){
               		RespondentsType =p;
    				RespondentsID = Respondents[p];
				}
            }
            var Contents = '';
            if (obj.get("Contents") != null) {
                Contents = obj.get("Contents");
            }
            var ResultByService = '';
            if (obj.get("ResultByService") != null) {
                ResultByService = obj.get("ResultByService");
            }
            var ResultByDepartment = '';
            if (obj.get("ResultByDepartment") != null) {
                ResultByDepartment = obj.get("ResultByDepartment");
            }
             var CallbackResult = '';
            if (obj.get("CallbackResult") != null) {
                CallbackResult = obj.get("CallbackResult");
            }
            var Statu = '';
            if (obj.get("Statu") != null) {
                Statu = obj.get("Statu");
            }
           
            var query =new AV.Query(RespondentsType);
            query.get(RespondentsID,{
            	success:function(resp){
            		
            		if(RespondentsType=="Doctor"){
            			var getName="DoctorName";
            		}else if(RespondentsType=="Butler"){
            			var getName="ButlerName";
            		}else{
            			var getName="AgentName";
            		}
            		var RespondentsName=resp.get(getName);
            		htmlArray[i]= '<tr>' 
                		+'<td>' + MemberName + '</td>'
                		+ '<td>' + PhoneNo + '</td>'
                		+ '<td><img src="'+LevelIcon+'" width="15px">'+ LevelName + '</td>'
                		+ '<td>' + ComplainType + '</td>'
               		 	+ '<td>' + ComplainLevel + '</td>'
               		 	+ '<td>' + ResTypeString + '</td>'
               		 	+ '<td>' + RespondentsName + '</td>'
               		 	+ '<td>' + Contents + '</td>'
               		 	+ '<td>' + ResultByDepartment + '</td>'
               		 	+ '<td>' + ResultByService + '</td>'
               		 	+ '<td>' + CallbackResult + '</td>'
               		 	+ '<td>' + CompStatuToString(Statu) + '</td>';
               		if(Statu==1){
               			htmlArray[i]+='<td><a href="ComplainHistoryDetail.html?id=' + Id + '">详情</a>|<a href="ComplainWaitingChangeEdit.html?id=' + Id + '">转接</a></td>';
               		}else if(Statu==3){
               			htmlArray[i]+='<td><a href="ComplainHistoryDetail.html?id=' + Id + '">详情</a>|<a href="ComplainVisit.html?id=' + Id + '">回访</a></td>';
               		}else{
               			htmlArray[i]+='<td><a href="ComplainHistoryDetail.html?id=' + Id + '">详情</td>';
               		}
               		
                	htmlArray[i]+='</tr>';
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
			str = '已转接';
			break;
		case 3:
			str = '已处理';
			break;
		case 4:
			str = '已回访';
			break;
		default:
			break;
	}
	return str;
}
