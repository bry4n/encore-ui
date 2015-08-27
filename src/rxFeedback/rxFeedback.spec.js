/* jshint node: true */
describe('rxFeedback', function () {
    var scope, compile, rootScope, el, feedbackSvc, apiUrl, httpMock,
        notifySvcMock, screenshotSvcMock, elScope, sessionSvcMock, locationMock;
    var validTemplate = '<rx-feedback></rx-feedback>';
    var theScreenshot = 'the screenshot';

    var feedback = {
        type: {
            label: 'type'
        },
        description: 'give me the kitchen sink'
    };

    var feedbackWithScreenshot = {
        type: feedback.type.label,
        description: feedback.description,
        screenshot: theScreenshot
    };

    beforeEach(function () {
        notifySvcMock = {
            add: sinon.stub()
        };

        screenshotSvcMock = {
            capture: sinon.stub().returns({
                then: sinon.stub().callsArgWith(0, theScreenshot)
            })
        };

        sessionSvcMock = {
            getUserId: sinon.stub()
        };

        locationMock = {
            url: sinon.stub()
        };

        // load module
        module('encore.ui.configs');
        module('encore.ui.rxFeedback');

        // load templates
        module('templates/rxFeedback.html');

        module(function ($provide) {
            $provide.value('rxNotify', notifySvcMock);
            $provide.value('rxScreenshotSvc', screenshotSvcMock);
            $provide.value('Session', sessionSvcMock);
            $provide.value('$location', locationMock);
        });

        // Inject in angular constructs
        inject(function ($rootScope, $compile, rxFeedbackSvc, $httpBackend, feedbackApi) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            compile = $compile;
            feedbackSvc = rxFeedbackSvc;
            apiUrl = feedbackApi;
            httpMock = $httpBackend;

            httpMock.expectGET('/encore/feedback/route-map.json').respond(404);
        });

        // overwrite the fallback so it doesn't refresh the page
        feedbackSvc.fallback = sinon.stub();

        el = helpers.createDirective(validTemplate, compile, scope);
        elScope = el.isolateScope();

    });

    it('should set the current url of the page on the modal\'s scope', function () {
        var modalScope = { '$watch': sinon.stub() };
        locationMock.url.returns('/path');
        elScope.setCurrentUrl(modalScope);
        expect(modalScope.currentUrl).to.equal('/path');
    });

    it('should submit data to feedback api', function () {
        httpMock.expectPOST(apiUrl, feedbackWithScreenshot).respond(200);

        elScope.sendFeedback(feedback);

        httpMock.flush();

        expect(notifySvcMock.add.args[0][1].type).to.equal('success');
    });

    it('should submit data even if screenshot fails', function () {
        var failureReason = 'some failure reason';

        var feedbackWithFailure = _.clone(feedbackWithScreenshot);
        feedbackWithFailure.screenshot = failureReason;

        httpMock.expectPOST(apiUrl, feedbackWithFailure).respond(200);

        screenshotSvcMock.capture = sinon.stub().returns({
            then: sinon.stub().callsArgWith(1, failureReason)
        });

        elScope.sendFeedback(feedback);

        httpMock.flush();

        expect(notifySvcMock.add.args[0][1].type).to.equal('success');
    });

    it('should show custom success message', function () {
        var customSuccess = '(successkid)';

        httpMock.expectPOST(apiUrl, feedbackWithScreenshot).respond({
            message: customSuccess
        });

        elScope.sendFeedback(feedback);

        httpMock.flush();

        expect(notifySvcMock.add.args[0][0]).to.equal(customSuccess);
    });

    it('should show error message on API failure', function () {
        httpMock.expectPOST(apiUrl, feedbackWithScreenshot).respond(404);

        elScope.sendFeedback(feedback);

        httpMock.flush();

        expect(notifySvcMock.add.args[0][1].type).to.equal('error');
    });

    it('should call fallback on failure', function () {
        httpMock.expectPOST(apiUrl, feedbackWithScreenshot).respond(404);

        elScope.sendFeedback(feedback);

        httpMock.flush();

        expect(feedbackSvc.fallback).to.be.calledOnce;
    });

    it('should show custom failure message', function () {
        var customFailure = '(fail)';

        httpMock.expectPOST(apiUrl, feedbackWithScreenshot).respond(404, {
            message: customFailure
        });

        elScope.sendFeedback(feedback);

        httpMock.flush();

        expect(notifySvcMock.add.args[0][0]).to.contain(customFailure);
    });

    it('should attempt to redirect a user when feature requests are chosen', function () {

    });

    describe('overwriting sendFeedback functionality', function () {
        var kitchenSink = function () { return 'kitchen sink, please'; };
        var customTemplate = '<rx-feedback on-submit="kitchenSink"></rx-feedback>';
        var elCustomScope, elCustom;

        beforeEach(function () {
            scope.kitchenSink = kitchenSink;
            sinon.spy(scope, 'kitchenSink');
            elCustom = helpers.createDirective(customTemplate, compile, scope);
            elCustomScope = elCustom.isolateScope();
        });

        it('should apply the custom feedback function for on-submit', function () {
            elCustomScope.sendFeedback();
            expect(scope.kitchenSink).to.be.calledOnce;
        });

    });

});

