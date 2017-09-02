var logger = require('./wls-logger.js')('wls-admin'),
	config = require('./wls-config.js')('wls-admin'),
	winston = require('winston'),
	outLogger = winston.loggers.get('category1'),
	errLogger = winston.loggers.get('category2'),
    MessageBus = require('./MessageBus.js'),
    express = require('express'),
    app = express(),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    router = express.Router(),
    admin_channel_io = require('socket.io').listen(config.admin_socket_port),
	admin_channel = new MessageBus(admin_channel_io), 
	Rx = require('rx'),
	RxNode = require('rx-node'),
	adminConnect,
	adminSubscriber;

    app.use(cors());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    router.route('/admin')
    .get(function(req, res, next) {
        var entries = admin_channel.publishAdminTopics(),
            len = admin_channel.topicMapSize(),
            counter = 0,
            payload = [];

            if(len > 0) {
                while (counter < len) {
                    payload.push(entries.next().value);
                    counter++;
                }
            }
        res.json({ payload });
    })
    .post(function(req, res, next) {
        outLogger.info('topic: ' + req.body.topic);
        outLogger.info('time: ' + req.body.time);
        outLogger.info('delta ' + (Date.now() - req.body.time));
        outLogger.info('=========================>');
        res.json({});
    });

    //-- Connection to downstream server 
    outLogger.info('START ADMIN'); 
    outLogger.info('listening on socket ' + config.admin_socket_port);
    //admin_channel.publishAdmin('TEST FROM ADMIN'); 
    

	adminConnect = Rx.Observable.create(function(observer) {   
        admin_channel_io.sockets.on('connection', function(socket) {
            outLogger.info('ADMIN - connection on '  + config.admin_socket_port);
            // respond to test message from downstream server
            inner_socket_loop(socket, observer);
            admin_channel.publishAdmin('MESSAGE FROM ADMIN');
        });
    });
    
    adminSubscriber = adminConnect
	.subscribe(function(obj) {  
        outLogger.info('ADMIN RECEIVED TOPIC FROM DOWNSTREAM ', msg);
		admin_channel.getMessage(obj);
        //console.log('ADMIN SUBSCRIBER ' + obj.action + ' - ' + obj.topic);
	});

    function inner_socket_loop(socket, observer) {
        socket.on('test', function(msg) {
            try {
                outLogger.info('RECEIVED TEST MESSAGE FROM DOWNSTREAM ', msg);
                observer.onNext(msg);
            } catch(e) {
                errLogger.info('ERROR RECEIVING TEST MESSAGE');
            }
        });

        socket.on('admin_topic', function(msg) {
            try {
                observer.onNext(msg);
            } catch(e) {
                errLogger.info('ERROR RECEIVING ADMIN TOPIC');
            }
        });
    }

    app.use('/', router);
    app.listen(config.admin_http_port);
    outLogger.info('LISTENING FOR HTTP ENDPOINT REQUESTS ' + config.admin_http_port);
