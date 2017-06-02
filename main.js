/**
 * 开发过程中常用的一些js整理
 * 2017-5-4 14:19 by @zhengyinhua email:390579684@qq.com
 * V1.0
 */


/*
 * des:小于10点的数 在前面加0,尝尝和下面的时间转换函数搭配使用
 * eg:'5' change to '05'
 * @num:需要转换的数字  {type：string}
 */
function numAddZero(num) {
    if (num >= 0 && num < 10) {
        num = "0" + num;
    }
    return num;
}

/**
 * des:国际标准时间 转换为2016-01-01 15:30:00格式
 * @time: 传入的时间 {type：Date}
 */
function timeToString(time) {
    if (time) {
        return time.getFullYear() + '-' + numAddZero((time.getMonth() + 1)) + "-" + numAddZero(time.getDate()) + " " + numAddZero(time.getHours()) + ":" + numAddZero(time.getMinutes()) + ":" + numAddZero(time.getSeconds());
    } else {
        return " ";
    }
}

/**
 * des:国际标准时间 转换为2016-01-01格式
 * @time: 传入的时间 {type：Date}
 */
function timeToStringShort(time) {
    if (time) {
        return time.getFullYear() + '-' + numAddZero((time.getMonth() + 1)) + "-" + numAddZero(time.getDate());
    } else {
        return " ";
    }
}

/**
 * des:国际标准时间 转换为2016-01-01 15:30:00 星期一 格式
 * @time: 传入的时间 {type：Date}
 */
function timeToStringIncludeDay(time) {
    if (time) {
        return time.getFullYear() + '-' + numAddZero((time.getMonth() + 1)) + "-" + numAddZero(time.getDate()) + " " + numAddZero(time.getHours()) + ":" + numAddZero(time.getMinutes()) + ":" + numAddZero(time.getSeconds()) + " " + timeGetDay(time);
    } else {
        return " ";
    }
}
/**
 * des:获取一个时间的星期数
 * @time: {type:Date}
 * return :{type:string}
 */

function timeGetDay(time) {
    return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][time.getDay()];
}


/**
 * des:获取url上传入的参数，适用于只有一个参数的情况
 * eg: test.html?id=18108121391 get '18108121391'
 * @returns {*}
 */
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
 * des:获取url上的某一个参数
 * eg:test.html?id=1&telno=18108121391&like=ball
 * @name:参数名，例如上面的 id,telno,like {type：string}
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

/**
 * des:返回上一页面
 */
function back() {
    history.go(-1);
}
/**
 * des:json数据转换为url参数
 * eg:{a:1,b=2} change to 'a=1&b=2'
 * @param param {type:Oject}
 * @param key
 * @returns {string}
 */
function parseParam(param, key) {
    if (param.length == 0) return '';
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
}
/**
 * des:url参数转json
 * eg:html?a=1&b=2 change to '{a:1,b:2}'
 * @param url
 * @returns {Object}
 */
function urlStrToObj(url) {
    var url = decodeURI(url);
    var obj = {};
    var keyvalue = [];
    var key = "", value = "";
    if (url.indexOf('?') == -1) {
        return obj;
    }
    var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
    for (var i in paraString) {
        keyvalue = paraString[i].split("=");
        key = keyvalue[0];
        value = keyvalue[1];
        obj[key] = value;
    }
    return obj;
}
/**
 * des:更据时间戳 算出未来离现在时间的差  用文字体现精确到分钟
 * @param time {type:Date}
 * @returns {string}
 */

function timeDifference(time) {
    if (time == '') {
        return '';
    }
    var nowDate = new Date();
    var oldDate = new Date(time);
    if (oldDate > nowDate) {
        var date3 = oldDate.getTime() - nowDate.getTime(); //时间差的毫秒数
    } else {
        var date3 = nowDate.getTime() - oldDate.getTime(); //时间差的毫秒数
    }
    //计算出相差天数
    var days = Math.floor(date3 / (24 * 3600 * 1000));

    //计算出小时数
    var leave1 = date3 % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000));

    //计算相差分钟数
    var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
    var minutes = Math.floor(leave2 / (60 * 1000));

    //计算相差秒数
    var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
    var seconds = Math.round(leave3 / 1000);
    return (days ? (days + '天') : '' ) + (hours ? (hours + '小时') : '') + (seconds ? (seconds + '秒') : '');
}

/**
 *des:生成唯一guid
 * @param count
 * @returns {string}
 */
function guid(count) {
    var count = count ? count : 8;
    var n = '';
    for (var i = 0; i < count; i++) {
        n += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        console.log(n)
    }
    return n;
}