describe('rxScreenshotSvc', function () {
    var rootScope, compile, scope, svc, timeout, el;
    var validTemplate = '<h1>Here is some content</h1>';

    beforeEach(function () {
        // load module
        module('encore.ui.rxFeedback');

        // Inject in angular constructs
        inject(function ($rootScope, $compile, rxScreenshotSvc, $timeout) {
            rootScope = $rootScope;
            scope = rootScope.$new();
            compile = $compile;
            svc = rxScreenshotSvc;
            timeout = $timeout;
        });

        el = helpers.createDirective(validTemplate, compile, scope);
    });

    it('should exist', function () {
        expect(svc).to.exist;
    });

    it('should reject promise if html2canvas not available', function (done) {
        delete window.html2canvas;

        var promise = svc.capture();

        promise.catch(function (reason) {
            expect(reason).to.exist;

            done();
        });

        scope.$digest();
    });

    it('should capture a screenshot if dependencies exist', function (done) {
        window.html2canvas = function (target, options) {
            options.onrendered({
                toDataURL: function () {
                    return 'dataurl';
                }
            });
        };

        var promise = svc.capture(el[0]);

        promise.then(function (screenshot) {
            expect(screenshot).to.exist;

            done();
        });

        scope.$digest();
    });
});

describe('rxFeedbackSvc', function () {
    var feedbackSvc, mockResource, mockWindow, mockNotifySvc;
    var apiUrl = 'myurl';

    beforeEach(function () {
        // load module
        module('encore.ui.rxFeedback');

        mockResource = sinon.stub().returns({
            save: sinon.stub()
        });

        mockWindow = {
            location: {},
            open: sinon.stub()
        };

        mockNotifySvc = {
            add: sinon.stub()
        };

        module(function ($provide) {
            $provide.value('feedbackApi', apiUrl);
            $provide.value('$resource', mockResource);
            $provide.value('$window', mockWindow);
            $provide.value('rxNotify', mockNotifySvc);
        });

        // Inject in angular constructs
        inject(function (rxFeedbackSvc) {
            feedbackSvc = rxFeedbackSvc;
        });
    });

    it('should exist', function () {
        expect(feedbackSvc).to.exist;
    });

    it('should have a default apiEndpoint', function () {
        expect(mockResource).to.be.calledWith(apiUrl);
        expect(feedbackSvc.api.save).to.exist;
    });

    it('should allow overwriting that endpoint', function () {
        // set new api url
        var newUrl = 'newUrl';
        var resource = 'newUrlResource';

        mockResource.returns(resource);
        feedbackSvc.setEndpoint(newUrl);

        expect(mockResource).to.be.calledWith(newUrl);
        expect(feedbackSvc.api).to.equal(resource);
    });

    it('should have default fallback function to send e-mail', function () {
        var fackFeedback = {
            type: {
                label: 'test'
            },
            descrption: 'test'
        };

        expect(feedbackSvc.fallback).to.be.a.function;

        feedbackSvc.fallback(fackFeedback);

        expect(mockWindow.open).to.be.calledOnce;
    });

    it('should show e-mail feedback in current window if new window fails to load', function () {
        var feedback = {
            type: {
                label: 'test'
            },
            description: 'test'
        };

        expect(feedbackSvc.fallback).to.be.a.function;

        mockWindow.open.returns(undefined);
        feedbackSvc.fallback(feedback);

        expect(mockWindow.location.href).to.contain(feedback.type.label);
        expect(mockWindow.location.href).to.contain(feedback.description);
    });

    it('should allow setting a custom e-mail address', function () {
        var feedback = {
            type: {
                label: 'test'
            },
            description: 'test'
        };

        var ninetiesEmail = '_x_masta-ram_x_@aol.com';

        feedbackSvc.email = ninetiesEmail;

        mockWindow.open.returns(undefined);
        feedbackSvc.fallback(feedback);

        expect(mockWindow.location.href).to.contain(ninetiesEmail);
    });
});

