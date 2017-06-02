var Member = null;
var doctorName = '';
var currentDoctorObj, currentMemberObj;
//当没有回复时保存咨询内容
var memberFirstAsk;
var saveAddFirstMemberAsk = 0,
    haveMemberAddAsk = 0;
var THIS, AgentID;
var RECORDID; //通话记录ID
var Pageflag = false; //记录是否弹出备注输入框 
$(document).ready(
    function () {
        var user = AV.User.current();
        var query = new AV.Query('ServiceAgent');
        query.equalTo('Account', user);
        query.first().then(function (result) {
            AgentID = result.get("AgentID");
            main();
            // 每次调用生成一个聊天实例
        }, function (error) {
            layer.msg('查询错误', {
                shift: 6,
                time: 600
            })
        });
        createNew();
        //图片预览
        $('#addImgInput').change(function () {
            var file0 = this.files[0];
            var fileReader = new FileReader();
            fileReader.readAsDataURL(file0);
            fileReader.onload = function (r) {
                var html = '<div class="float-lt"><p><img src="' + r.target.result + '"></p><p><button class=" btn btn-primary" onclick="removeImg(this)">移除</button></p></div>';
                $('.add_chat_img').html(html);
            };
            $('.add_chat_img').show();
        });

    }
);

/*
 * 处理收到的所有push消息
 * 格式如下
 * 2：{"agentid":"1001","callid":"160817134212662200010075001c6b65","agentstate":"2","time":"20160817134212","number":"18108121391","_channel":"1"}
 */
function ReceiveMain(data) {
    if (data.agentid != AgentIDChange(AgentID)) { //推送消息不是推送给当前客服 忽略此消息
        return;
    }
    var objectID = data.objectID; //agentconversation的id
    if (objectID) {
        RECORDID = objectID; //保存通话记录id
        BindCallRecordToCounsel(geturl(), objectID); //绑定该记录到当前咨询的relation中
    }
    if (data.connect) { //外呼 用户接通电话
        changeCallBtn(THIS);//按钮改为挂断电话
    }
    var statu = data.agentstate;
    if (statu == 0) { //状态切换为0时执行
        //如果按钮已经是"拨打电话的情况 则不执行"
        var type = $("#call").attr("date-type");
        if (type != 'call') {
            changeCallBtn(THIS, true);
        }
        //如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
        //Pageflag为True 代标有拨打电话的动作，否则不弹窗。
        if (RECORDID && Pageflag) {
            Pageflag = false;
            SetRecordMemo(RECORDID);
        }
    }
}

