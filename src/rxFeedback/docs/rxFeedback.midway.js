var _ = require('lodash');

var feedback = encore.rxFeedback;

describe('rxFeedback', function () {
    var successfulFeedback, unsuccessfulFeedback;
    var defaultFeedback = 'Software Bug';

    before(function () {
        demoPage.go('#/components/rxFeedback');
        successfulFeedback = feedback.initialize($('#rxFeedbackSucceeds'));
        unsuccessfulFeedback = feedback.initialize($('#rxFeedbackFails'));
    });

    it('should select the "' + defaultFeedback + '" feedback type by default', function () {
        successfulFeedback.open();
        expect(successfulFeedback.type).to.eventually.equal(defaultFeedback);
    });

    it('should have the default feedback description label for "' + defaultFeedback + '"', function () {
        expect(successfulFeedback.descriptionLabel).to.eventually.equal('Bug Description:');
    });

    it('should have the default feedback placeholder text for "' + defaultFeedback + '"', function () {
        var placeholder = 'Please be as descriptive as possible so we can track it down for you.';
        expect(successfulFeedback.descriptionPlaceholder).to.eventually.equal(placeholder);
    });

    it('should include the url in the subtitle', function () {
        browser.getCurrentUrl().then(function (url) {
            var feedbackUrl = url.split('#')[1];
            expect(successfulFeedback.subtitle).to.eventually.equal('for page: ' + feedbackUrl);
        });
    });

    describe('feedback types and labels', function () {
        var defaultUserVoiceURL = 'https://get.feedback.rackspace.com/forums/297396-encore';
        var typesAndLabels = {
            'Incorrect Data': {
                descriptionLabel: 'Problem Description:',
                descriptionPlaceholder: ['Please be as descriptive as possible ',
                                         'so we can figure it out for you.'].join('')
            },
            'Feature Request': {
                redirectDescriptionText: ['We want to hear your voice!',
                                          '*You will now be redirected to a new window.*',
                                          defaultUserVoiceURL + ' Cancel Redirect'].join('\n')
            },
            'Kudos': {
                descriptionLabel: 'What made you happy?:',
                descriptionPlaceholder: ['We love to hear that you\'re enjoying Encore! ',
                                         'Tell us what you like, and what we can do to ',
                                         'make it even better'].join('')
            }
        };

        it('should have all feedback types', function () {
            var types = [defaultFeedback].concat(_.keys(typesAndLabels));
            expect(successfulFeedback.types).to.eventually.eql(types);
        });

        _.forEach(typesAndLabels, function (typeData, type) {
            it('should switch feedback types', function () {
                successfulFeedback.type = type;
                expect(successfulFeedback.type).to.eventually.equal(type);
            });

            _.forEach(typeData, function (text, property) {
                it('should have the correct label set for ' + property, function () {
                    expect(successfulFeedback[property]).to.eventually.equal(text);
                });
            });
        });

        it('should open a new window after 3 seconds for Feature Request', function () {
            successfulFeedback.open();
            successfulFeedback.type = 'Feature Request';
            browser.sleep(3000);
            browser.getAllWindowHandles().then(function (handles) {
                expect(handles.length).to.eql(2);
                browser.switchTo().window(handles[1]).then(function () {
                    // This will automatically go to the NAM Rackspace Login page
                    expect(browser.driver.getCurrentUrl()).to.eventually.contain('uservoice');
                    browser.driver.close();
                });

                // Get back to original window
                browser.switchTo().window(handles[0]);
            });

        })

        after(function () {
            successfulFeedback.type = 'Kudos'
        });

    });

    describe('submitting feedback', function () {

        it('should successfully submit feedback', function () {
            var send = function () {
                var deferred = protractor.promise.defer();
                deferred.fulfill(successfulFeedback.send('Software Bug', 'test', 3000));
                return deferred.promise;
            };
            expect(send()).to.not.be.rejectedWith(Error);
        });

        it('should catch errors on unsuccessful feedback', function () {
            var send = function () {
                var deferred = protractor.promise.defer();
                deferred.fulfill(unsuccessfulFeedback.send('Software Bug', 'test', 3000));
                return deferred.promise;
            };
            browser.sleep(2000);
            expect(send()).to.be.rejectedWith(Error);
        });

    });

});
