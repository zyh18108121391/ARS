//获取当前用户
var user = AV.User.current();

var url=window.location.search;
function getURLParameter(url,name){
    var regexp=new RegExp('(^|&)'+name+'=([^&]*)(&|$)','i');
    return url.substr(1).match(regexp)[2];
}
var EventsCalendar=AV.Object.extend('EventsCalendar');
var query = new AV.Query('EventsCalendar');
query.include('Member');
query.include('EventType');
query.include('Doctor');
query.include('Hospital');
query.include('ConsultingRoom');
query.include('MedicalResult');

//var todoFolder = AV.Object.createWithoutData('EventsCalendar', geturl());
/*var relation = todoFolder.relation('PreRecords');
var query1 = relation.query();
query1.find().then(function (results) {
    var htmlStr='';
    for(var j=0;j<results.length;j++){
        htmlStr+='<div class="col-md-2"><img src="'+results[j].get('File').url()+'" alt="no"><span>'+results[j].get('File').name().split('.')[0]+'</span></div>';
    }
    $('.row').html(htmlStr);
}, function (error) {
});*/
console.log(geturl());
query.get(geturl()).then(function(data){
    addHtml(data);
},function(error){
    alert(JSON.stringify(error)+"1123");
});

function addHtml(results){
   	
    var htmlStr='';
    var MemberId=results.get('Member').id;
    var HospitalId='';
    var Hospital='';
    var ConsultingRoom='';
    if(results.get('Hospital')){
    	HospitalId=results.get('Hospital').id;
    	Hospital=results.get('Hospital').get('HospitalName');
    	ConsultingRoom =results.get('ConsultingRoom').get('RoomName');
    }
    
    var objId=results.id;
    var EventType,Member,FirstAT,ConfirmAT,FinalAT,ConsultingRoom,Notice,Memo,
        MedicalResult,DoctorConfirm,DoctorRefuseReason,MemberConfirm,MemberRefuseReason,Statu,
        EvaluationByMember,RatingByMember,EvaluationByDoctor,RatingByDoctor,doctorName;

    EventType=results.get('EventType').get('EventTypeName');
    Member=results.get('Member').get('MemberName');
    FirstAT=results.get('FirstAT');
    ConfirmAT=results.get('ConfirmAT');
    FinalAT=results.get('FinalAT');
    
    doctorName=results.get('Doctor').get("DoctorName")||'无指定医生';
     

    Notice=results.get('Notice')||'无';
    Memo=results.get('Memo')||'无';
    
    MedicalResult=results.get('MedicalResult')?results.get('MedicalResult').get('MedicalResult'):'无';
    DoctorConfirm=results.get('DoctorConfirm')||'无';
   
    var DoctorConfirmStr='';
    if(DoctorConfirm==-969){
    	DoctorConfirmStr="需重新协调"
    }else if(DoctorConfirm==1){
    	DoctorConfirmStr="已确认"
    }else if(DoctorConfirm==-1){
    	DoctorConfirmStr="未确认"
    }

    DoctorRefuseReason=results.get('DoctorRefuseReason')||'无';
    MemberConfirm=results.get('MemberConfirm')||'无';
    var MemberConfirmStr='';
    if(MemberConfirm==-969){
    	MemberConfirmStr="需重新协调"
    }else if(MemberConfirm==1){
    	MemberConfirmStr="已确认"
    }else if(MemberConfirm==-1){
    	MemberConfirmStr="未确认"
    }
    MemberRefuseReason=results.get('MemberRefuseReason')||'无';
   	Statu=results.get('Statu');
    EvaluationByMember=results.get('EvaluationByMember')||'无';
    RatingByMember=results.get('RatingByMember')||'无';
    EvaluationByDoctor=results.get('EvaluationByDoctor')||'无';
    RatingByDoctor=results.get('RatingByDoctor')||'无';
    
   //档案输出
	
	var Reportsq = results.relation('PreRecords').query();
	Reportsq.include("ReportType");
	Reportsq.find({
		success: function(res) {
			var len_a = res.length;
			var Report_html = ' ';
			var html='';
			for (var i = 0; i < len_a; i++) {
				var obj = res[i];
				
				if(obj.get("ReportType")!=null){
					var ReportType = "["+obj.get("ReportType").get("TypeName")+"] ";
				}else{
					var ReportType="["+"待确认？"+"]";
				}
				
				var ReportUrl = obj.get("File").url();
				html+='<li>'
					+'<p class="d-img">'+'<a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >'+'<img src=\"'+ReportUrl+'\"/></a></p>'
					+'<p class="d-text"><a href="javascript:;" onclick=\"SeaReportSea(\'' + ReportUrl + '\',' + "'" + ReportType + "'" + ')\" >'+ReportType+'</a></p>'
					+'</li>';
			}
			$("#d-list").html(html);
		}
	});
   		htmlStr='<tr>'
					+'<th>会员</th>'
					+'<td>'+Member+'</td>'
					+'<th>日程状态</th>'
					+'<td><span class="statu">'+getStatus(Statu)+'</span></td>'
				+'</tr>'
				+'<tr>'
					+'<th>预约时间</th>'
					+'<td>'+getTime(FirstAT)+'</td>'
					+'<th>确认预约时间</th>'
					+'<td>'+getTime(ConfirmAT)+'</td>'
				+'</tr>'
				+'<tr>'
					+'<th>实际履约时间</th>'
					+'<td>'+getTime(FinalAT)+'</td>'
					+'<th>负责医生</th>'
					+'<td>'+doctorName+'</td>'
				+'</tr>'
				+'<tr>'
					+'<th>医院</th>'
					+'<td>'+Hospital+'</td>'
					+'<th>诊室</th>'
					+'<td>'+ConsultingRoom+'</td>'
				+'</tr>'
				+'<tr>'
					+'<th>医生确认状态</th>'
					+'<td>'+DoctorConfirmStr+'</td>'
					+'<th>医生驳回原因</th>'
					+'<td>'+DoctorRefuseReason+'</td>'
				+'</tr>'
				+'<tr>'
					+'<th>会员确认状态</th>'
					+'<td>'+MemberConfirmStr+'</td>'
					+'<th>会员驳回原因</th>'
					+'<td>'+MemberRefuseReason+'</td>'
				+'</tr>'
				+'<tr>'
					+'<th>会员评价</th>'
					+'<td>'+EvaluationByMember+'</td>'
					+'<th>会员评分</th>'
					+'<td>'+RatingByMember+'</td>'
				+'</tr>'
				+'<tr>'
					+'<th>医生评价</th>'
					+'<td>'+EvaluationByDoctor+'</td>'
					+'<th>医生评分</th>'
					+'<td>'+RatingByDoctor+'</td>'
				+'</tr>';
  /* 	htmlStr='<tr>'+
        '<td>'+Member+'</td>' +
        '<td>'+EventType+'</td>' +
        '<td>'+getTime(FirstAT)+'</td>' +
        '<td>'+getTime(ConfirmAT)+'</td>' +
        '<td>'+getTime(FinalAT)+'</td>' +
        '<td>'+Hospital+'</td>' +
        '<td>'+ConsultingRoom+'</td>' +
        '<td>'+Notice+'</td>' +
        '<td>'+Memo+'</td>' +
        '<td>'+MedicalResult+'</td>' +
        '<td>'+DoctorConfirm+'</td>' +
        '<td>'+DoctorRefuseReason+'</td>' +
        '<td>'+MemberConfirm+'</td>' +
        '<td>'+MemberRefuseReason+'</td>' +
        '<td>'+Statu+'</td>'+
        '<td>'+EvaluationByMember+'</td>'+
        '<td>'+RatingByMember+'</td>'+
        '<td>'+EvaluationByDoctor+'</td>'+
        '<td>'+RatingByDoctor+'</td>'+
       //'<td>'+ buttonHtml(DoctorConfirm,Statu,EvaluationByDoctor,RatingByDoctor)+'</td>'
        '</tr>';*/
    $('#buts').html(buttonHtml(DoctorConfirm,Statu,EvaluationByDoctor,RatingByDoctor,objId,MemberId,HospitalId));
    $("#orderTable").html(htmlStr);
}
function buttonHtml(DoctorConfirm,Statu,EvaluationByDoctor,RatingByDoctor,objId,MemberId,HospitalId){
    var butHtml='';
    if(DoctorConfirm!=1){
        butHtml+= '<a href="surePrebook.html?objId='+objId+'&HospitalId='+HospitalId+'"><button class="btn btn-danger">确认预约</button></a>' +
            '<button class="btn btn-danger">重新协调</button>';
    }else{
        if(Statu==11||Statu==21){
            butHtml+='<a href="filloutDiagnosis.html?objId='+objId+'"><button class="btn btn-danger">填写诊断结果</button></a>';
        }
        if(Statu==31){
            butHtml+='<button class="btn btn-danger">查看诊断结果</button>';
        }
        if(EvaluationByDoctor&&RatingByDoctor){
            butHtml+= '<button class="btn btn-danger">已评价</button>';
        }else{
            butHtml+= '<a href="scheduleComment.html?Member='+Member+'"><button class="btn btn-danger">评价</button></a>';
        }
    }
    return butHtml;
}
function getTime(t){
    if(t){
        var y=t.getFullYear();
        var month=t.getMonth()+1;
        var day =t.getDay();
        return y+'-'+month+'-'+day+' '+t.getHours()+':'+t.getMinutes()+':'+t.getSeconds();
    }else{
        return "待确认";
    }
}

$('.row').on('click','div',function(){
    var url=$(this).children('img').attr('src');
    $('.big_img img').attr('src',url);
    $('.big_img').show();
});
$('.big_img').click(function(){
    $(this).hide();
});


function SeaReportSea(url, typeName) {
	var html = '<img src="' + url + '"/>'
	$("#reportImg").html(html);
	$("#typeName").html(typeName);
	$("#edit_div").css("display", "block");
}
function close() {
	$("#edit_div").css("display", "none");
}