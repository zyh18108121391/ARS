var doctor;
//放在全局 搜索使用的对象
var page = 0; //当前页数
var maincount = 0; //总数目
var totlePage = 0; //总页数
var pageNumber = 10; //翻页大小默认为10
var query;
var newLevel = AV.Object.createWithoutData('MemberLevel', '576bd52279bc44005bdfb33c');
main();
//主函数
function main() {
	ShowSelectOption("MemberLevel", "LevelName", "level"); //显示会员等级下拉列表
	ShowSelectOption("Disease", "DiseaseName", "Disease_sel"); //显示病情下拉列表
	query = new AV.Query('Member');
	query.notEqualTo("MemberLevel", newLevel);
	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.descending('JoinTime');
	showPages(query); //显示页数和总条数 在limit之前使用
	showNowPageResults(query); //显示当前页数据
}

//把query后的结果集输出到table中便于公用
function ShowObject(results) {
	var len = results.length;
	var html = '',
		htmlArray = [];
	var count = 0;
	for(var i = 0; i < len; i++) {
		(function(i) {
			var obj = results[i];
			var memberId = obj.id;
			var HeadPortrait = '';
			if(obj.get("HeadPortrait")) {
				HeadPortrait = obj.get("HeadPortrait").url();
			} else {
				HeadPortrait = '../../images/touxiang.jpg';
			}

			var MemberName = '';
			if(obj.get("MemberName") != null) {
				MemberName = obj.get("MemberName");
			}
			var MobilePhoneNo = '';
			if(obj.get("MobilePhoneNo") != null) {
				MobilePhoneNo = obj.get("MobilePhoneNo");
			}
			var DoctorName = '';
			var DoctorID = '';
			if(obj.get("PersonalDoctor") != null) {
				DoctorName = obj.get("PersonalDoctor").get("DoctorName");
				DoctorID = obj.get("PersonalDoctor").id;
			}
			var LevelName = '';
			var LevelIcon = '';
			var LevelID = '';
			if(obj.get("MemberLevel") != null) {
				var le = obj.get("MemberLevel");
				LevelID = le.id;
				LevelName = le.get("LevelName");
				LevelIcon = le.get("LevelIcon").url();
			}

			var city = '';
			if(obj.get("City") != null) {
				city = obj.get("City").get("CityName");
			}

			var Activeness = '';
			if(obj.get("Activeness") != null) {
				Activeness = obj.get("Activeness");
			}
			var Satisfaction = '';
			if(obj.get("Satisfaction") != null) {
				Satisfaction = obj.get("Satisfaction");
			}
			var DiseaseArray = []; //疾病数组
			var Disease = obj.relation('Disease');
			Disease.query().find({
				success: function(result) {
					for(var j = 0; j < result.length; j++) {
						DiseaseArray.push(result[j].get('DiseaseName'));
					}
					count += 1;
					htmlArray[i] = '<tr>' +
						'<td><input type="radio" name="member" id="' + memberId + '" value="' +
						MemberName + '" DoctorName="' + DoctorName + '" DoctorID="' + DoctorID + '" PhoneNo="' + MobilePhoneNo + '" LevelName="' + LevelName + '" LevelIcon="' + LevelIcon + '" LevelID="' + LevelID + '"/></td>' +
						'<td><img src="' + HeadPortrait + '" width="30px"></td>' +
						'<td>' + MemberName + '</td>' +
						'<td>' + DoctorName + '</td>' +
						'<td><img src="' + LevelIcon + '" width="15px">' + LevelName + '</td>' +
						'<td>' + DiseaseArray.toString() + '</td>' +
						'<td>' + city + '</td>' +
						'<td>' + getStartlevalDivPersonal(Satisfaction) + '</td>' +
						'<td>' + getStartlevalDivPersonal(Activeness) + '</td>' +
						'</tr>'
					if(count == len) {
						for(var k = 0; k < len; k++) {
							html += htmlArray[k];
						}
						$("#table-body").html(html);
					}
				}
			});
		})(i);
	}
}

//显示下拉框列表
function ShowSelectOption(className, typeName, id) {
	var html_op = '',
		obj;
	var query = new AV.Query(className);
	query.find({
		success: function(results) {
			for(var i = 0; i < results.length; i++) {
				obj = results[i];
				var Name = obj.get(typeName);
				if(Name == '普通用户') continue;
				html_op += '<option value=\"' + obj.id + '\">' + Name + '</option>';
			}
			$("#" + id).append(html_op);
		}
	});
}

//搜索函数
function SearchBtn() {
	var level = $("#level option:selected").val();
	var rep = $("#Disease_sel option:selected").val();
	var score = $("#score option:selected").val();
	var telNo = $("#Search_telNo").val();
	page = 0;
	/* if(telNo!=null&&telNo.length!=11){
		layer.msg("请输入正确的电话号码");
		return;
	}*/
	if(rep != 'all') {
		var myRep = AV.Object.createWithoutData('Disease', rep);
		query = AV.Relation.reverseQuery('Member', 'Disease', myRep);
	} else {
		query = new AV.Query('Member');
	}
	query.notEqualTo("MemberLevel", newLevel);
	if(level != 'all') {
		var myLe = AV.Object.createWithoutData('MemberLevel', level);
		query.equalTo("MemberLevel", myLe);
	}
	if(score != 'all') {
		query.equalTo("Satisfaction", parseInt(score));
	}
	if(telNo.length == 11) query.equalTo("MobilePhoneNo", telNo);

	query.include("MemberLevel");
	query.include("City");
	query.include("PersonalDoctor");
	query.include("Account");
	query.descending('JoinTime');
	showPages(query, true); //显示页数和总条数 在limit之前使用
	showNowPageResults(query); //显示当前页数据
}

function SelectBack() {
	$(".memberList").css("display", "none");
	$(".NewComplain").css("display", "block");
}