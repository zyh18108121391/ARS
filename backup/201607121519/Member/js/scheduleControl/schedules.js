//获取当前用户
var user = AV.User.current();

var EventsCalendar=AV.Object.extend('EventsCalendar');
var query = new AV.Query('EventsCalendar');
query.include('EventType');
query.include('Member');
query.include('Hospital');
query.include('ConsultingRoom');
query.include('MedicalResult');
if(geturl()){
	var Member = AV.Object.createWithoutData('Member',geturl());
	query.equalTo('Member', Member);
}
query.descending('createdAt');
if(geturl()){
	var Member = AV.Object.createWithoutData('Member',geturl());
	query.equalTo('Member', Member);
}
var queryD = new AV.Query('Doctor');
queryD.equalTo("Account", user);

queryD.first().then(function (data) {
    query.equalTo('Doctor', data);
    query.find().then(function (results) {
        //alert(JSON.stringify(results));
        addHtml(results,31);//已完成代号31
    }, function (error) {
        alert(JSON.stringify(error));
    });
});

function addHtml(results,s){
    var htmlStrComplete='',htmlStr='',tStr;
    var ConfirmAT,Hospital,ConsultingRoom,MedicalResult;
    var Member,HospitalId;
    var objId,EventType,DoctorConfirm,Statu,RatingByMember,EvaluationByDoctor,RatingByDoctor;
    for(var i=0;i<results.length;i++){
        objId=results[i].id;
        Member=results[i].get('Member')?results[i].get('Member').id:0;
        var MemberName=results[i].get('Member')?results[i].get('Member').get("MemberName"):0;
        console.log(MemberName);
        if(MemberName=='0'){
        	console.log(objId);
        }
        HospitalId=results[i].get('Hospital')?results[i].get('Hospital').id:0;
        
        EventType=results[i].get('EventType')?results[i].get('EventType').get('EventTypeName'):'无';
        ConfirmAT=results[i].get('ConfirmAT');
        Hospital=results[i].get('Hospital')?results[i].get('Hospital').get('HospitalName'):'无';
        ConsultingRoom=results[i].get('ConsultingRoom')?results[i].get('ConsultingRoom').get('RoomName'):'无';
        MedicalResult=results[i].get('MedicalResult')?results[i].get('MedicalResult').get('MedicalResult'):'无';
        DoctorConfirm=results[i].get('DoctorConfirm');
        Statu=results[i].get('Statu');

        RatingByMember=results[i].get('RatingByMember')||'无';
        EvaluationByDoctor=results[i].get('EvaluationByDoctor');
        RatingByDoctor=results[i].get('RatingByDoctor');
        tStr='<tr id="'+objId+'">'+
        	'<td class="goToSd"><a href=scheduleDetail.html?id='+objId+' </a>'+MemberName+'</td>' +
            '<td class="goToSd">'+EventType+'</td>' +
            '<td class="goToSd">'+getTime(ConfirmAT)+'</td>' +
            '<td class="goToSd">'+Hospital+'</td>' +
            '<td class="goToSd">'+ConsultingRoom+'</td>' +
            '<td class="goToSd">'+MedicalResult+'</td>' +
            '<td class="goToSd">'+Statu+'</td>'+
            '<td class="goToSd">'+RatingByMember+'</td>'+
            '<td>'+ buttonHtml(DoctorConfirm,Statu,EvaluationByDoctor,RatingByDoctor,objId,Member,HospitalId)+'</td>'+
            '</tr>';
        if(Statu==s){
            htmlStrComplete+=tStr;
        }else{
            htmlStr+= tStr;
        }
    }
    $('#tr_info').append(htmlStr+htmlStrComplete);
}
function buttonHtml(DoctorConfirm,Statu,EvaluationByDoctor,RatingByDoctor,objId,Member,HospitalId){
    var butHtml='';
    if(DoctorConfirm!=1&&Statu!=-969){
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
/*
$('#tr_info').on('click','.goToSd',function(){
    location.href='scheduleDetail.html?id='+$(this).parent().attr('id');
});*/

