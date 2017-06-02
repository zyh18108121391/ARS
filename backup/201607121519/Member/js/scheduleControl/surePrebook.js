//获取当前用户
var user = AV.User.current();

var url=window.location.search;
function getURLParameter(url,name){
    var regexp=new RegExp('(^|&)'+name+'=([^&]*)(&|$)','i');
    return url.substr(1).match(regexp)[2];
}

var queryD = new AV.Query('Doctor');
queryD.equalTo("Account", user);
var doctor;
queryD.first().then(function (data) {
    doctor=data;
    var relation1 = doctor.relation('Hospitals');
    var relation2 = doctor.relation('ConsultingRooms');
    var query1 = relation1.query();
    var query2 = relation2.query();
    query1.find().then(function (results) {
            var htmlStr='';
            for(var j=0;j<results.length;j++){
                htmlStr+='<option value="'+results[j].id+'">'+results[j].get('HospitalName')+'</option>';
            }
            $('#select1').html(htmlStr);
        },
        function (error) {alert(error)}
    );

    query2.find().then(function (results) {
            var htmlStr='';
            for(var j=0;j<results.length;j++){
                htmlStr+='<option value="'+results[j].id+'">'+results[j].get('RoomName')+'</option>';
            }
            $('#select2').html(htmlStr);
        },
        function (error) {alert(error)}
    );
});



//确认预约
$('#surePrebook').click(function(){
    var value1=$('#select1 option:selected').val();
    var value2=$('#select2 option:selected').val();
    var value3=$('#inputPassword3').val();

    if(value1&&value2&&value3){
        alert(value1+value2+value3);
        var queryD = new AV.Query('Doctor');
        queryD.equalTo("Account", user);
        queryD.first().then(function (data) {
            var todo1 = AV.Object.createWithoutData('Hospital',value1 );
            var room = AV.Object.createWithoutData('ConsultingRoom',value2 );
            var todo = AV.Object.createWithoutData('EventsCalendar',getURLParameter(url,'objId'));
            todo.set('Doctor', data);
            todo.set('Hospital', todo1);
            todo.set('ConsultingRoom', room);
            todo.set('Notice', value3);
            todo.set('DoctorConfirm', 1);
            todo.set('Statu', 11);
            todo.save().then(function(){
                alert('确认成功');
                window.location.href='../../view/scheduleControl/schedules.html';
            },function(err){alert(err)});
        }, function (error) {
            alert(error);
        });
    }else{
        alert('信息不能为空');
    }
});

//ARS协调
$('#ARSSure').click(function(){
    var value1=$('#inputPassword4').val();
    var todo = AV.Object.createWithoutData('EventsCalendar', getURLParameter(url,'objId'));
    todo.set('DoctorRefuseReason', value1);
    todo.set('DoctorConfirm', -969);
    todo.set('Statu', -969);
    todo.save().then(function(){
        alert('确认成功');
        window.location.href='../../view/scheduleControl/schedules.html';
    },function(err){alert(err)});
});



//点击按钮切换
$('.btn-primary').click(function(){
    $('.f1').show();
    $('.f2').hide();
});
$('.btn-default').click(function(){
    $('.f1').hide();
    $('.f2').show();
});

