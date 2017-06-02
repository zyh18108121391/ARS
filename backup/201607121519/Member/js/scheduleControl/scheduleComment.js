//获取当前用户
var user = AV.User.current();

var url=window.location.search;
function getURLParameter(url,name){
    var regexp=new RegExp('(^|&)'+name+'=([^&]*)(&|$)','i');
    return url.substr(1).match(regexp)[2];
}

var queryD = new AV.Query('Doctor');
queryD.equalTo("Account", user);
var doc;
queryD.first().then(function (data) {doc=data});

$('.sure').click(function(){
    var iObjArr=$('.i');



    var member = AV.Object.createWithoutData('Member', getURLParameter(url,'Member'));
    // 声明类型
    var ARSEvaluationByDoctor = AV.Object.extend('ARSEvaluationByDoctor');
    var MemberEvaluationByDoctor = AV.Object.extend('MemberEvaluationByDoctor');
    // 新建对象
    var todoFolder = new ARSEvaluationByDoctor();
    var todoFolder1 = new MemberEvaluationByDoctor();

    todoFolder.set('Doctor',doc);
    todoFolder.set('Rating1',parseInt(iObjArr[3].value));
    todoFolder.set('Rating2',parseInt(iObjArr[4].value));
    todoFolder.set('Rating3',parseInt(iObjArr[5].value));
    todoFolder.set('Comment',iObjArr[6].value);
    todoFolder.set('EvaluationTime',new Date());
    todoFolder.save().then(function (d) {
        alert('对患者评价成功');
    }, function (error) {
        console.log(error);
    });

    todoFolder1.set('Doctor',doc);
    todoFolder1.set('Member',member);
    todoFolder1.set('Rating1',parseInt(iObjArr[0].value));
    todoFolder1.set('Rating2',parseInt(iObjArr[1].value));
    todoFolder1.set('Comment',iObjArr[2].value);
    todoFolder1.set('EvaluationTime',new Date());
    todoFolder1.save().then(function (d) {
        alert('对ARS评价成功');
    }, function (error) {
        alert(error);
    });
});
