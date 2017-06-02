var Counsel = AV.Object.extend("Counsel");

var pageMemberLisFirstLoad = true;
var pageMemberListMemberName = [];
var pageMemberListMemberNamePinYin = [];

var AGENT; //客服
var AgentID; //id
var CID;
var COUNSELID; //当前拨号的咨询记录的id
var THIS; //当前拨打电话对应的dom对象
var RECORDID;//通话记录ID
var Pageflag = false;//记录是否弹出备注输入框 
$(document).ready(
    function () {
        //查询当前客服id
        var user = AV.User.current();
        var query = new AV.Query('ServiceAgent');
        query.equalTo('Account', user);
        query.first().then(function (result) {
            AGENT = result;
            AgentID = result.get("AgentID");
        }, function (error) {
            layer.msg('查询错误', {
                shift: 6,
                time: 600
            })
        });
        showCounselListByOpts(urlStrToObj(window.location.href));
        createNew();
    }
);

//添加会员姓名搜索下拉
function addMemberHtml() {
    var htmlStr = '';
    for (var i = 0; i < pageMemberListMemberName.length; i++) {
        htmlStr += '<option value="' + pageMemberListMemberName[i] + '"></option>';
        pageMemberListMemberNamePinYin.push(codefans_net_CC2PY(pageMemberListMemberName[i]).toLowerCase());
    }
    $('#memberList').html(htmlStr);
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
    if (data.connect) { //外呼 用户接通电话
        changeCallBtn(THIS);//按钮改为挂断电话
    }
    if (objectID) {
        RECORDID = objectID;//保存通话记录id
        BindCallRecordToCounsel(COUNSELID, objectID); //绑定改记录到当前咨询的relation中
    }
    var statu = data.agentstate;
    if (statu == '0') { //状态切换为0时执行
        //如果按钮已经是"拨打电话的情况 则不执行"
        var type = $(THIS).attr("date-type");
        if (type != 'call') {
            changeCallBtn(THIS, true);
        }
        //如果cardid存在 （不是手动切换状态发送过来的通知） 弹出输入框 输入此次通话备注
        if (RECORDID && Pageflag) {
            Pageflag = false;
            SetRecordMemo(RECORDID, 'norush');
        }
    }
}

//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10;//翻页大小默认为10
var query;
function CounselList(type, th) {
    page = 0;
    query = new AV.Query('Counsel');
    pageMemberListMemberName = []; //清空姓名数组
    pageMemberListMemberNamePinYin = [];

    if (type == 'mine') {
        $(".check-active").removeClass("check-active");
        $(".addQueBtn1").addClass("check-active");
        $(".addQueBtn1").removeClass("active1");
        $(".addQueBtn2").addClass("active2");
        $(".addQueBtn3").addClass("active3");
        query.equalTo("FollowAgent", AGENT);
    } else if (type == 'all') {
        $(".check-active").removeClass("check-active");
        $(".addQueBtn2").addClass("check-active");
        $(".addQueBtn2").removeClass("active2");
        $(".addQueBtn1").addClass("active1");
        $(".addQueBtn3").addClass("active3");
    } else {
        $(".check-active").removeClass("check-active");
        $(".addQueBtn3").addClass("check-active");
        $(".addQueBtn3").removeClass("active3");
        $(".addQueBtn1").addClass("active1");
        $(".addQueBtn2").addClass("active2");
        var queryA = new AV.Query('Counsel');
        var queryB = new AV.Query('Counsel');
        queryA.equalTo('Statu', 1);
        queryB.equalTo('Statu', 3);
        query = new AV.Query.or(queryA, queryB);
    }
    query.include('Doctor');
    query.include('Member');
    query.include('CounselType');
    query.include('FollowAgent');
    query.descending("createdAt");
    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query);//显示当前页数据
    var opts = {
        tabType: type,
    };
    history.replaceState({}, '', 'CounselList.html?' + parseParam(opts));
}

/*
 * search
 * 查询函数
 */
