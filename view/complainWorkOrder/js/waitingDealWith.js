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
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10;//翻页大小默认为10
var query = new AV.Query('ComplainWorkOrder');
//主函数
function main() {
   	query = new AV.Query('ComplainWorkOrder');
    query.equalTo("Statu",2);//状态为1
    query.include("Member");
    query.include("MemberLevel");
    query.include("Agent");
    query.include("TransferDepartment");
    query.include("ComplainLevel");
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
            if (obj.get("Member") != null) {
                MemberName = obj.get("Member").get("MemberName");
            }
            var AgentName = '';
            if (obj.get("Agent") != null) {
                AgentName = obj.get("Agent").get('AgentName');
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
            var Statu = '';
            if (obj.get("Statu") != null) {
                Statu = obj.get("Statu");
            }
            var creatTime = obj.createdAt;
            var updateTime = obj.updatedAt;
            var query=new AV.Query(RespondentsType);
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
                		+ '<td>' + AgentName + '</td>'
                		+ '<td><img src="'+LevelIcon+'" width="15px">'+ LevelName + '</td>'
               		 	+ '<td>' + ComplainLevel + '</td>'
               		 	+ '<td>' + ResTypeString + '</td>'
               		 	+ '<td>' + RespondentsName + '</td>'
               		 	+ '<td>' + Contents + '</td>'
               		 	+ '<td>' + timeToString(creatTime) + '</td>'
               		 	+ '<td>' + timeToString(updateTime) + '</td>'
               			+ '<td><a href="waitingChangeDetail.html?id=' + Id + '">详情</a>|<a href="DealWith.html?id=' + Id + '">处理</a></td>' +
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
