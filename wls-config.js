//-- specify the config file and location for the 'config' module --
process.env.NODE_ENV = "wls-node-config";
process.env.NODE_CONFIG_DIR = __dirname + '/wls_node_config/';
//-- following line avoids strict mode error - https://github.com/lorenwest/node-config/wiki/Strict-Mode
process.env.NODE_APP_INSTANCE = 'wls-node-config';

var config = require('config'),
    winston = require('winston'),
	outLogger = winston.loggers.get('category1'),
    configObj = {};

module.exports = function(processName) {
    if(!process.env.ENV) {
        Object.assign(configObj, config.dev);
    } else {
        switch (process.env.ENV) {
            case 'DEV' :
                Object.assign(configObj, config.dit);
                break;
            case 'STAGE' :
                Object.assign(configObj, config.sit);
                break;
            case 'PROD' :
                Object.assign(configObj, config.uat);
                break;
            default :
        }
    }

    outLogger.info(processName + ' using config: ' + configObj.name);

    return {
        name : configObj.name,
        jwt_secret : configObj.jwt_secret, 
        upstream_host : configObj.upstream_host,
        upstream_port : configObj.upstream_port,
        downstream_port : configObj.downstream_port,
        upstream_server : configObj.upstream_server,
        admin_server : configObj.admin_server,
        admin_socket_port : configObj.admin_socket_port,
        admin_http_port : configObj.admin_http_port
    };
};