function searchFunc() {
    page = 0;
    var memberName = $("#memberName").val();
    var t = $(".check-active").attr('data');
    query = new AV.Query('Counsel');
    query.include('Doctor');
    query.include('Member');
    query.include('CounselType');
    query.include('FollowAgent');
    query.descending("createdAt");
    var queMember = new AV.Query("Member");
    if (t == 'mine') { //我的咨询 查询
        query.equalTo("FollowAgent", AGENT);
    } else if (t == 'wait') {
        var queryA = new AV.Query('Counsel');
        var queryB = new AV.Query('Counsel');
        queryA.equalTo('Statu', 1);
        queryB.equalTo('Statu', 3);
        query = new AV.Query.or(queryA, queryB);
    }
    var opts = {
        memberName: memberName,
        tabType: t,
    };
    if (memberName != '') {
        queMember.contains("MemberName", memberName);
        queMember.find({
            success: function (results) {
                var len = results.length;
                if (len) {
                    history.replaceState({}, '', 'CounselList.html?' + parseParam(opts));
                    var obj = results[0];
                    query.equalTo("Member", obj);
                    showPages(query); //显示页数和总条数 在limit之前使用
                    showNowPageResults(query, 'search');//显示当前页数据
                } else {
                    layer.msg('没有查询到数据');
                }
            }
        });
    } else {
        $(".check-active").click();
    }
}

/*
 * 把query后的结果集输出到table中 
 * 便于公用
 * @tep 标识 区分是否显示会员名称到input
 */
function ShowObject(results, tep) {
    var pg = getUrlParam('page');
    if (page != pg) {//翻页操作 则urlpage随之变化
        var url = window.location.href;
        if (url.indexOf('page') == -1) {
            if (url.indexOf('?') == -1) {
                history.replaceState({}, '', url + '?page=' + page);
            } else {
                history.replaceState({}, '', url + '&page=' + page);
            }
        } else {
            history.replaceState({}, '', url.replace('page=' + pg, 'page=' + page));
        }
    }
    var len = results.length;

    if (len == 0) {
        $("#table-body").html('<tr><td class="null-td" colspan="8">暂无记录</td></tr>');
        return;
    }

    var html = '',
        htmlArray = [];
    var count = 0;
    for (var i = 0; i < len; i++) {
        (function (i) {
            var obj = results[i];
            var Id = obj.id;
            var MemberName = '';
            if (obj.get("Member") != null) {
                MemberName = obj.get("Member").get("MemberName");
                if (tep != 'search') {
                    if (jQuery.inArray(MemberName, pageMemberListMemberName) == -1) pageMemberListMemberName.push(MemberName);
                }
            }
            var DoctorName = '';
            if (obj.get("Doctor") != null) {
                DoctorName = obj.get("Doctor").get("DoctorName");
            }
            var tellNo = '';
            if (obj.get("Doctor") != null) {
                tellNo = obj.get("Doctor").get("MobilePhoneNo");
            }
            var FollowAgent = '';
            if (obj.get("FollowAgent") != null) {
                FollowAgent = obj.get("FollowAgent").get("AgentName");
            }
            var TypeName = '';
            if (obj.get("CounselType") != null) {
                TypeName = obj.get("CounselType").get("TypeName");
            }
            var CounselContent = '';
            if (obj.get("CounselContent") != null) {
                CounselContent = obj.get("CounselContent");
            }

            //咨询建立的时间
            var CreatedTime = obj.createdAt;
            var LastUpdateTime = obj.createdAt;
            var Posts = obj.relation('Posts');
            var P_query = Posts.query();
            P_query.descending("createdAt");
            var ImagesRe = obj.relation('Images');
            ImagesRe.query().count().then(function (imgsCount) {
                if (imgsCount) {
                    CounselContent = '<i class="c-img" title="该咨询中含有图片点击详情查看"></i>' + CounselContent;
                }
                P_query.first({
                    success: function (res) {
                        var content = '';
                        if (res) {
                            if (res.get("PostImage")) content = '<i class="c-img" title="该咨询中含有图片点击详情查看"></i>';
                            if (res.get("PostType") == 1) {
                                content += res.get("DoctorPost") ? res.get("DoctorPost") : '';
                            } else {
                                content += res.get("MemberPost") ? res.get("MemberPost") : '';
                            }
                            LastUpdateTime = res.createdAt;
                        }
                        count += 1;
                        htmlArray[i] = "<tr>" + '<td>' + MemberName + '</td>' + '<td>' + DoctorName + '</td>' + '<td>' + FollowAgent + '</td>' + '<td>' + TypeName + '</td>' + '<td  class="td-content">' + CounselContent + '</td>' + '<td class="td-content">' + content + '</td>' + '<td>' + chageTime(CreatedTime) + '</td>' +
                            '<td class="td-time">' + timeToString(CreatedTime) + '</td>' +
                            '<td class="td-time">' + timeToString(LastUpdateTime) + '</td>' +
                            '<td><a href=\"advisoryDetail.html?id=' + Id + '\">详情</a><span class="btn btn-primary list-btn" date-type="call" name="' + tellNo + '" onclick="call(this,\'' + Id + '\')">拨打电话</span></td>' +
                            '</tr>';
                        if (count == len) {
                            for (var k = 0; k < len; k++) {
                                html += htmlArray[k];
                            }
                            $("#table-body").html(html);
                            if (pageMemberLisFirstLoad && tep != 'search') {
                                addMemberHtml();
                            }
                        }
                    }
                });
            });
        })(i);
    }
}
/**
 * 显示会员列表根据opts参数， 一种是url上的参数 一种搜索条件参数
 * @param opts
 */
