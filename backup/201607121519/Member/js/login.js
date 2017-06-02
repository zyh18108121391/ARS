function login() {
	var username=$("#sysuser").val();
	var password=$("#password").val();
	if(username==''){
		alert("请输入用户名");
		return false;
	}
	if(password==''){
		alert("请输入密码");
		return false;
	}
	AV.User.logIn(username, password, {
		success: function(user) {
			/*window.location.href = "index.html";*/
			console.log("登录成功");
			window.location.href="index.html";
		},
		error: function(user, error) {
			if (error.message == "The username and password mismatch.") {
				alert("登录失败！密码不正确。");
				$("#password").focus();
			}
		}
	});

}