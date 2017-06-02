var MEMBER=null;//会员
var DOCTOR=null;//医生
var DoctorAdvice = AV.Object.extend("DoctorAdvice");
$(document).ready(
	function() {
		var user = AV.User.current();
		if (user) {
			var user = AV.User.current();
			Query = new AV.Query('Doctor');
			Query.equalTo("Account", user);
			Query.first({
				success: function(doc) {
					DOCTOR=doc;
					main(doc);
					showAdvice(doc);
				}
			});
		}
		$("#adviceSelect").change(function(){
			var child=$(this).children('option:selected');
			var Title=$(child).attr("data_title");
			var Content=$(child).attr("data_content");
			$("#Title").val(Title);
			$("#Content").val(Content);
		});
		
	}
);
function main(doc){
	var id=geturl();
	var MemberID = geturl();
	var MemQuery = new AV.Query("Member");
	MemQuery.get(MemberID, {
		success: function(obj) {
			MEMBER=obj;
			var name=obj.get("MemberName");
			$("#name").html(name);
			var AdviceQuery = new AV.Query("DoctorAdvice");
			AdviceQuery.equalTo("Member",obj);
			AdviceQuery.equalTo("Doctor",doc);
			AdviceQuery.include("Doctor");
			AdviceQuery.find({
				success:function(results){
					ShowObject(results);
				}
			});
		}
	});
	
	
}

/*
 * 显示模板列表 到下拉框
 * 
 */
function showAdvice(doc){
	var html_op = '<option value="all">------------请选择模板------------</option>';
	var query = new AV.Query("DoctorAdviceTemplate");
	query.equalTo('Creator',doc);
	query.find({
		success:function(results){
			for (var i = 0; i < results.length; i++) {
				obj = results[i];
				if(!obj.get('Enabled')){//如果模板不可用 跳出
					continue;
				}
				var TemplateName = obj.get('TemplateName');
				html_op += '<option value="' + obj.id + '" data_title="'+obj.get('Title')+'" data_content="'+obj.get('Content')+'">' +TemplateName + '</option>';
			}
			$("#adviceSelect").html(html_op);
		}
	});
}
/*
 * 
 * 遗嘱推送
 * 
 */
function sendAdvice(){
	subStart();
	var Title = $("#Title").val();
	var Content = $("#Content").val();
	if(Title==''){
		layer.msg("请输入模板标题",{time:1000,shift:6});
		return ;
		subEnd();
	}
	if(Content==''){
		layer.msg("请输入模板正文",{time:1000,shift:6});
		return ;
		subEnd();
	}
	
	var NewDoctorAdvice=new DoctorAdvice();
	
	NewDoctorAdvice.set("Member",MEMBER);
	NewDoctorAdvice.set("Doctor",DOCTOR);
	NewDoctorAdvice.set("Title",Title);
	NewDoctorAdvice.set("Content",Content);
	NewDoctorAdvice.save(null,{
		success:function(obj){
			layer.msg("发送成功",{time:700},function(){
				window.location.reload();
				subEnd();
			});
		},
		error:function(obj){
			layer.msg("发送失败，请重试",{time:1000,shift:6});
		}
	})
}
/*
 * 把query后的结果集输出到table中 
 * 便于公用
 * 
 */
function ShowObject(results) {
	var len = results.length;
	var html = '';
	var count = 0;
	for (var i = 0; i < len; i++) {
		var obj=results[i];
		var Doctor = '';
		if (obj.get("Doctor") != null) {
			Doctor = obj.get("Doctor").get("DoctorName");
		}
		var Title = '';
		if (obj.get("Title") != null) {
			Title = obj.get("Title");
		}
		var Content = '';
		if (obj.get("Content") != null) {
			Content = obj.get("Content");
		}
	
		
		html += '<tr><td>' +Doctor+ '</td>'
			+ '<td>' + Title + '</td>'
			+ '<td>' + Content + '</td>'
			+ '<td>' + timeToString(obj.createdAt) + '</td>';
	}
	$("#tbody").html(html);
}