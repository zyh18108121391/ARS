var Agent;
function pageStart(pageName) {
    ShowSelectOption("MemberLevel", "LevelName", "level"); //显示会员等级下拉列表
    ShowSelectOption("Disease", "DiseaseName", "Disease"); //显示病情下拉列表
    ShowSelectOption("Hospital", "HospitalName", "Hospital"); //显示病情下拉列表
    user = AV.User.current();
    if (user) {
        var user = AV.User.current();
        var Query = new AV.Query('ServiceAgent');
        Query.equalTo("Account", user);
        Query.first({
            success: function(agent) {
                Agent = agent;
                main(pageName);
            }
        });
    }
}
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小
var query = new AV.Query('Member');

var newLevel = AV.Object.createWithoutData('MemberLevel','576bd52279bc44005bdfb33c');
//主函数
function main(pageName) {
    query = new AV.Query('Member');
    //query.equalTo("PersonalAgent", Agent);
    query.notEqualTo("MemberLevel",newLevel);
    query.include("MemberLevel");
    query.include("City");
    query.include('PersonalDoctor');
    query.include('Hospital');
    query.include("PersonalAgent");
    query.include("PersonalButler");
    query.include("Account");
    query.descending('JoinTime');
    console.log(1);

    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query,pageName);
}

//把query后的结果集输出到table中便于公用
function ShowObject(results,pageName) {
    var len = results.length;
    var html = '',htmlArray=[];
    var count = 0;
    for (var i = 0; i < len; i++) {
    	//console.log(JSON.stringify(results[i]));
        (function(i) {
            var obj = results[i];
            var memberId = obj.id;

            var HeadPortrait='';
            if(obj.get("HeadPortrait")){
                HeadPortrait=obj.get("HeadPortrait").url();
            }else{
                HeadPortrait='../../images/touxiang.jpg';
            }

            var MemberName = '';
            if (obj.get("MemberName") != null) {
                MemberName = obj.get("MemberName");
                pageMemberListMemberName.push(MemberName);
            }
            var MobilePhoneNo = '';
            if (obj.get("MobilePhoneNo") != null) {
                MobilePhoneNo = obj.get("MobilePhoneNo");
            }
            var sex =-1;
            if (obj.get("Sex") != null) {
                sex = obj.get("Sex");
            }
            var LevelName = '';
            var LevelIcon = '';
            if (obj.get("MemberLevel") != null) {
                LevelName = obj.get("MemberLevel").get("LevelName");
                LevelIcon = obj.get("MemberLevel").get("LevelIcon").url();
            }
            var PersonalDoctor = '';
            if (obj.get("PersonalDoctor") != null) {
                PersonalDoctor = obj.get("PersonalDoctor").get('DoctorName');
            }
            var Hospital = '';
            if (obj.get("Hospital") != null) {
                Hospital = obj.get("Hospital").get('HospitalName');
            }

            var PersonalButler = '';
            var ButlerPhone = '';
            if (obj.get("PersonalButler") != null) {
                PersonalButler = obj.get("PersonalButler").get('ButlerName');
                ButlerPhone = obj.get("PersonalButler").get('MobilePhoneNo');
            }
            var ExpireTime = '';
            if (obj.get("ExpireTime") != null) {
                ExpireTime = obj.get("ExpireTime");
            }else{
                if (obj.get("JoinTime") != null) {
                    var JoinTime = obj.get("JoinTime");
                    ExpireTime = new Date(JoinTime);
                    ExpireTime.setFullYear(ExpireTime.getFullYear()+1);
                }
            }

            var LevelIconUrl = '';
            if (obj.get("MemberLevel") != null) {
                LevelIconUrl = obj.get("MemberLevel").get("LevelIcon").url();
            }
            var city = '';
            if (obj.get("City") != null) {
                city = obj.get("City").get("CityName");
            }
            var  PersonalAgent = '';
            if (obj.get("PersonalAgent") != null) {
                PersonalAgent = obj.get("PersonalAgent").get('AgentName');
            }
            var DiseaseArray = []; //疾病数组
            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function(result) {
                    for (var j = 0; j < result.length; j++) {
                        DiseaseArray.push(result[j].get('DiseaseName'));
                    }

                    //最后一次复诊记录查询
                    var Eventquery1 = new AV.Query('EventsCalendar');
                    var Eventquery2 = new AV.Query('EventsCalendar');
                    var Eventquery3 = new AV.Query('EventsCalendar');
                    var EventType = AV.Object.extend("EventType");
                    var Event_fuzheng = new EventType();
                    var Event_suifang = new EventType();
                    var Event_xuyao = new EventType();
                    Event_fuzheng.id = "576bd5ce1532bc005faf4133";
                    Event_suifang.id = "576bd5f7165abd00545d487e";
                    Event_xuyao.id = "576bd5ed128fe1005a14e654";

                    Eventquery1.equalTo("EventType",Event_fuzheng);
                    Eventquery2.equalTo("EventType",Event_suifang);
                    Eventquery3.equalTo("EventType",Event_xuyao);

                    var query = AV.Query.or(Eventquery1, Eventquery2);
                    var queryAll = AV.Query.or(query, Eventquery3);

                   // queryAll.equalTo("Agent", Agent);
                    queryAll.equalTo("Member", obj);
                    // 按时间，降序排列
                    queryAll.descending('FirstAT');
                    queryAll.first({
                        success: function(result) {
                            if (result) {
                                var time_3 = result.get("FirstAT");
                                if (result.get("Statu") != '31') {
                                    var time_3_html = '<span style="color:green">' + timeToString(time_3) + "(" + getStatus(result.get("Statu")) + ")" + '</span>';
                                } else {
                                    time_3_html = timeToString(time_3);
                                }
                            } else {
                                time_3_html = '';
                            }
                            count+=1;
                            if(pageName=='memberList'){
                                htmlArray[i]= '<tr>' +
                                    '<td><input type="checkbox" name="subCheck" sex="'+sex+'" memberName="'+MemberName+'" class="subCheck" MobilePhoneNo="' + MobilePhoneNo + '" Hospital="' + Hospital + ' "butlerPhone="'+ButlerPhone+'" /></td>'+
                                    '<td><img src="'+HeadPortrait+'" width="30px"></td>' +
                                    '<td>' + MemberName + '</td>' +
                                    '<td><img src="'+LevelIcon+'" width="25px">'+ LevelName + '</td>'
                                    + '<td>' + timeToStringShort(ExpireTime) + '</td>'
                                    + '<td>' + PersonalDoctor + '</td>'
                                    + '<td>' + Hospital + '</td>'
                                    + '<td>' + PersonalButler + '</td>'
                                    + '<td>' + PersonalAgent + '</td>'
                                    + '<td class="my-td">' + DiseaseArray.toString() + '</td>'
                                    + '<td>' + city + '</td>'
                                    + '<td>' +time_3_html+ '</td>'
                                    + '<td><a href="memberDetail.html?id=' + memberId + '">详情</a>|<a href="memberNewEvent.html?id=' + memberId + '">预约</a>|<a href="memberCalendar.html?id='+memberId+'">历史日程</a></td>' +
                                    '</tr>';
                            }
                            if(pageName=='memberNewEvent'){
                                htmlArray[i]='<tr>'+
                                    '<td><input type="radio" name="member" id="' + memberId + '" value="' + MemberName + '" /></td>'+
                                    '<td><img src="'+HeadPortrait+'" width="30px"></td>' +
                                    '<td>' + MemberName + '</td>' +
                                    '<td><img src="'+LevelIcon+'" width="15px">'+ LevelName + '</td>'+
                                    '<td>' + timeToStringShort(JoinTime) + '</td>' +
                                    '<td>' + DiseaseArray.toString() + '</td>' +
                                    '<td>' + city + '</td>' +
                                    '<td>' +time_3_html+ '</td>' +
                                    '<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' +
                                    '<td>' + getStartlevalDivPersonal(Activeness) + '</td>'+
                                    '</tr>'
                            }
                            if (count == len) {
                                for(var k=0;k<len;k++){
                                    html+=htmlArray[k];
                                }
                                $("#table-body").html(html);
                                if(pageMemberLisFirstLoad){
                                    addMemberHtml();
                                    pageMemberLisFirstLoad=false;
                                }
                                EventBind();
                            }
                        }
                    });
                }
            });
        })(i);
    }
}

