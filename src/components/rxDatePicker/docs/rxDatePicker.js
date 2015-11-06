angular.module('demoApp')
.controller('rxDatePickerCtrl', function ($scope) {
    $scope.dateModel = new Date();
    $scope.minDate = $scope.dateModel;
    $scope.maxDate = null;
});
