//子页面操作父页面
function iframeTarget(url) {
    window.parent.$("#menuFrame").attr("src",url);
}
//解析字符串
function strToJson(str) {
    var json = eval('(' + str + ')');
    return json;
    //return JSON.parse(str);
}
//ajax请求数据
function getAjax(arg,type,callback) {
    $.ajax({
        url:"http://tinglema.cn:8000/"+arg,
        type: type,
        dataType: 'json',
        timeout: 5000,
        success: function (msg) {
            callback(msg);
        },
        error: function(err,s){
            callback(err);
        }
    })
}
//post请求
function getPost(arg,type,data,callback) {
    /*console.log(typeof data);
    console.log(typeof JSON.parse(data))
    console.log(typeof ({"name":"停了吗","owner":"停了吗"}))*/
    $.ajax({
        url:"http://tinglema.cn:8000/"+arg,
        type: type,
        dataType: 'json',
        data:data,
        timeout: 10000,
        success: function (msg) {
            callback(msg);
        },
        error: function(err,s){
            callback(err);
        }
    })
}
// JavaScript Document
//计算页数
function calculatePage(total,pageSize)
{
    var page=total/pageSize;
    if(total%pageSize>0)
        return Math.ceil(page);
    else
        return page;
}
//分页列表
function make_page_list(total,pageSize,pageIndex){
    var html="";
    var total_page=calculatePage(total,pageSize);
    if(total_page>1){
        html='<a id="first" href="javascript:;"> 首页 </a>&nbsp;<a id="prev" href="javascript:;"> 上一页 </a><span>&nbsp;当前页 : '+pageIndex+'/'+total_page+'&nbsp;</span><a id="next" href="javascript:;"> 下一页 </a>&nbsp;<a id="last" href="javascript:;"> 尾页 </a>';
    }
    return html;
}

