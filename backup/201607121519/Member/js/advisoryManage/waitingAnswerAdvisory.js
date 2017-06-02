var doc = AV.Object.createWithoutData('Doctor', '576b5db5a633bd0064053436');
var query = new AV.Query('EventsCalendar');
query.equalTo('Doctor', doc);
query.get('576b5db5a633bd0064053436').then(function (data) {
    // 成功获得实例
    // data 就是 id 为 57328ca079bc44005c2472d0 的 Todo 对象实例
}, function (error) {
    // 失败了
});