$(document).ready(
	function() {
		user = AV.User.current();
		if (user) {
			var user = AV.User.current();
			Query = new AV.Query('Doctor');
			Query.equalTo("Account", user);
			Query.first({
				success: function(doc) {
					main(doc);
				}
			});
		}
	}
);
function main(doc){
	var id=geturl();
	var MemberID = geturl();
	var MemQuery = new AV.Query("Member");
	MemQuery.get(MemberID, {
		success: function(obj) {
			var name=obj.get("MemberName");
			$("#name").html(name);
		}
	});
}
