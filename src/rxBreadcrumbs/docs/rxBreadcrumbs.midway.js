var demoPage = require('../../../utils/demo.page.js');
var rxBreadcrumbsPage = require('../rxBreadcrumbs.page.js').rxBreadcrumbs;
var expect = require('chai').use(require('chai-as-promised')).expect;

describe('rxBreadcrumbs', function () {
    var breadcrumbs;

    before(function () {
        demoPage.go();
        var ptor = protractor.getInstance();
        breadcrumbs = rxBreadcrumbsPage.initialize(ptor.findElement(protractor.By.css('.site-breadcrumbs')));
    });

    it('should show element', function () {
        expect(breadcrumbs.rootElement.isDisplayed()).to.eventually.equal(true);
    });

});