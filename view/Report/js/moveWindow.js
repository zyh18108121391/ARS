var clicked = "Nope.";
var mausx = "0";
var mausy = "0";
var winx = "0";
var winy = "0";
var difx = mausx - winx;
var dify = mausy - winy;
var parent;
$("html").mousemove(function (event) {
    console.log(1);
    mausx = event.pageX;
    mausy = event.pageY;
    var dom;
    if ($("#Lab-div").css('display') == 'block') {
        dom = $("#Lab-div");
    } else if ($("#Exam-div").css('display') == 'block') {
        dom = $("#Exam-div");
    } else if($("#drug-div").css('display') == 'block'){
        dom = $("#drug-div");
    }
    if(!dom){
        return ;
    }
    winx = dom.offset().left;
    winy = dom.offset().top;
    if (clicked == "Nope.") {
        difx = mausx - winx;
        dify = mausy - winy;
    }
    var newx = event.pageX - difx - parseFloat($(dom).css("marginLeft").replace('px', ''));
    var newy = event.pageY - dify - parseFloat($(dom).css("marginTop").replace('px', ''));
    $(dom).css({top: newy, left: newx});
});

$(".pew").mousedown(function (event) {
    //parent =  $(this).parent();
    clicked = "Yeah.";
});

$("html").mouseup(function (event) {

    clicked = "Nope.";
});