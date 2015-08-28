/*jshint node:true*/
var rxFeedback = {
    selReportType: {
        get: function () {
            return exports.rxSelect.initialize($('#selFeedbackType'));
        }
    },

    txtFeedback: {
        get: function () {
            return this.rootElement.element(by.model('fields.description'));
        }
    },

    open: {
        value: function () {
            var page = this;
            return this.isDisplayed().then(function (isDisplayed) {
                if (!isDisplayed) {
                    page.eleFeedback.$('a').click();
                }
            });
        }
    },

    type: {
        get: function () {
            return this.selReportType.selectedOption.text;
        },
        set: function (optionText) {
            // OK1
            var option = this.selReportType.rootElement.element(by.cssContainingText('option', optionText));
            /*
             * For some reason, it seems that the slow click method in combination
             * with an rx-select in the modal will dismiss the modal instead of
             * selecting the dropdown option.
             *
             * Reverted to basic .click() functionality, for the time being.
             */
            option.click();
        }
    },

    types: {
        get: function () {
            return this.selReportType.options;
        }
    },

    description: {
        get: function () {
            return this.txtFeedback.getAttribute('value');
        },
        set: function (feedback) {
            this.txtFeedback.clear();
            this.txtFeedback.sendKeys(feedback);
        }
    },

    descriptionPlaceholder: {
        get: function () {
            return this.txtFeedback.getAttribute('placeholder');
        }
    },

    descriptionLabel: {
        get: function () {
            return this.rootElement.$('.feedback-description').getText();
        }
    },

    redirectDescriptionText: {
        get: function () {
            return this.rootElement.$('.redirect-description').getText();
        }
    },

    send: {
        /**
          Prepares, writes, and submits feedback.
          If `confirmSuccessWithin` is defined, a confirmation of submission success must appear
          within `confirmSuccessWithin` milliseconds.

          If confirmSuccessFn is undefined, the default behavior will look for an rxNotify success
          message. Otherwise, `confirmSuccessFn` will be attempted until it yields a truthy value,
          using Protractor's `wait` function.
        */
        value: function (feedbackType, feedbackText, confirmSuccessWithin, confirmSuccessFn) {
            var page = this;
            return this.isDisplayed().then(function (isDisplayed) {
                if (!isDisplayed) {
                    page.open();
                }
                page.reportType = feedbackType;
                page.description = feedbackText;
                page.submit();
                if (confirmSuccessWithin !== undefined) {
                    page.confirmSuccess(confirmSuccessWithin, confirmSuccessFn);
                }
            });
        }
    },

    confirmSuccess: {
        value: function (within, fn) {
            if (fn === undefined) {
                fn = function () {
                    return exports.rxNotify.all.exists('feedback', 'success');
                };
            }

            browser.wait(function () {
                return fn();
            }, within, 'feedback submission did not confirm success within ' + within + ' msecs');
        }
    }
};//rxFeedback

exports.rxFeedback = {
    initialize: function (rxFeedbackElement) {
        rxFeedback.eleFeedback = {
            get: function () { return rxFeedbackElement; }
        };
        return exports.rxModalAction.initialize(rxFeedback);
    }
};
