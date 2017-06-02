$(document).ready(function () {

});


var messageArray = [];
messageArray[3] = "尊敬的会员，艾尔斯驻第三军医大附属新桥医院会员管家电话：18580525811，您挂号后可以直接与会员管家联系，她会陪同您前往医生办公室就诊，祝您身体健康！";
messageArray[33] = "尊敬的会员，艾尔斯驻重庆市中医院会员管家电话：18580525711，您挂号后可以直接与会员管家联系，她会陪同您前往医生办公室就诊，祝您身体健康！";

messageArray[4] = "重庆艾尔斯健康管理有限公司地址：重庆市观音桥建新南路1号中信大厦15-11，联系电话：400－996－7979，期待您的光临！";
messageArray[5] = "尊敬的会员，重庆艾尔斯健康管理有限公司平台客服热线400-996-7979，我们将竭诚为您提供便捷、优质的医疗服务！";
messageArray[6] = "尊敬的会员，公司帐号的开户名：重庆艾尔斯健康管理有限公司；开户行：招商银行重庆南岸支行；账号：123907666510801。您转帐成功后请通知艾尔斯，感谢您的信任！";

var pageMemberLisFirstLoad = true;
var pageMemberListMemberName = [];
var pageMemberListMemberNamePinYin = [];
pageStart();

$('#searchBtn').click(function () {
    Search();
});

