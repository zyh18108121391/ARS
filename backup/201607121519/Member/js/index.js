
function arrowDirection(eleObj){
    if(eleObj.attr('class')=='arrow'){
        eleObj.attr('class','arrowDown');
    }else{
        eleObj.attr('class','arrow');
    }
}

function bindEvent() {
    $(".btn_1").click(function(){
        arrowDirection($(this).find('i'));
        $('.menu_1').slideToggle('fast');
    });
    $(".btn_2").click(function(){
        arrowDirection($(this).find('i'));
        $('.menu_2').slideToggle('fast');
    });
    $(".btn_3").click(function(){
        arrowDirection($(this).find('i'));
        $('.menu_3').slideToggle('fast');
    });
    $(".btn_4").click(function(){
        arrowDirection($(this).find('i'));
        $('.menu_4').slideToggle('fast');
    });
    $(".btn_5").click(function(){
        arrowDirection($(this).find('i'));
        $('.menu_5').slideToggle('fast');
    });
}

function setpass() {
    $('#menuFrame').attr('src','a.html');
}
//时间显示
function timeDisplay(){

    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    var hour=date.getHours();
    var minute=date.getMinutes();
    var second=date.getSeconds();
    var timeString=year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;
    $('.time_display').text(timeString);
    setTimeout(timeDisplay,1000);
}
timeDisplay();
bindEvent();

$('#ad_setting').click(function () {
    $('#ad_setting_ul').toggle();
})