function showCounselListByOpts(opts) {
    console.log(JSON.stringify(opts));
    page = opts.page ? parseInt(opts.page) : 0;
    query = new AV.Query('Counsel');
    pageMemberListMemberName = []; //清空姓名数组
    pageMemberListMemberNamePinYin = [];
    if (opts.tabType == 'mine') {
        $(".check-active").removeClass("check-active");
        $(".addQueBtn1").addClass("check-active");
        $(".addQueBtn1").removeClass("active1");
        $(".addQueBtn2").addClass("active2");
        $(".addQueBtn3").addClass("active3");
        query.equalTo("FollowAgent", AGENT);
    } else if (opts.tabType == 'all') {
        $(".check-active").removeClass("check-active");
        $(".addQueBtn2").addClass("check-active");
        $(".addQueBtn2").removeClass("active2");
        $(".addQueBtn1").addClass("active1");
        $(".addQueBtn3").addClass("active3");
    } else {
        $(".check-active").removeClass("check-active");
        $(".addQueBtn3").addClass("check-active");
        $(".addQueBtn3").removeClass("active3");
        $(".addQueBtn1").addClass("active1");
        $(".addQueBtn2").addClass("active2");
        var queryA = new AV.Query('Counsel');
        var queryB = new AV.Query('Counsel');
        queryA.equalTo('Statu', 1);
        queryB.equalTo('Statu', 3);
        query = new AV.Query.or(queryA, queryB);
    }
    query.include('Doctor');
    query.include('Member');
    query.include('CounselType');
    query.include('FollowAgent');
    query.descending("createdAt");
    if (opts.memberName) {
        var queMember = new AV.Query('Member');
        queMember.contains("MemberName", opts.memberName);
        queMember.find({
            success: function (results) {
                var len = results.length;
                if (len) {
                    history.replaceState({}, '', 'CounselList.html?' + parseParam(opts));
                    query.equalTo("Member", results[0]);
                    showPages(query); //显示页数和总条数 在limit之前使用
                    showNowPageResults(query);//显示当前页数据
                } else {
                    layer.msg('没有查询到数据');
                }
            }
        });
        query.contains('MemberName', opts.memberName);
    } else {
        showPages(query); //显示页数和总条数 在limit之前使用
        showNowPageResults(query);//显示当前页数据
    }
}
/**
 * json数据转换为url参数  eg:a=1&b=2
 * @param param
 * @param key
 * @returns {string}
 */
var parseParam = function (param, key) {
    var paramStr = "";
    if (param instanceof String || param instanceof Number || param instanceof Boolean) {
        paramStr += "&" + key + "=" + encodeURIComponent(param);
    } else {
        $.each(param, function (i) {
            var k = key == null ? i : key + (param instanceof Array ? "[" + i + "]" : "." + i);
            paramStr += '&' + parseParam(this, k);
        });
    }
    return paramStr.substr(1);
};


/*
 *
 * 获取url参数
 */
function getUrlParam(name) {
    //构造一个含有目标参数的正则表达式对象
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    //匹配目标参数
    var r = window.location.search.substr(1).match(reg);
    //返回参数值
    if (r != null) return unescape(r[2]);
    return null;
}
