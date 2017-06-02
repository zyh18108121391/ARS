/*
 * 2016-2-21
 * 公共js定义部分
 */


var Member = AV.Object.extend("Member");
var EventType = AV.Object.extend("EventType");
var Hospital = AV.Object.extend("Hospital");
var ConsultingRoom = AV.Object.extend("ConsultingRoom");
var EventFiles = AV.Object.extend("EventFiles");
var EventsCalendar = AV.Object.extend("EventsCalendar");
var MedicalResult = AV.Object.extend("MedicalResult");
/*
 * 注销
 * 
 */
function logout() {
    if (confirm("确定要注销吗？")) {
        AV.User.logOut();
        window.location.reload();
    }
}
/**
 * 按钮禁用与启用
 *
 */
function subStart() {
    $(".subButton").attr("disabled", "disabled"); //按钮禁用
}

function subEnd() {
    $(".subButton").removeAttr("disabled"); //将按钮可用
}

/*
 * 时间装换函数
 * 
 * 
 * 
 */
function ToTime(time) {
    if (time >= 0 && time < 10) {
        time = "0" + time;
    }
    return time;
}

//获取url上传入的id
function geturl() {
    var url = location.search.substr(1);
    var gethref;
    if (url.length > 0) {
        var ar = url.split(/[&=]/);
        for (i = 0; i < ar.length; i += 2) {
            gethref = ar[i + 1];
        }
    }
    return gethref;
}
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
/*
 * 
 * 判断当前登陆的用户是否为管理员
 * 
 */
function isAdmin() {
    if (AV.User.current() == null) {
        return false;
    } else { //已登录
        var user = AV.User.current();
        var username = user.get("username");
        var index = $.inArray(username, ADMINS);
        if (index == -1) {
            return false;
        } else {
            return true;
        }
    }
}

/*
 * 
 * 国际标准时间 转换为2016-01-01格式
 * 
 */
function timeToString(time) {
    if (time) {
        return time.getFullYear() + '-' + ToTime((time.getMonth() + 1)) + "-" + ToTime(time.getDate()) + " " + ToTime(time.getHours()) + ":" + ToTime(time.getMinutes()) + ":" + ToTime(time.getSeconds());
    } else {
        return " ";
    }
}
/*
 * 
 * 国际标准时间 转换为2016-01-01格式
 * 
 */
function timeToStringShort(time) {
    if (time) {
        return time.getFullYear() + '-' + ToTime((time.getMonth() + 1)) + "-" + ToTime(time.getDate());
    } else {
        return " ";
    }
}

//状态切换函数
function getStatus(status) {
    var statusString = "";
    switch (status) {
        case -999:
            statusString = "未完成";
            break;
        case -989:
            statusString = "会员未履约";
            break;
        case -979:
            statusString = "医生未履约";
            break;
        case -969:
            statusString = "重新协调中";
            break;
        case 1:
            statusString = "新建";
            break;
        case 11:
            statusString = "已确认";
            break;
        case 21:
            statusString = "已提醒";
            break;
        case 31:
            statusString = "已完成";
            break;
        default:
            statusString = "未知状态";
            break;
    }
    return statusString;
}