function main() {
    var id = geturl();
    var query = new AV.Query('Counsel');
    query.include('Member');
    query.include('Doctor');
    query.include('CounselType');
    query.get(id, {
        success: function (obj) {
            //获取通话记录显示到列表中
            var relation = obj.relation('CallRecord');
            ShowCalRecord(relation);

            //已完成 不需要回复
            if (obj.get("Statu") == '999') {
                $("#replay_div").css("display", "none");
            } else {
                $("#replay_div").css("display", "block");
            }
            var MemberName = '';
            if (obj.get("Member") != null) {
                currentMemberObj = obj.get("Member");
                MemberName = obj.get("Member").get("MemberName");
            }
            if (obj.get("Doctor") != null) {
                currentDoctorObj = obj.get("Doctor");
                var tellNo = obj.get("Doctor").get("MobilePhoneNo");
                $("#call").attr("name", tellNo);
            }
            var DoctorName = '';
            if (obj.get("Doctor") != null) {
                DoctorName = obj.get("Doctor").get("DoctorName");
            }
            var HeadPortrait = '../../images/young.jpg';
            if (obj.get("Member").get("HeadPortrait") != null) {
                HeadPortrait = obj.get("Member").get("HeadPortrait").url();
            }
            var TypeName = '';
            if (obj.get("CounselType") != null) {
                TypeName = obj.get("CounselType").get("TypeName");
            }
            var CounselContent = '';
            if (obj.get("CounselContent") != null) {
                CounselContent = obj.get("CounselContent");
                memberFirstAsk = CounselContent;
            }
            var img_relation = obj.relation('Images');
            img_relation.query().find().then(function (imgs) {
                var str = '';
                for(var i = 0;i<imgs.length;i++){
                    var obj = imgs[i];
                    str +='<img src='+obj.get('File').url()+' />';
                }

                $("#counsel-imgs").html(str);
                init('docs-pictures');
            });
            var time = obj.createdAt;
            var MemberLevelID = '';
            if (obj.get("CounselContent") != null) {
                MemberLevelID = obj.get("Member").get("MemberLevel").id;
                var query = new AV.Query('MemberLevel');
                query.get(MemberLevelID, {
                    success: function (le) {
                        var html = '<img src="' + le.get("LevelIcon").url() + '" />' + le.get("LevelName");
                        $("#level").html(html);
                    }
                })
            }
            //显示回复列表
            var Posts = obj.relation('Posts');
            var query1 = Posts.query();
            query1.include("Doctor");
            query1.descending("createdAt");
            query1.find({
                success: function (results) {
                    var html = '';
                    for (var j = 0; j < results.length; j++) {
                        var ob = results[j];
                        var content = '暂无回复';
                        if (ob) {
                            var name = '';
                            var headUrl = '../../images/ARSLogo.png';
                            if (ob.get("PostType") == '1') {
                                name = "医生--" + DoctorName;
                                if (ob.get("DoctorPost")) { //如果是回复的内容
                                    content = ob.get("DoctorPost");
                                }
                                if(ob.get("PostImage")){
                                    content += '<br><br><img src="' + ob.get("PostImage").url() + '" />';
                                }
                                if (ob.get("Doctor")) {
                                    if (ob.get("Doctor").get("HeadPortrait")) {
                                        headUrl = ob.get("Doctor").get("HeadPortrait").url();
                                    }
                                }
                            } else {
                                haveMemberAddAsk = 1;
                                if (saveAddFirstMemberAsk == 0) {
                                    saveAddFirstMemberAsk = ob.get('MemberPost');
                                }
                                headUrl = HeadPortrait;
                                name = MemberName;
                                if (ob.get("MemberPost")) { //如果是回复的内容
                                    content = ob.get("MemberPost");
                                }
                                if(ob.get("PostImage")){
                                    content += '<br><img src="' + ob.get("PostImage").url() + '" />';
                                }
                            }
                        }
                        var time_li = ob.createdAt;

                        html += '<div class="ticket-thread">' +
                            '<div class="thread-status">' +
                            '<div class="head" style="background-image: url(' + headUrl + ')"></div>' +
                            '<div class="head-name">' +
                            '<div><strong class="ticket-username">' + name + '</strong></div>' +
                            '<div><span class="time">@ ' + timeToString(time_li) + '</span></div>' +
                            '</div>' +
                            '<div class="clear"></div>' +
                            '</div>' +
                            '<div class="thread-contant">' +
                            '<div class="pre">' + content + '</div>' +
                            '</div>' +
                            '</div>'
                    }
                    if (html == '') {
                        $("#thread").html('<div class="content-null">医生暂未回复</div>');
                    } else {
                        $("#thread").html(html);
                    }
                    init('docs-pictures1');
                }
            });
            var h = '<img src=\"' + HeadPortrait + '\"/>';
            $("#head").html(h);
            $("#name").html(MemberName);
            $("#content").html(CounselContent);
            $("#time").html(timeToString(time));

        }
    });
}

//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小默认为10
var query;

/*
 * ShowCalRecord 显示通话记录
 * 
 */
function ShowCalRecord(relation) {
    query = relation.query();
    query.include('Agent');
    query.descending('createdAt');
    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query);//显示当前页数据
}

/*
 *  把query后的结果集输出到table中 
 * 
 */
function ShowObject(results, tep) {
    var len = results.length;
    var html = '';
    for (var i = 0; i < len; i++) {
        var obj = results[i];
        var agentName = ''
        if (obj.get('Agent') != null) {
            agentName = obj.get("Agent").get("AgentName");
        }
        var Duration = ''
        if (obj.get('Duration') != null) {
            Duration = obj.get("Duration");
        }
        var RecordFile = '';
        var RecordFileURL = '';
        if (obj.get("RecordFile") != null) {
            RecordFileURL = obj.get("RecordFile").url();

            RecordFile = '点击播放';
        }
        var Memo = '';
        if (obj.get("Memo") != null) {
            Memo = obj.get("Memo");
        }
        var creatTime = obj.createdAt;
        html += '<tr>' +
            '<td>' + agentName + '</td>' +
            '<td>' + alertingTimeChange(Duration) + '</td>' +
            '<td>' + '<span class="auto-text" data="' + RecordFileURL + '" onclick="play(this)">' + RecordFile + '</span>' + '</td>' +
            '<td>' + Memo + '</td>' +
            '<td>' + timeToString(creatTime) + '</td>' +
            '</tr>';
    }
    if (html != '') {
        $("#CallRecordList").html(html);
    }

}