describe('UserVoiceMapping', function () {
    var userVoiceSvc, scope, routeGet, interval, httpBackend, windowSvc;

    var defaultBaseURL = 'https://get.feedback.rackspace.com/forums/297396-encore';

    var defaultResponse = {
        'base': 'http://mock-base.com',
        'categoryPrefix': '/category',
        '/billing': '132123-billing',
        '/test': '132126-cloud'
    };

    beforeEach(function () {
        module('encore.ui.rxFeedback');

        module(function ($provide) {
            $provide.value('$window', {
                open: sinon.stub()
            });
        });

        inject(function ($rootScope, UserVoiceMapping, $httpBackend, $window, $interval) {
            userVoiceSvc = UserVoiceMapping;
            scope = $rootScope.$new();
            httpBackend = $httpBackend;
            windowSvc = $window;
            interval = $interval;

            // Set type to the first feedback type
            scope.feedback = {
                type: { label: 'Some Name' }
            };

            scope.$watch('feedback.type', userVoiceSvc.watch);
        });
    });

    describe('Scope Interactions', function () {
        beforeEach(function () {
            routeGet = httpBackend.expectGET('/encore/feedback/route-map.json');
            routeGet.respond(200, defaultResponse);
            httpBackend.flush();
        });

        afterEach(function () {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should set showRedirectMessage to false on every call', function () {
            expect(scope.showRedirectMessage, 'showRedirectMessage false after flush digest').to.be.false;

            scope.feedback.type = { label: 'Some Other Label' };
            scope.$digest();

            expect(scope.showRedirectMessage, 'showRedirectMessage false after digest').to.be.false;

            scope.feedback.type = { label: 'Some Really Bogus Label' };
            scope.showRedirectMessage = true;
            scope.$digest();

            expect(scope.showRedirectMessage, 'showRedirectMessage reverted back to false').to.be.false;
        });

        it('should set showRedirectMessage to true if type.label is Feature Request', function () {
            expect(scope.showRedirectMessage, 'showRedirectMessage false after flush digest').to.be.false;

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.showRedirectMessage, 'showRedirectMessage true after digest').to.be.true;
        });

        it('should not make more http calls after multiple calls to fetchRoutes', function () {
            scope.feedback.type = { label: 'Oh Label my Label' };
            scope.$digest();

            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should save the final route to scope when the right type is chosen', function () {
            expect(scope.route).to.be.undefined;

            scope.feedback.type = { label: 'Oh Route my Label' };
            scope.$digest();

            expect(scope.route).to.be.undefined;

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.route).to.eql('http://mock-base.com');
        });

        it('should maintain a flag that tells scope we are loading a new window', function () {
            expect(scope.loadingUserVoice).to.be.undefined;

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.loadingUserVoice).to.be.true;

            interval.flush(3000);
            scope.$digest();

            expect(scope.loadingUserVoice).to.be.false;
        });

    });

    describe('Default Overrides', function () {
        beforeEach(function () {
            routeGet = httpBackend.expectGET('/encore/feedback/route-map.json');
        });

        afterEach(function () {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should have default base URL if route responds with error', function () {
            routeGet.respond(400, {});
            httpBackend.flush();

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.route).to.eql(defaultBaseURL);
        });

        it('should have default category prefix if route responds without custom categoryPrefix', function () {
            routeGet.respond(200, {
                '/': 'some-new-route'
            });
            httpBackend.flush();

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.route).to.eql(defaultBaseURL + '/category/some-new-route');
        });

        it('should override default category prefix', function () {
            routeGet.respond(200, {
                'categoryPrefix': 'prefix-me-url',
                '/': 'some-new-route'
            });
            httpBackend.flush();

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.route).to.eql(defaultBaseURL + '/prefix-me-url/some-new-route');
        });

        it('should override base url', function () {
            routeGet.respond(200, {
                'base': 'http://something',
                '/': 'some-new-route'
            });
            httpBackend.flush();

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();

            expect(scope.route).to.eql('http://something/category/some-new-route');
        });
    });

    describe('Actions', function () {
        beforeEach(function () {
            routeGet = httpBackend.expectGET('/encore/feedback/route-map.json');
            routeGet.respond(200, defaultResponse);
            httpBackend.flush();

            scope.feedback.type = { label: 'Feature Request' };
            scope.$digest();
        });

        afterEach(function () {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should maintain open a new window', function () {
            expect(windowSvc.open).to.have.been.notCalled;

            interval.flush(3000);
            scope.$digest();

            expect(windowSvc.open).to.have.been.calledOnce;
        });

        it('should cancel the interval to open a window', function () {
            expect(windowSvc.open).to.have.been.notCalled;

            userVoiceSvc.cancelOpen();
            interval.flush(3000);
            scope.$digest();

            expect(windowSvc.open).to.have.been.notCalled;
        });
    });

});