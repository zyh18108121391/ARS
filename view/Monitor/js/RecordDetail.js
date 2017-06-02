$(document).ready(function(){
	main();
});


function main(){
	var  ID=geturl();
	var query = new AV.Query('AgentConversationRecord');
	query.include('Agent');
	query.include('Member');
	query.get(ID,{
		success:function(obj){
            var Id = obj.id;
            var MemberName = '';
            var PhoneNo = '';
            if (obj.get("Member") != null) {
                MemberName = obj.get("Member").get("MemberName");
                PhoneNo = obj.get("Member").get("MobilePhoneNo")
            }
            var Queue = '';
			if(obj.get("QueueID") != null) {
				Queue = obj.get("QueueID");
				if(Queue != '0') {
					var query1 = new AV.Query("ServiceQueue");
					query1.equalTo("QueueID", Queue);
					query1.first({
						success: function(qu) {
							var qName = qu.get("QueueName");
							$("#Queue").html(qName);
						}
					});
				}else{
					$("#Queue").html('0 - 客服外呼');
				}
			}
            var IsQueue = '';
            if (obj.get("IsQueue") != null) {
                IsQueue = obj.get("IsQueue")?"是":"否";
            }
            var AlertingTim = '';
            if (obj.get("AlertingTim") != null) {
                AlertingTim = obj.get("AlertingTim");
            }
         
            var ConversationBeginTime = '';
			if(obj.get("ConversationBeginTime") != null) {
				ConversationBeginTime = obj.get("ConversationBeginTime");
			}
			
			var ConversationEndTime = '';
			if(obj.get("ConversationEndTime") != null) {
				ConversationEndTime = obj.get("ConversationEndTime");
			}
			var RecordFile = '';
			if(obj.get("RecordFile") != null) {
				RecordFile = obj.get("RecordFile").url();
			}
			
            var Memo= '';
            if (obj.get("Memo") != null) {
                Memo = obj.get("Memo");
            }
            var Duration = '0';
			if(obj.get("Duration") != null) {
				Duration = obj.get("Duration");
			}
            var time = obj.createdAt;
       	
            $("#MemberName").html(MemberName);
            $("#PhoneNo").html(PhoneNo);
            $("#IsQueue").html(IsQueue);
            $("#Duration").html(alertingTimeChange(Duration));
            $("#AlertingTim").html(AlertingTim);
            $("#ConversationBeginTime").html(timeToString(ConversationBeginTime));
            $("#ConversationEndTime").html(timeToString(ConversationEndTime));
           	$("#audio").attr("src",RecordFile);
            var  aud = document.getElementById("audio");
           	aud.reload();
           	$("#Memo").html(Memo);
		}
	});
}
