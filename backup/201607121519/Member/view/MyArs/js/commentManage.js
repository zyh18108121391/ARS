//获取当前用户
var user = AV.User.current();

var queryD = new AV.Query('Doctor');
queryD.equalTo("Account", user);
var Doctor;
queryD.first().then(function (data) {Doctor=data});

var query = new AV.Query('DoctorEvaluationByMember');

query.include('Member');
query.include('Doctor');
query.equalTo('Doctor',Doctor);
query.find().then(function(results){
    var htmlStr='';
    var Member,Rating1,Rating2,Rating3,Rating,Comment,EvaluationTime;
    for(var i=0;i<results.length;i++){
        Member=results[i].get('Member').get('MemberName');
        Rating1=score(results[i].get('Rating1'));
        Rating2=score(results[i].get('Rating2'));
        Rating3=score(results[i].get('Rating3'));
        Rating=score(results[i].get('Rating'));

        $('.top_score').append(Rating);

        Comment=results[i].get('Comment');
        EvaluationTime=getTime(results[i].get('EvaluationTime'));
        htmlStr+='<tr>'+
                '<td>'+Member+'</td>' +
                '<td>'+Rating1+'</td>' +
                '<td>'+Rating2+'</td>' +
                '<td>'+Rating3+'</td>' +
                '<td>'+Rating+'</td>' +
                '<td>'+Comment+'</td>' +
                '<td>'+EvaluationTime+'</td>' +
            '</tr>';
    }
    $('tbody').prepend(htmlStr);

},function(){alert('error')});

function getTime(t){
    if(t){
        var y=t.getFullYear();
        var month=t.getMonth()+1;
        var day =t.getDay();
        return y+'-'+month+'-'+day+' '+t.getHours()+':'+t.getMinutes()+':'+t.getSeconds();
    }else{
        return 0;
    }
}

function score(n){
    var spanStr='';
    for(var i=0;i<n;i++){
        spanStr+='<span class="orange">⭐</span>';
    }
    for(i=0;i<5-n;i++){
        spanStr+='<span>⭐</span>';
    }
    return spanStr;
}