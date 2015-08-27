var config = require('../util/config');

module.exports = {
    options: {
        port: '<%= config.serverPort %>',
        hostname: '<%= config.serverHostname %>'
    },
    proxies: [
        {
            context: '/api/identity',
            host: 'identity.api.rackspacecloud.com',
            port: 443,
            https: true,
            xforward: true,
            changeOrigin: false,
            rewrite: {
                '/api/identity': '/v2.0/'
            }
        },
        {
            context: '/encore/feedback',
            host: 'staging.encore.rackspace.com',
            port: 443,
            https: true,
            protocol: 'https',
            changeOrigin: false,
        }
    ],
    dist: {
        options: {
            middleware: function (cnct) {
                return [
                    config.proxyRequest,
                    config.modRewrite([
                        'login.html /login.html [L]',
                        '^/login#* /login.html',
                        '^/index.html\/.* /index.html [L]',
                        '!\\.[0-9a-zA-Z_-]+$ /index.html [L]'
                    ]),
                    config.liveReloadPage,
                    config.mountFolder(cnct, '.tmp'),
                    config.mountFolder(cnct, config.docs)
                ];
            },
            livereload: 1337
        }
    },
    keepalive: {
        options: {
            keepalive: true,
            base: '<%= config.docs %>'
        }
    }
};
