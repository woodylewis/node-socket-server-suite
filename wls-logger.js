var winston = require('winston');

module.exports = function(processName) {
    var colors = {
        error: 'red',
        warn: 'blue',
        info: 'white'
    };

    winston.addColors(colors);

    winston.loggers.add('category1', {
        console: {
            level: 'info',
            colorize: true,
            label: 'outLogger'
        },
        file: {
            level: 'info',
            filename: process.env.PWD + '/' + processName + '-out.log'
        }
    });

    winston.loggers.add('category2', {
        console: {
            level: 'error',
            colorize: true,
            label: 'errLogger'
        },
        file: {
            level: 'info',
            filename: process.env.PWD + '/' + processName + '-error.log'
        }
    });
};