/*
 * 播放录音文件
 */
function play(th) {
    $(".audio-div").show();
    var top = $(th).position().top;
    var left = $(th).position().left;
    var w = $(th).width();
    $(".audio-div").css({
        top: (top + 3) + "px",
        left: (left + w + 30) + "px"
    })
    var audioUrl = $(th).attr("data");
    $("#audio").attr("src", audioUrl);
}

/*
 * 
 * 关闭播放窗口
 */
function closeBtn() {
    $(".audio-div").hide();
    $("#audio").attr("src", "");
}

/**
 *
 *初始化插件
 *
 */
function init(clas) {
    $(function () {
        'use strict';
        var console = window.console || {
                log: function () {
                }
            };
        var $images = $('.'+clas);
        var $toggles = $('.docs-toggles');
        var $buttons = $('.docs-buttons');
        var handler = function (e) {
            //console.log(e.type);
        };
        var options = {
            // inline: true,
            url: 'data-original',
            build: handler,
            built: handler,
            show: handler,
            shown: handler,
            hide: handler,
            hidden: handler
        };

        function toggleButtons(mode) {
            if (/modal|inline|none/.test(mode)) {
                $buttons.find('button[data-enable]').prop('disabled', true).filter('[data-enable*="' + mode + '"]').prop('disabled', false);
            }
        }

        $images.on({
            'build.viewer': handler,
            'built.viewer': handler,
            'show.viewer': handler,
            'shown.viewer': handler,
            'hide.viewer': handler,
            'hidden.viewer': handler
        }).viewer(options);
        toggleButtons(options.inline ? 'inline' : 'modal');
        $toggles.on('change', 'input', function () {
            var $input = $(this);
            var name = $input.attr('name');

            options[name] = name === 'inline' ? $input.data('value') : $input.prop('checked');
            $images.viewer('destroy').viewer(options);
            toggleButtons(name);
        });
        $buttons.on('click', 'button', function () {
            var data = $(this).data();
            var args = data.arguments || [];

            if (data.method) {
                if (data.target) {
                    $images.viewer(data.method, $(data.target).val());
                } else {
                    $images.viewer(data.method, args[0], args[1]);
                }

                switch (data.method) {
                    case 'scaleX':
                    case 'scaleY':
                        args[0] = -args[0];
                        break;

                    case 'destroy':
                        toggleButtons('none');
                        break;
                }
            }
        });
    });
}
function removeImg(th) {
    var file = document.getElementById("addImgInput");
    if (file.outerHTML) {
        file.outerHTML = file.outerHTML;
    } else { // FF(包括3.5)
        file.value = "";
    }
    $(th).parent().parent().remove();
}
//点击按钮回复
$('.reply_btn').click(function(){

    subStart();
    var answer= $("#replay").val(),
        PostImage=$('#addImgInput')[0].files[0];

    if(answer==''){
        layer.msg("请输入回复内容",{time:600,shift:6});
        $("#replay").focus();
        subEnd();

        return ;
    }
    //加载层
    var index = layer.load(2, {shade: false}); //0代表加载的风格，支持0-2
    var CounselPost=AV.Object.extend('CounselPost');
    var newObj=new CounselPost();
    newObj.set('Doctor',currentDoctorObj);
    newObj.set('Member',currentMemberObj);
    if(haveMemberAddAsk==0){
        newObj.set('MemberPost',memberFirstAsk);
    }else{
        newObj.set('MemberPost',saveAddFirstMemberAsk);
    }
    newObj.set('DoctorPost',answer);
    newObj.set('PostType',1);

    var MyCounsel=AV.Object.createWithoutData('Counsel',geturl());
    var relation = MyCounsel.relation("Posts");
    MyCounsel.set('Statu',2);//医生或者客服回复后 状态改为已回复 2
    if(PostImage){
        newObj.set('PostImage',new AV.File(PostImage.name, PostImage));
    }
    newObj.set('Counsel',MyCounsel);

    newObj.save(null,{
        success:function(obj){
            relation.add(obj);
            MyCounsel.save(null,{
                success:function(a){
                    window.location.reload();
                }
            });
        }
    });
});