/*getUser();
function getUser() {
    var session=localStorage.getItem('session');
    var html="";
    if(session){
        getAjax("platform/sysuser?session="+session+"&cmd=get","GET", function (msg) {
            console.log(msg)
            if(msg.result>0){
                var data=eval(msg.data);
                if(data[0].portal=="admin"){
                    html='<ul class="menu" id="menu">\
                            <li class="menu-list"><a class="btn_1">平台数据管理<i class="arrow"></i></a>\
                            <ul class="menu_1">\
                            <li><a href="admin-view/data/park-list.html" target="menuFrame">停车场列表</a></li>\
                            <li><a href="admin-view/data/commpany.html" target="menuFrame">物管公司列表</a></li>\
                        <li><a href="admin-view/data/register.html" target="menuFrame">注册用户列表</a></li>\
                        <li><a href="admin-view/data/followed.html" target="menuFrame">公众号关注列表</a></li>\
                        </ul>\
                        </li>\
                        <li class="menu-list"><a class="btn_2">平台操作员管理<i class="arrow"></i></a>\
                            <ul class="menu_2">\
                            <li><a href="admin-view/operator/manage.html" target="menuFrame">操作员管理</a></li>\
                            <li style="display: none" ><a href="404" target="menuFrame">操作日志</a></li>\
                        </ul>\
                        </li>\
                        <li class="menu-list"><a class="btn_3">集团项目管理<i class="arrow"></i></a>\
                            <ul class="menu_3">\
                            <li><a href="admin-view/group/group-list.html" target="menuFrame">集团项目列表</a></li>\
                            <li style="display: none" ><a href="404" target="menuFrame">集团停车场管理</a></li>\
                        </ul>\
                        </li>\
                        <li class="menu-list"><a class="btn_4">平台运营报告<i class="arrow"></i></a>\
                            <ul class="menu_4">\
                            <li style="display: none" ><a href="404" target="menuFrame">用户活跃度分析</a></li>\
                            </ul>\
                        </li>\
                            <li class="menu-list"><a href="admin-view/complain/complain-list.html" target="menuFrame" class="btn_0">投诉处理</a>\
                            </li>\
                            <li style="display: none" class="menu-list"><a href="404" target="menuFrame" class="btn_0">运行监控</a>\
                            </li>\
                            <li style="display: none" class="menu-list"><a href="404" target="menuFrame" class="btn_0">客服中心</a>\
                            </li>\
                            <li class="menu-list"><a class="btn_5">财务中心<i class="arrow"></i></a>\
                                <ul class="menu_5">\
                                    <li><a href="admin-view/finance/audit.html" target="menuFrame">待审核转账单</a></li>\
                                    <li><a href="admin-view/finance/register.html" target="menuFrame">转账登记</a></li>\
                                    <li><a href="admin-view/finance/transfer.html" target="menuFrame">转账日志查询</a></li>\
                                </ul>\
                            </li>\
                        </ul>';
                    $('#menuFrame').attr('src','admin-view/data/park-list.html');
                }

                else if(data[0].portal=="group"){
                    html='<ul class="menu" id="menu">\
                            <li class="menu-list"><a class="btn_1">集团数据看板<i class="arrow"></i></a>\
                            <ul class="menu_1">\
                            <li><a href="view/data/index.html" target="menuFrame">项目总览</a></li>\
                            <li><a href="view/data/parkinglot.html" target="menuFrame">车位使用情况</a></li>\
                        <li><a href="view/data/dt_in.html" target="menuFrame">在场车辆</a></li>\
                        <li><a href="view/data/flow.html" target="menuFrame">车流量分析</a></li>\
                        <li><a href="view/data/parktime.html" target="menuFrame">停车时长分析</a></li>\
                        <li><a href="view/data/commpany.html" target="menuFrame">物管公司列表</a></li>\
                        </ul>\
                        </li>\
                        <li class="menu-list"><a class="btn_2">集团财务报告<i class="arrow"></i></a>\
                            <ul class="menu_2">\
                            <li><a href="view/finance/paylog.html" target="menuFrame">收费日志</a></li>\
                            <li><a href="view/finance/bill.html" target="menuFrame">平台结算对账单</a></li>\
                        <li style="display: none"><a href="view/finance/incometoday.html" target="menuFrame">今日收入看板</a></li>\
                        <li><a href="view/finance/billofday.html" target="menuFrame">收入数据日报</a></li>\
                        <li><a href="view/finance/billofmonth.html" target="menuFrame">收入数据月报</a></li>\
                        <li><a href="view/finance/billofyear.html" target="menuFrame">收入数据年报</a></li>\
                        </ul>\
                        </li>\
                        <li class="menu-list"><a class="btn_3">平台托管数据<i class="arrow"></i></a>\
                            <ul class="menu_3">\
                            <li style="display: none" ><a href="view/hosting/" target="menuFrame">收银员交班日志</a></li>\
                            <li style="display: none" ><a href="view/hosting/" target="menuFrame">车位管理</a></li>\
                        <li style="display: none" ><a href="view/hosting/" target="menuFrame">收费项管理</a></li>\
                        <li><a href="view/hosting/fixedvehicle.html" target="menuFrame">月租及固定车辆列表</a></li>\
                        <li><a href="view/hosting/exception.html" target="menuFrame">异常操作日志</a></li>\
                        </ul>\
                        </li>\
                        </ul>';
                    $('#menuFrame').attr('src','view/data/index.html');

                }

                else if(data[0].portal=="manager"){
                    html='<ul class="menu" id="menu">\
                            <li class="menu-list"><a class="btn_1">停车场运行状态<i class="arrow"></i></a>\
                            <ul class="menu_1">\
                            <li><a href="park-view/data/index.html" target="menuFrame">基本信息</a></li>\
                            <li><a href="park-view/data/dt_in.html" target="menuFrame">在场车辆</a></li>\
                        <li><a href="park-view/data/flow.html" target="menuFrame">车流量分析</a></li>\
                        <li><a href="park-view/data/parktime.html" target="menuFrame">停车时长分析</a></li>\
                        <li><a href="park-view/data/exception.html" target="menuFrame">异常情况</a></li>\
                        </ul>\
                        </li>\
                            <li class="menu-list"><a class="btn_2">停车场营收报告<i class="arrow"></i></a>\
                                <ul class="menu_2">\
                                    <li><a href="park-view/finance/notsettled.html" target="menuFrame">未结算平台收入</a></li>\
                                    <li><a href="park-view/finance/bill.html" target="menuFrame">平台结算对账单</a></li>\
                                    <li style="display: none"><a href="park-view/finance/incometoday.html" target="menuFrame">今日收入看板</a></li>\
                                    <li><a href="park-view/finance/billofday.html" target="menuFrame">收入数据日报</a></li>\
                                    <li><a href="park-view/finance/billofmonth.html" target="menuFrame">收入数据月报</a></li>\
                                    <li><a href="park-view/finance/billofyear.html" target="menuFrame">收入数据年报</a></li>\
                                </ul>\
                            </li>\
                            <li class="menu-list"><a class="btn_4">平台托管数据<i class="arrow"></i></a>\
                                <ul class="menu_4">\
                                    <li><a href="park-view/hosting/fixedvehicle.html" target="menuFrame">月租及固定车辆管理</a></li>\
                                    <li><a href="park-view/hosting/paidlog.html" target="menuFrame">停车场收费日志</a></li>\
                                    <li style="display: none" ><a href="404" target="menuFrame">车位管理</a></li>\
                                    <li style="display: none"><a href="404" target="menuFrame">收费项管理</a></li>\
                                    <li style="display: none"><a href="404" target="menuFrame">停车场收费报表</a></li>\
                                </ul>\
                            </li>\
                        </ul>';
                    //$('#tit_name').html(data[0].);
                    $('#menuFrame').attr('src','park-view/data/index.html');

                }

                else{}
                $('.ad_setting_a').append(data[0].username);
                $('.left-menu').html(html);
                bindEvent();
            }
            else{
                alert("验证过期,请重新登陆!");
                location.href="login.html";
            }
        })
        $('#logout').unbind('click').click(function () {
            if(confirm("确认退出?")) {
                logout(session);
            }
        })
        $('#setpass').unbind('click').click(function () {
            setpass();
        })
    }
    else{
        alert("验证过期,请重新登陆");
        location.href="login.html";
    }
}*/
