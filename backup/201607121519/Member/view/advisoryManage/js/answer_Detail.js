var Member=null;
var doctorName='';
$(document).ready(
	function() {
		user = AV.User.current();
		if (user) {
			var user = AV.User.current();
			Query = new AV.Query('Doctor');
			Query.equalTo("Account", user);
			Query.first({
				success: function(doc) {
					doctorName= doc.get("DoctorName");
					main(doc);
				}
			});
		}
	}
);

function main(doctor) {
	var id = geturl();
	var query = new AV.Query('Counsel');
	query.include('Member');
	query.include('Doctor');
	query.include('CounselType');
	query.get(id, {
		success: function(obj) {
			if(obj.get("Statu")=='999'){//已完成 不需要回复
				$("#replay_div").css("display","none");
			}else{
				$("#replay_div").css("display","block");
			}
			var MemberName = '';
			if (obj.get("Member") != null) {
				MemberName = obj.get("Member").get("MemberName");
			}
			var HeadPortrait = '';
			if (obj.get("Member") != null) {
				HeadPortrait = obj.get("Member").get("HeadPortrait").url();
			}
			var TypeName = '';
			if (obj.get("CounselType") != null) {
				TypeName = obj.get("CounselType").get("TypeName");
			}
			var CounselContent = '';
			if (obj.get("CounselContent") != null) {
				CounselContent = obj.get("CounselContent");
			}
			var time = obj.createdAt;
			var MemberLevelID = '';
			if (obj.get("CounselContent") != null) {
				MemberLevelID = obj.get("Member").get("MemberLevel").id;
				var query = new AV.Query('MemberLevel');
				query.get(MemberLevelID, {
					success: function(le) {
						var html = '<img src="' + le.get("LevelIcon").url() + '"/>' + le.get("LevelName");
						$("#level").html(html);
					}
				})
			}
			//显示回复列表
			var Posts = obj.relation('Posts');
			var query1 = Posts.query();
			query1.descending("createdAt");
			query1.find({
				success: function(results) {
					var html="";
					for (var j = 0; j < results.length; j++) {
						var ob = results[j];
						var content = '暂无回复';
						if (ob) {
							var del_html='';
							var name='';
							var headUrl='';
							if (ob.get("PostType") =='1') {
								name="ARS--"+doctorName;
								content = ob.get("DoctorPost");
								headUrl="images/doctor.jpg";
								var del_html = '<div class="del-btn"><a href="javascript:deleteCP(\'' + ob.id + '\')">删除</a></div>';
							} else {
								headUrl=HeadPortrait;
								name=MemberName;
								content = ob.get("MemberPost");
							}
						}
						var time_li = ob.createdAt;
						
						html+='<div class="ticket-thread">'
						+'<div class="thread-status">'
						+'<div class="head"><img src=\"'+headUrl+'\"/></div>'
						+'<div class="head-name">'
						+'<div><strong class="ticket-username">'+name+'</strong></div>'
						+'<div><span class="time">@ '+timeToString(time_li)+'</span></div>'
						+'</div>'
						+del_html
						+'<div class="clear"></div>'
						+'</div>'
						+'<div class="thread-contant">'
						+'<pre>'+content+'</pre>'
						+'</div>'
						+'</div>'
					}
					$("#thread").html(html);
				}
			});
			var h='<img src=\"'+HeadPortrait+'\"/>';
			$("#head").html(h);
			$("#name").html(MemberName);
			$("#content").html(CounselContent);
			$("#time").html(timeToString(time));

		}
	});
}
function replay(){
	subStart();
	var answer= $("#replay").val();
	if(answer==''){
		alert("请输入回复内容");
		$("#replay").focus();
		subEnd();
		return ;
	}
	var newObj=new CounselPost();
	newObj.set('DoctorPost',answer);
	newObj.set('PostType',1);
	var MyCounsel=AV.Object.createWithoutData('Counsel',geturl());
	var relation = MyCounsel.relation("Posts");
	newObj.save(null,{
		success:function(obj){
			relation.add(obj);
			MyCounsel.save(null,{
				success:function(a){
					alert("回复成功");
					window.location.reload();
				}
			});
		}
	});
}

function deleteCP(id){
	var MyCounsel = AV.Object.createWithoutData('CounselPost', id);
	MyCounsel.destroy().then(function(success) {
		// 删除成功
		alert("删除成功");
		window.location.reload();
	},
	function(error) {
		// 删除失败
	});
}