var Agent;
function pageStart() {
    ShowSelectOption("MemberLevel", "LevelName", "level"); //显示会员等级下拉列表
    ShowSelectOption("Disease", "DiseaseName", "Disease"); //显示病情下拉列表
    ShowSelectOption("Hospital", "HospitalName", "Hospital"); //显示病情下拉列表
    user = AV.User.current();
    if (user) {
        var user = AV.User.current();
        var Query = new AV.Query('ServiceAgent');
        Query.equalTo("Account", user);
        Query.first({
            success: function (agent) {
                Agent = agent;
                //更据url参数恢复页面  用于浏览器返回
                showMemberListByOpts(urlStrToObj(window.location.href));
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

var newLevel = AV.Object.createWithoutData('MemberLevel', '576bd52279bc44005bdfb33c');
//主函数
function main() {
    query = new AV.Query('Member');
    //query.equalTo("PersonalAgent", Agent);
    query.notEqualTo("MemberLevel", newLevel);
    query.include("MemberLevel");
    query.include("City");
    query.include('PersonalDoctor');
    query.include('Hospital');
    query.include("PersonalAgent");
    query.include("PersonalButler");
    query.include("Account");
    query.descending('JoinTime');

    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query);
}

//把query后的结果集输出到table中便于公用
function ShowObject(results) {
    var pg = getUrlParam('page');
    var url = window.location.href;
    if (page != pg) {//翻页操作 则urlpage随之变化
        if (url.indexOf('page') == -1) {
            if (url.indexOf('?') == -1) {
                url =url + '?page=' + page;
            }else{
                url = url + '&page=' + page;
            }
        } else {
            url = url.replace('page=' + pg, 'page=' + page);
        }
    }
    url = url.replace('?&','?');
    history.replaceState({}, '', url);
    $("#windows_data", parent.window.document).attr('data', url);
    var len = results.length;
    var html = '', htmlArray = [];
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function (i) {
            var obj = results[i];
            var memberId = obj.id;
            var HeadPortrait = '';
            if (obj.get("HeadPortrait")) {
                HeadPortrait = obj.get("HeadPortrait").url();
            } else {
                HeadPortrait = '../../images/touxiang.jpg';
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
            var sex = -1;
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
            } else {
                if (obj.get("JoinTime") != null) {
                    var JoinTime = obj.get("JoinTime");
                    ExpireTime = new Date(JoinTime);
                    ExpireTime.setFullYear(ExpireTime.getFullYear() + 1);
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
            var PersonalAgent = '';
            if (obj.get("PersonalAgent") != null) {
                PersonalAgent = obj.get("PersonalAgent").get('AgentName');
            }
            var DiseaseArray = []; //疾病数组
            var Disease = obj.relation('Disease');
            Disease.query().find({
                success: function (result) {
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

                    Eventquery1.equalTo("EventType", Event_fuzheng);
                    Eventquery2.equalTo("EventType", Event_suifang);
                    Eventquery3.equalTo("EventType", Event_xuyao);

                    var query = AV.Query.or(Eventquery1, Eventquery2);
                    var queryAll = AV.Query.or(query, Eventquery3);

                    // queryAll.equalTo("Agent", Agent);
                    queryAll.equalTo("Member", obj);
                    // 按时间，降序排列
                    queryAll.descending('FirstAT');
                    queryAll.first({
                        success: function (result) {
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
                            count += 1;

                            htmlArray[i] = '<tr>' +
                                '<td><input type="checkbox" name="subCheck" sex="' + sex + '" memberName="' + MemberName + '" class="subCheck" MobilePhoneNo="' + MobilePhoneNo + '" Hospital="' + Hospital + ' "butlerPhone="' + ButlerPhone + '" /></td>' +
                                '<td><img src="' + HeadPortrait + '" width="30px"></td>' +
                                '<td>' + MemberName + '</td>' +
                                '<td><img src="' + LevelIcon + '" width="25px">' + LevelName + '</td>'
                                + '<td>' + timeToStringShort(ExpireTime) + '</td>'
                                + '<td>' + PersonalDoctor + '</td>'
                                + '<td>' + Hospital + '</td>'
                                + '<td>' + PersonalButler + '</td>'
                                + '<td>' + PersonalAgent + '</td>'
                                + '<td class="my-td">' + DiseaseArray.toString() + '</td>'
                                + '<td>' + city + '</td>'
                                + '<td>' + time_3_html + '</td>'
                                + '<td><a href="memberDetail.html?id=' + memberId + '">详情</a>|<a href="memberNewEvent.html?id=' + memberId + '">预约</a>|<a href="memberCalendar.html?id=' + memberId + '">历史日程</a></td>' +
                                '</tr>';
                            if (count == len) {
                                for (var k = 0; k < len; k++) {
                                    html += htmlArray[k];
                                }
                                $(".waitingLoadingList").hide();
                                $("#table-body").html(html);
                                if (pageMemberLisFirstLoad) {
                                    addMemberHtml();
                                    pageMemberLisFirstLoad = false;
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
    var html_op = '', obj;
    var query = new AV.Query(className);
    query.find({
        success: function (results) {
            for (var i = 0; i < results.length; i++) {
                obj = results[i];
                var Name = obj.get(typeName);
                if (Name == '普通用户')continue;
                html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
            }
            $("#" + id).append(html_op);
            setTimeout(recoverSearchInput(urlStrToObj(window.location.href)), 0);
        }
    });
}
//搜索函数
function Search() {
    var opts = {};
    page = 0;//每次搜索页数初始化
    opts.Belong = $("#MemberBelongs option:selected").val();
    opts.level = $("#level option:selected").val();
    opts.HospitalID = $("#Hospital option:selected").val();
    opts.rep = $("#Disease option:selected").val();
    //var score = $("#score option:selected").val();
    opts.memberName = $("#memberName").val();
    opts.telNo = $("#telNo").val();
    if (opts.telNo != '' && opts.telNo.length != 11) {
        layer.msg("电话输入不正确,请重新输入");
        return;
    }
    showMemberListByOpts(opts);
}

/**
 * 显示会员列表根据opts参数， 一种是url上的参数 一种搜索条件参数
 * @param opts
 */
function showMemberListByOpts(opts) {
    var queryA, queryB;
    if (opts.rep != 'all' && opts.rep) {
        var myRep = AV.Object.createWithoutData('Disease', opts.rep);
        queryA = AV.Relation.reverseQuery('Member', 'Disease', myRep);
        queryB = AV.Relation.reverseQuery('Member', 'Disease', myRep);
    } else {
        queryA = new AV.Query('Member');
        queryB = new AV.Query('Member');
    }
    if (opts.telNo) {
        queryA.equalTo("MobilePhoneNo", opts.telNo);
        queryB.equalTo("AppendMobilePhoneNo", opts.telNo);
    }
    query = AV.Query.or(queryA, queryB);
    query.notEqualTo("MemberLevel", newLevel);
    if (opts.Belong == 'mine') {
        query.equalTo("PersonalAgent", Agent);
    }
    if (opts.level != 'all' && opts.level) {
        var myLe = AV.Object.createWithoutData('MemberLevel', opts.level);
        query.equalTo("MemberLevel", myLe);
    }
    if (opts.HospitalID != 'all' && opts.HospitalID) {
        var Hospital = AV.Object.createWithoutData('Hospital', opts.HospitalID);
        query.equalTo("Hospital", Hospital);
    }
    if (opts.memberName) {
        query.equalTo("MemberName", opts.memberName);
    }
    query.include("MemberLevel");
    query.include("City");
    query.include("PersonalAgent");
    query.include("PersonalButler");
    query.include('Hospital');
    query.include("Account");
    query.include('PersonalDoctor');
    query.descending('JoinTime');
    showPages(query, 's'); //显示页数和总条数 在limit之前使用
    query.limit(10);
    if (opts.page) {
        page = parseInt(opts.page);
    }
    query.skip(10 * page);
    query.find({
        success: function (results) {
            if (results.length == 0) {
                layer.msg("没有找到相关结果", {time: 1000, shift: 6});
            } else {
                var opts_url = parseParam(opts);
                var t = 'memberlist.html?' + opts_url;
                if(t.indexOf('?&')!=-1) t.replace('&','');
                history.replaceState({}, '',t);
                ShowObject(results);
            }
        }
    });
}
/**
 * url参数转json
 * @param url
 * @returns {{}}
 */
function urlStrToObj(url) {
    var url = decodeURI(url);
    var obj={};
    var keyvalue=[];
    var key="",value="";
    var paraString=url.substring(url.indexOf("?")+1,url.length).split("&");
    for(var i in paraString)
    {
        keyvalue=paraString[i].split("=");
        key=keyvalue[0];
        value=keyvalue[1];
        obj[key]=value;
    }
    return obj;
}
//添加会员姓名搜索下拉
function addMemberHtml() {
    var htmlStr = '';
    for (var i = 0; i < pageMemberListMemberName.length; i++) {
        htmlStr += '<option value="' + pageMemberListMemberName[i] + '"></option>';
        pageMemberListMemberNamePinYin.push(codefans_net_CC2PY(pageMemberListMemberName[i]).toLowerCase());
    }
    $('#memberList').html(htmlStr);
}

function EventBind() {
    //绑定checkbox事件
    $("#parCheck").click(function () {
        if (this.checked) {
            $(".subCheck").prop('checked', 'checked');
        } else {
            $(".subCheck").prop('checked', false);
        }
    });
    $(".subCheck").click(function () {
        //当没有选中某个子复选框时，SelectAll取消选中
        if (!this.checked) {
            $("#parCheck").prop('checked', false);
        }
        var chsub = $("input[type='checkbox'][name='subCheck']").length; //获取subcheck的个数
        var checkedsub = $("input[type='checkbox'][name='subCheck']:checked").length; //获取选中的subcheck的个数
        if (checkedsub == chsub) {
            $("#parCheck").prop('checked', 'checked');
        }
    });
}

//添加姓名搜索事件
addELByMemberName();
function addELByMemberName() {
    var ulObj = $('.member_list_by_py');
    var nameInput = $('#memberName');

    nameInput.keyup(function () {
        var t = this.value;
        var liHtmlStr = '';
        if (t) {
            var r = new RegExp('^' + t, 'g');
            for (var i = 0; i < pageMemberListMemberNamePinYin.length; i++) {
                if (r.test(pageMemberListMemberNamePinYin[i])) {
                    liHtmlStr += '<li>' + pageMemberListMemberName[i] + '</li>';
                }
            }
            ulObj.html(liHtmlStr).show();
        } else {
            ulObj.html('').hide();
        }
    });

    ulObj.on('click', 'li', function () {
        var t = this.innerHTML;
        ulObj.hide();
        nameInput.val(t);
    });
}
//复选框事件
//全选、取消全选的事件
function selectAll() {
    if ($("#parCheck").attr("checked")) {
        $(":checkbox").attr("checked", true);
    } else {
        $(":checkbox").attr("checked", false);
    }
}
//子复选框的事件
function setSelectAll() {
    //当没有选中某个子复选框时，SelectAll取消选中
    if (!$(".subCheck").checked) {
        $("#parCheck").attr("checked", false);
    }
    var chsub = $("input[type='checkbox'][name='subCheck']").length; //获取subcheck的个数
    var checkedsub = $("input[type='checkbox'][name='subCheck']:checked").length; //获取选中的subcheck的个数
    if (checkedsub == chsub) {
        $("#parCheck").attr("checked", true);
    }
}
/*
 打开div
 */
var memebrArray = [];
function OpenSendDiv() {
    jy(0.8);
    memebrArray = [];
    $(".message-peoples").html('');
    $("input[type='checkbox'][name='subCheck']:checked").each(function () {
        if (this.checked) {
            memebrArray.push({
                name: $(this).attr('memberName') ? $(this).attr('memberName') : '艾尔斯用户',
                phoneno: $(this).attr('MobilePhoneNo'),
                sex: $(this).attr('sex'),
            });
            $(".message-peoples").append("<span class='li-member'>" + $(this).attr('memberName') + "</span>");
        }
    })
    $(".eject_div").show();
}

//发送短信
function SendMessage() {
    subStart();
    if (memebrArray.length == 0) {
        layer.msg('没有选择收信人');
        subEnd();
        return;
    }
    var value = $("#message-select option:selected").val();
    var nullPhone = '';
    var fail = 0;//发送失败的数目
    var success = 0;//发送成功的数目
    var errorArray = [];
    for (var i = 0; i < memebrArray.length; i++) {
        var obj = memebrArray[i];
        if (obj.phoneno == '') {
            fail += 1;
            errorArray.push(obj.name + "(电话号码为空)");
            continue;
        }
        if (value == '3') { //发送会员管家来联系方式
            obj.hospital = '第三军医大附属新桥医院';
            obj.butlerphone = '18580525811';
        }
        if (value == '33') { //发送会员管家来联系方式
            obj.hospital = '重庆市中医院';
            obj.butlerphone = '18580525711';
        }
        obj.code = value;
        AV.Cloud.run('SendMessage', obj, function (data) {
            if (data == '成功!') {
                success += 1;
            } else {
                fail += 1;
            }
            if ((success + fail) == memebrArray.length) {
                if (fail) {
                    var msg = '发送完毕，成功:' + success + "条,失败:" + fail + "条," + "失败原因如下:" + errorArray.toString();
                } else {
                    var msg = '发送完毕，成功:' + success + "条,失败:" + fail + "条";
                }
                subEnd();
                layer.confirm(msg, {
                    btn: ['发送完毕', '继续发送'] //按钮
                }, function () {
                    closeAsk();
                    $(".layui-layer").hide();
                    $(".layui-layer-shade").hide();
                }, function () {
                });
            }
        })
    }
    if (fail == memebrArray.length) {
        subEnd();
        var msg = "发送完毕，成功:0条,失败:" + fail + "条," + "失败原因如下:" + errorArray.toString();
        layer.confirm(msg, {
            btn: ['发送完毕', '继续发送'] //按钮
        }, function () {
            closeAsk();
            $(".layui-layer").hide();
            $(".layui-layer-shade").hide();
        }, function () {
        });
    }
}
/*
 * 禁用除弹出窗口的其他div
 *
 *
 */
function jy(num) {
    var window_width = $(document).width();
    var window_height = $(document).height();
    $(".jy").css("display", "block");
    $(".jy").css("width", window_width);
    $(".jy").css("height", window_height);
    $(".jy").fadeTo("fast", num);
}
/*

 */

function changeSelect(th) {
    var value = $(th).val();
    $("#message").html(messageArray[value]);
}
/*
 * 关闭edit-div
 */
function closeAsk() {
    $(".jy").hide();
    $(".eject_div").hide();
}

/**
 * 按钮禁用与启用
 *
 */
function subStart() {
    $(".subButton").attr("disabled", "disabled"); //按钮禁用
    $(".subButton").css("background-color", "#808080");
}

function subEnd() {
    $(".subButton").removeAttr("disabled"); //将按钮可用
    $(".subButton").css('background-color', 'rgb(66, 139, 202)');
}


/**
 * 根据据url参数 恢复搜索框填入的内容
 * @param opts
 * {Belong:"all" ,HospitalID:"all",level:"576bd57c128fe1005a14e1e3",memberName:"123",page:"0",rep:"all",telNo:"18108121391"}
 */
function recoverSearchInput(opts) {
    if (opts.Belong) {
        $("#MemberBelongs").val(opts.Belong);
    }
    if (opts.HospitalID) {
        $("#Hospital").val(opts.HospitalID);
    }
    if (opts.level) {
        $("#level").val(opts.level);
    }
    if (opts.memberName) {
        $("#memberName").val(opts.memberName);
    }
    if (opts.rep) {
        $("#Disease").val(opts.rep);
    }
    if (opts.telNo) {
        $("#telNo").val(opts.telNo);
    }
}