//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
    var html_op = '',obj;
    var query = new AV.Query(className);
    query.find({
        success: function(results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                if(Name=='普通用户')continue;
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).append(html_op);
        }
    });
}
//搜索函数
function Search(pageName) {

	page = 0;//每次搜索页数初始化
	var Belong = $("#MemberBelongs option:selected").val();
    var level = $("#level option:selected").val();
    var HospitalID = $("#Hospital option:selected").val();
    var rep = $("#Disease option:selected").val();
    //var score = $("#score option:selected").val();
    var memberName = $("#memberName").val();
    var telNo = $("#telNo").val();
    if(telNo.length!=11&&telNo!=''){
    	layer.msg("电话输入不正确,请重新输入");
    	return ;
    }
    if (rep != 'all') {
        var myRep = AV.Object.createWithoutData('Disease', rep);
        query = AV.Relation.reverseQuery('Member', 'Disease', myRep);
    } else {
       query = new AV.Query('Member');
    }
    query.notEqualTo("MemberLevel",newLevel);
    if(Belong=='mine'){
    	query.equalTo("PersonalAgent", Agent);
    }
    if (level != 'all') {
        var myLe = AV.Object.createWithoutData('MemberLevel', level);
        query.equalTo("MemberLevel", myLe);
    }
    if(HospitalID!='all'){
        var Hospital = AV.Object.createWithoutData('Hospital', HospitalID);
        query.equalTo("Hospital", Hospital);
    }
    if (memberName) {
        query.equalTo("MemberName", memberName);
    }
	if(telNo) {
    	query.equalTo("MobilePhoneNo", telNo);
    }

    query.include("MemberLevel");
    query.include("City");
    query.include("PersonalAgent");
    query.include("PersonalButler");
    query.include('Hospital');
    query.include("Account");
    query.include('PersonalDoctor');
    query.descending('JoinTime');
    showPages(query); //显示页数和总条数 在limit之前使用
    query.limit(10);
	query.skip(10 * page);
    query.find({
        success: function(results) {
            if (results.length == 0) {
                layer.msg("没有找到相关结果",{time:1000,shift:6});
            }else{
            	ShowObject(results,pageName);
            }
        }
    });
}
