/**
 * Created by 郑银华 on 2016/12/8.
 */

$(document).ready(function() {
    showReport(urlStrToObj(window.location.href));
});
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var query = new AV.Query('MedicalReport');
function showReport(opts) {
    if(opts.page)page = parseInt(opts.page);
    query = new AV.Query('MedicalReport');
    query.limit(12);
    query.skip(0);
    query.descending('createdAt');
    query.equalTo('IsInput',false);
    query.equalTo('Enabled',true);
    showPages(query); //显示页数和总条数 在limit之前使用
    showNowPageResults(query);//显示当前页数据
}

function ShowObject(reports) {
    var t ='report.html?page=' +page;
    history.replaceState({}, '', t);
    var html = '';
    for(k in reports){
        var obj = reports[k];
        var t = obj.get('RawFile').name();
        var name = '';
        if(t.indexOf('.jpg')>=0||t.indexOf('.JPG')>=0||t.indexOf('.png')>=0||t.indexOf('.PNG')>=0||t.indexOf('.GIF')>=0||t.indexOf('.gif')>=0){
            name = t.substring(0,t.length-4);
        }
        var url='reportInput.html?id='+obj.id;
        html+='<a href="'+url+'" class="li-div col-md-3" title="'+obj.get('RawFile').name()+'">'
            +'<div class="li-img"><img src="'+obj.get('RawFile').url()+'"/></div>'
            +'<div class="li-title">'+obj.get('RawFile').name()+'</div>'
            +'</a>';
    }
    $("#listImg").html(html);
}
/********************翻页********************/
/*
 * 翻页函数
 */
function pageChange(tag) {
    if(tag == "nextpage") {
        page++;
        if(page * 12 >= maincount) {
            layer.msg("没有了",{
                shift:6,
                time:600
            });
            page--;
            return false;
        }
    }
    if(tag == "pastpage") {
        if(page > 0) {
            page--;
        } else {
            layer.msg("没有了",{
                shift:6,
                time:600
            });
            return false;
        }
    }
    if(tag == "index") {
        page = 0;
    }
    if(tag == "end") {
        page = totlePage - 1;
    }
    $("#now").text(page + 1); //显示当前页数
    showNowPageResults(query);//显示当前页数据
}
/*
 * 显示当前页数据
 *
 */
function showNowPageResults(qu) {
    qu.limit(12);
    qu.skip(12 * page);
    qu.find({
        success: function(results) {
            ShowObject(results);
        }
    });
}
/*
 * 显示页数和总数
 *
 */
function showPages(query) {
    query.count({
        success: function(count) {
            maincount = count;
            totlePage = Math.ceil(maincount / 12); //向上取整 获取总页数
            $("#maincount").text(maincount);
            $("#totle").text(totlePage); //显示总页数
            $("#now").text(page + 1); //显示当前页数
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
    if(url.indexOf('?')==-1){
        return obj;
    }
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