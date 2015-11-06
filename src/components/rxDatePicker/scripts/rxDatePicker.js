angular.module('encore.ui.rxDatePicker')
.directive('rxDatePicker', function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/rxDatePicker.html',
        scope: {
            'ngModel': '='
        },
        link: function (scope, element) {
            scope.currentDate = moment(scope.ngModel);
            scope.weeks = [];
            scope.preview = false;
            var datePickerElement = angular.element(element[0].querySelector('.fake-date-picker'));

            datePickerElement.bind('click', function () {
                scope.$apply(function () {
                    scope.preview = !scope.preview;
                });
            });

            scope.renderCalendar = function (date) {
                var currentDate = moment(date);
                var calendar = moment(date);
                var daysInMonth = currentDate.endOf('month').date();
                var startDayOfMonth = currentDate.startOf('month').day();
                var weeksInMonth = daysInMonth / 7;
                var lastWeekofMonth = 6 - (6 - startDayOfMonth);

                scope.currentMonth = currentDate.format('MMMM YYYY');
                scope.dateDisplay = currentDate.format('MMMM D, YYYY');

                calendar.set('date', 1);
                calendar.subtract(lastWeekofMonth, 'days');
                for (var week = 0; week <= weeksInMonth; week++) {
                    scope.weeks[week] = [];
                    for (var i = 0; i <= 6; i++) {
                        var data = {
                            format: calendar.format(),
                            selected: calendar.date() === currentDate.date(),
                            date: calendar.date()
                        };
                        scope.weeks[week].push(data);
                        calendar.add(1, 'days');
                    }
                }
            };

            scope.nextMonth = function () {
                scope.currentDate.add(1, 'month');
                scope.renderCalendar(scope.currentDate);
            };

            scope.prevMonth = function () {
                scope.currentDate.subtract(1, 'month');
                scope.renderCalendar(scope.currentDate);
            };

            scope.selectDate = function (date) {
                scope.currentDate = moment(date);
                scope.ngModel = scope.currentDate;
            };

            scope.thisMonth = function (date) {
                return scope.currentDate.month() === moment(date).month();
            };

            scope.renderCalendar(scope.currentDate);
        }
    };
});
