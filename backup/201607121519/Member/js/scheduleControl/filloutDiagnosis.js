//获取当前用户
var user = AV.User.current();

var iObj=$('.i');
var url=window.location.search;
function getURLParameter(url,name){
    var regexp=new RegExp('(^|&)'+name+'=([^&]*)(&|$)','i');
    return url.substr(1).match(regexp)[2];
}

var EventsCalendar=AV.Object.extend('EventsCalendar');
var query = new AV.Query('EventsCalendar');

query.include('Member');
query.include('Doctor');
query.include('EventType');
query.include('Hospital');
query.include('MedicalResult');
query.get(getURLParameter(url,'objId')).then(function(result){
    iObj[0].value=result.get('Member')?result.get('Member').get('MemberName'):0;
    iObj[1].value=result.get('Doctor')?result.get('Doctor').get('DoctorName'):0;
    iObj[2].value=result.get('EventType')?result.get('EventType').get('EventTypeName'):'';
    iObj[3].value=result.get('Hospital')?result.get('Hospital').get('HospitalName'):0;
    iObj[4].value=getTime(result.get('MedicalResult')?result.get('MedicalResult').get('MedicalTime'):0);
    iObj[5].value=result.get('MedicalResult')?result.get('MedicalResult').get('MedicalResult'):0;
    iObj[6].value=result.get('MedicalResult')?result.get('MedicalResult').get('MedicalAdvice'):0;

    var relation = result.relation('PreRecords');
    var query1 = relation.query();
    query1.find().then(function (results) {
        var htmlStr='';
        for(var j=0;j<results.length;j++){
            htmlStr+='<div class="col-md-2"><img src="'+results[j].get('File').url()+'" alt="no"><span>'+results[j].get('File').name().split('.')[0]+'</span></div>';
        }
        $('.row').prepend(htmlStr);
    }, function (error) {
    });
},function(err){alert(err)});

function upload() {
    var eventsCalendar = AV.Object.createWithoutData('EventsCalendar', getURLParameter(url,'objId'));
    var EventFiles = AV.Object.extend('EventFiles');

    var Image = $("#exampleInputFile")[0];
    if (Image.files.length > 0) {
        var file = Image.files[0];
        var name = file.name;
        var avFile = new AV.File(name, file);
        avFile.save().then(function() {
            var relation = eventsCalendar.relation("PreRecords");
            var File = new EventFiles();
            File.set("File", avFile);
            File.save(null, {
                success: function(file) {
                    relation.add(File);
                    eventsCalendar.save(null, {
                        success: function(post) {
                            alert('增加成功！');
                            $('#upFile').hide();
                            window.location.reload();
                        },
                        error: function(post, error) {
                            console.log(error);
                            alert('增加失败，请重试！');
                            $('#upFile').hide();
                        }
                    });
                }
            });
        }, function(error) {
            alert('图片上传失败！');
            $('#upFile').hide();
        });
    }
}

//保存信息
$('.sure').click(function(){
    query.get(getURLParameter(url,'objId')).then(function(result){
        var Todo = AV.Object.extend('MedicalResult');
        var todoFolder = new Todo();
        todoFolder.set('MedicalTime',new Date($('#time').val()));
        todoFolder.set('MedicalResult',iObj[5].value);
        todoFolder.set('MedicalAdvice',iObj[6].value);
        todoFolder.save().then(function (data) {
            result.set('MedicalResult',data);
            result.save().then(function(){alert('success');
                window.location.reload();
            },function(){alert('error')});
        }, function (error) {
            console.log(error);
        });

    });
});

function getTime(t){
    if(t){
        var y=t.getFullYear();
        var month=t.getMonth()+1;
        var day =t.getDay();
        return y+'-'+month+'-'+day+' '+t.getHours()+':'+t.getMinutes()+':'+t.getSeconds();
    }else{
        return '';
    }
}

//事件
$('.btn-primary').click(function(){
    $('#upFile').show();
});
$('.btn-danger').click(function(){
    upload();
});
$('#upFile').click(function(e){
    e.stopPropagation();
    $(this).hide();
});
$('.inner').click(function(e){
    e.stopPropagation();
});

