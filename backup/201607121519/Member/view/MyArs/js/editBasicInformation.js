//栏目切换
$('.row1').on('click','div',function(){
    var cSelect=$('.selected');
    $('#'+cSelect.attr('data-id')).hide();
    cSelect.removeClass('selected');
    $(this).addClass('selected');
    $('#'+$(this).attr('data-id')).show();
});

//事件
$('.bd').click(function(){
    $('#upFile').show();
});
$('.add_but').click(function(){
    $('.select_hos').show();
});
$('#upFile').click(function(e){
    $(this).hide();
});
$('.select_hos').click(function(e){
    $(this).hide();
});
$('.inner').click(function(e){
    e.stopPropagation();
});
$('.select_d').click(function(e){
    e.stopPropagation();
});

//获取当前用户
var user = AV.User.current();

//读取数据
var query = new AV.Query('Doctor');

query.equalTo("Account", user);
query.first().then(function (data) {
    $('.d_name').val(data.get('DoctorName'));
    var relation1=data.relation('Hospitals');
    var relation2=data.relation('ConsultingRooms');
    var query1 = relation1.query();
    var query2 = relation2.query();
    var htmlStr1='',htmlStr2,hospital_name,hospital_name1,room_name,hospital_address,room_address;
    query1.find().then(function (results) {
        for(var i=0;i<results.length;i++){
            hospital_name=results[i].get('HospitalName');
            hospital_address=results[i].get('Address');
            htmlStr1+='<form class="form-horizontal f">'+
                '<label class="">医院名称：</label>'+
                '<input type="text" class="form-control" disabled value="'+hospital_name+'">'+
                '<label class=" ">地址：</label>'+
                '<input type="text" class="form-control" disabled value="'+hospital_address+'">'+
            '</form>';
        }
        $('#hospital').html(htmlStr1);
    }, function (error) {
    });
    //诊室
    query2.include('Hospital');
    query2.find().then(function (results) {
        for(var i=0;i<results.length;i++){
            hospital_name1=results[i].get('Hospital').get('HospitalName');
            room_name=results[i].get('RoomName');
            room_address=results[i].get('Address');
            htmlStr2+='<tr>'+
                '<td>'+hospital_name1+'</td><td>'+room_name+'</td><td>'+room_address+'</td><td><button id="'+results[i].id+'" class=" delete_room btn btn-primary">删除</button></td>'+
                '</tr>';
        }
        $('tbody').html(htmlStr2);
    },function (error) {});

}, function (error) {
    alert('error');
});

//显示所有医院
var queryHos = new AV.Query('Hospital');
queryHos.find().then(function(results){
    var optionStr='';
    for(var i=0;i<results.length;i++){
        optionStr+='<option value="'+results[i].id+'">'+results[i].get('HospitalName')+'</option>';
    }
    $('.hosSelect').html(optionStr);

},function(){});


//添加科室
$('.sure_add').click(function(){
    var hosId=$('.hosSelect option:selected').val();
    var Hospital=AV.Object.createWithoutData('Hospital', hosId);
    var roomObj=$('.roomI');
    var roomName=roomObj[0].value;
    var roomAddress=roomObj[1].value;
    if(roomName&&roomAddress){
        var ConsultingRoom = AV.Object.extend('ConsultingRoom');
        var consultingRoom = new ConsultingRoom();
        consultingRoom.set('RoomName', roomName);
        consultingRoom.set('Address', roomAddress);
        consultingRoom.set('Hospital', Hospital);
        consultingRoom.save().then(function (todo) {
            var query = new AV.Query('Doctor');
            query.equalTo("Account", user);
            query.first().then(function (data) {
                var relation=data.relation('ConsultingRooms');
                relation.add(todo);
                data.save().then(function () {
                    alert('添加成功');
                    window.location.reload();
                },function(){});
            },function(){});

        }, function (error) {
            // 失败之后执行其他逻辑
            console.log('Failed to create new object, with error message: ' + error.message);
        });
    }else{
        alert('请填写信息');
    }
});

//删除科室
$('tbody').on('click','.delete_room',function(){
    var id=$(this).attr('id');
    var todo = AV.Object.createWithoutData('ConsultingRoom', id);
    var sureDelete=confirm('确定删除吗？');
    if(sureDelete){
        var query = new AV.Query('Doctor');
        query.equalTo("Account", user);
        query.first().then(function (data) {
            var relation=data.relation('ConsultingRooms');
            relation.remove(todo);
            data.save().then(function () {
                alert('删除成功');
                window.location.reload();
            },function(){});
        },function(){});
    }
});

//密码部分
$('.phoneNum').text(user.get('username'));

$('.changePhoneNum').click(function(){
    $('.change_pho_pass').show();
    $('.phone').show();
});
$('.changePassword').click(function(){
    $('.change_pho_pass').show();
    $('.passN').show();
});
$('.change_pho_pass').click(function(e){
    $(this).hide();
    $('.passN').hide();
    $('.phone').hide();
});
$('.inner_d').click(function(e){
    e.stopPropagation();
});

$('.sure_password').click(function(){
    var password=$('.new_passW').val();
    user.set('password',password);
    user.save().then(function(){
        alert('success');
        window.location.reload();
    },function(){});
});

