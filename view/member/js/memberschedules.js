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

function main(dotor) {
	
	var query = new AV.Query('EventsCalendar');
	query.include('EventType');
	query.include('Hospital');
	query.include('ConsultingRoom');
	query.include('MedicalResult');
	query.descending('createdAt');
	var member = AV.Object.createWithoutData('Member',geturl());
	
	query.equalTo('Doctor', dotor);
	query.equalTo('Member', member);
	query.find().then(function(results) {
		addHtml(results, 31);
	}, function(error) {
		console.log(JSON.stringify(error+"123"));
	});
}

function addHtml(results, s) {
	
	var htmlStrComplete = '',
		htmlStr = '',
		tStr;
	var ConfirmAT, MedicalResult;
	var DoctorConfirm, Statu, EvaluationByDoctor, RatingByDoctor;
	for (var i = 0; i < results.length; i++) {
		
		if(results[i].get('ConfirmAT')){
			ConfirmAT = getTime(results[i].get('ConfirmAT'));
		}else{
			ConfirmAT="暂无确认";
		}
		MedicalResult = results[i].get('MedicalResult') ? results[i].get('MedicalResult').get('MedicalResult') : '无';
		DoctorConfirm = results[i].get('DoctorConfirm');
		Statu = results[i].get('Statu');
		EvaluationByDoctor = results[i].get('EvaluationByDoctor');
		RatingByDoctor = results[i].get('RatingByDoctor');
		if(results[i].get('RatingByMember')){
			RatingByMember = getTime(results[i].get('ConfirmAT'));
		}else{
			RatingByMember="暂无评分";
		}
		tStr = '<tr id="' + results[i].id + '">'+
			'<td class="goToSd">' + results[i].get('EventType').get('EventTypeName') + '</td>'+
			'<td class="goToSd">' + ConfirmAT + '</td>' +
			'<td class="goToSd">' + results[i].get('Hospital').get('HospitalName') + '</td>'+
			'<td class="goToSd">' + results[i].get('ConsultingRoom').get('RoomName') + '</td>' +
			'<td class="goToSd">' + MedicalResult + '</td>' +
			'<td class="goToSd">' + Statu + '</td>' +
			'<td class="goToSd">' + RatingByMember + '</td>' +
			'<td>' + buttonHtml(DoctorConfirm, Statu, EvaluationByDoctor, RatingByDoctor) + '</td>' +
			'</tr>';

		if (Statu == 31) {
			htmlStrComplete += tStr;
		} else {
			htmlStr += tStr;
		}
	}

	$('#member_schedules').html(htmlStr + htmlStrComplete);
}

function buttonHtml(DoctorConfirm, Statu, EvaluationByDoctor, RatingByDoctor) {
	var butHtml = '';
	if (DoctorConfirm != 1) {
		butHtml += '<a href="../../view/scheduleControl/surePrebook.html"><button class="btn btn-danger">确认预约</button></a>' +
			'<button class="btn btn-danger">重新协调</button>';
	} else {
		if (Statu == 11 || Statu == 21) {
			butHtml += '<a href="filloutDiagnosis.html"><button class="btn btn-danger">填写诊断结果</button></a>';
		}
		if (Statu == 31) {
			butHtml += '<button class="btn btn-danger">查看诊断结果</button>';
		}
		if (EvaluationByDoctor && RatingByDoctor) {
			butHtml += '<button class="btn btn-danger">已评价</button>';
		} else {
			butHtml += '<a href="scheduleComment.html"><button class="btn btn-danger">评价</button></a>';
		}
	}
	return butHtml;
}

function getTime(ConfirmAT) {
	var y = ConfirmAT.getFullYear();
	var month = ConfirmAT.getMonth() + 1;
	var day = ConfirmAT.getDay();
	return y + '-' + month + '-' + day + ' ' + ConfirmAT.getHours() + ':' + ConfirmAT.getMinutes() + ':' + ConfirmAT.getSeconds();
}

$('#member_schedules').on('click', '.goToSd', function() {
	location.href = 'scheduleDetail.html?id=' + $(this).parent().attr('id');
});