Date.prototype.format = function (format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};
/*改变时间格式*/
//---------本地显示上传 的图片----------------
function ProImg() {
    $("#Image").change(function () {
        var objUrl = getObjectURL(this.files[0]);
        if (objUrl) {
            $("#ImgPr").attr("src", objUrl);
        }
    })
    //建立一个可存取到该file的url
    function getObjectURL(file) {
        var url = null;
        if (window.createObjectURL != undefined) { // basic
            url = window.createObjectURL(file);
        } else if (window.URL != undefined) { // mozilla(firefox)
            url = window.URL.createObjectURL(file);
        } else if (window.webkitURL != undefined) { // webkit or chrome
            url = window.webkitURL.createObjectURL(file);
        }
        return url;
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
function changeDate(str) {
    var arr = str.split(/-/);
    return new Date(arr[0], arr[1] - 1, arr[2]);
}
//生成星级html
function getStartlevalDivPersonal(leval) {
    if (leval == null) leval = 5;
    var temp = (leval * 10) % 10; //判断是否有半颗心
    var lev2 = leval;
    var lev1_html = ''; //保存半颗心的html
    var len_0 = null; //保存零星的数量
    if (temp) {
        lev2 = Math.floor(leval);
        lev1_html = "<div class='p-1'></div>";
        len_0 = 5 - lev2 - 1;
    } else {
        len_0 = 5 - lev2;
    }
    var html = '';
    for (var i = 0; i < lev2; i++) {
        html += "<div class='p-2'></div>";
    }
    html += lev1_html;
    for (var j = 0; j < len_0; j++) {
        html += "<div class='p-0'></div>";
    }
    return html;
}

function back() {
    window.history.back(-1);
}
//显示下拉框列表

/*
 * 
 * 补充agentID 让其变为0001格式
 */
function AgentIDChange(id) {
    return id + 1000;
}
//更据时间戳 算出离现在时间的差  用文字体现
function chageTime(time) {
    var nowDate = new Date(); //开始时间
    var date3 = nowDate.getTime() - time.getTime(); //时间差的毫秒数
    //计算出相差天数
    var days = Math.floor(date3 / (24 * 3600 * 1000));
    //计算出小时数
    var leave1 = date3 % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000));
    var th = 24 - (hours + 24 * days);
    if (th < 0) {
        return 0;
    } else {
        return th;
    }
}

/*
 * 秒数转换为 几分分 几秒
 * 
 */
function alertingTimeChange(time) {
    var m = parseInt(time / 60);
    var t = time % 60;
    return m + " 分 " + t + " 秒";
}

/****************翻页********************/
/*
 * 全局变量     page query
 * 调用函数    ShowObject(results);
 * pageNumber：翻页大小
 */
/*
 * 翻页主函数
 */
function pageChange(tag) {
    if (tag == "nextpage") {
        page++;
        if (page * pageNumber >= maincount) {
            layer.msg("没有了", {
                shift: 6,
                time: 600
            });
            page--;
            return false;
        }
    }
    if (tag == "pastpage") {
        if (page > 0) {
            page--;
        } else {
            layer.msg("没有了", {
                shift: 6,
                time: 600
            });
            return false;
        }
    }
    if (tag == "index") {
        if(page==0){
            layer.msg("当前已经是第一页", {
                shift: 6,
                time: 600
            });
            return false;
        }

        page = 0;
    }
    if (tag == "end") {
        if(page==totlePage - 1){
            layer.msg("当前已经是最后一页", {
                shift: 6,
                time: 600
            });
            return false;
        }
        page = totlePage - 1;
    }
    $("#now").text(page + 1); //显示当前页数
    showNowPageResults(query);
}
/*
 * 显示页数和总数
 * 
 */
function showPages(qu, t) {
    qu.count({
        success: function (count) {
            if (t && count == 0) {
                layer.msg('没有查询到数据');
            }else{
                maincount = count;
                totlePage = Math.ceil(maincount / pageNumber); //向上取整 获取总页数
                $("#maincount").text(maincount);
                $("#totle").text(totlePage); //显示总页数
                $("#now").text(page + 1); //显示当前页数
            }
        }
    });
}
/*
 * 显示当前页数据
 * 
 */
function showNowPageResults(qu) {
    qu.limit(pageNumber);
    qu.skip(pageNumber * page);
    qu.find({
        success: function (results) {
            ShowObject(results);
        }
    });
}
/**
 * json数据转换为url参数  eg:a=1&b=2
 * @param param
 * @param key
 * @returns {string}
 */
var parseParam = function (param, key) {
    if(param.length==0) return '';
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