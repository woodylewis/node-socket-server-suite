//-- Check for a jwt parameter on the cli, quit if none found --
if(process.argv.length <= 2) {
	console.log('cli parameter required');
	process.exit(-1);
}
var logger = require('./wls-logger.js')('wls-downstream'),
	config = require('./wls-config.js')('wls-downstream'),
	winston = require('winston'),
	outLogger = winston.loggers.get('category1'),
	errLogger = winston.loggers.get('category2'),
	MessageBus = require('./MessageBus.js'),
	app = require('express')(),
	http = require('http').Server(app),
	upstream_channel_io = require('socket.io-client')(config.upstream_server, {
		forceNew: true
	}),
	admin_channel_io = require('socket.io-client')(config.upstream_server, {
		forceNew: true
	}),
	downstream_channel_io = require('socket.io')(http).listen(config.downstream_port),
	downstream_channel = new MessageBus(downstream_channel_io),
	endpoint = {},
	s = 0,
	label = 'wls',
	socketioJwt = require('socketio-jwt'), 
	Rx = require('rx'),
	RxNode = require('rx-node'),
	upstreamConnect,
	upstreamSubscriber,
	downstreamConnect,
	downtreamSubscriber;

	//-- Listening to UI -- 
	outLogger.info('START DOWNSTREAM - listening on ' + config.downstream_port);
    outLogger.info('ENVIRONMENT = ' + process.env.ENV);
	outLogger.info('DOWNSTREAM CLI PARAMETER ' + process.argv[2]);
	//errLogger.error('TEST ERROR FROM DOWNSTREAM ');
	
// uncomment to send test message to upstream server
outLogger.info('DOWNSTREAM SENDS <TEST FROM DOWNSTREAM>');
upstream_channel_io.emit('test','<TEST FROM DOWNSTREAM>');


//-- The main loops for auth or no_auth --
if(process.argv[2] === 'jwt') {
	auth_loop();
} else {
	no_auth_loop();
}

//-- Upstream
upstreamConnect = Rx.Observable.create(function(observer) {   
	upstream_channel_io.on('topic', function(msg) {
		observer.onNext(msg);
	});	 
});

upstreamSubscriber = upstreamConnect
.subscribe(function(msg) {
	if(downstream_channel.getTopic(msg.topic)) {
		outLogger.info('SENT '+ downstream_channel.getTopic(msg.topic).slot + ' ' + msg.topic);
		downstream_channel_io.to(downstream_channel.getTopic(msg.topic).slot).emit(msg.topic, msg.content);
	} else {
		outLogger.warn('TOPIC NOT ON LIST ' + msg.topic);
	}
});

//-- Downstream
admin_channel_io.on('test', function(msg) {
	console.log('RECEIVED FROM ADMIN ', msg);
	admin_channel_io.emit('test', 'MESSAGE FROM DOWNSTREAM');
});

//-- Listening to UI -- 
console.log('START DOWNSTREAM - listening on ' + config.downstream_port);

function initEndpoint(socket) {
	var slot = label + s;
	socket.join(slot);
	s++;
	//-- SEND THE SOCKET ROOM IDENTIFIER DOWN TO THE ENDPOINT --
	downstream_channel_io.to(slot).emit('wls_client', slot);
	outLogger.info('open ' +  slot);
}

function manageMessageBus() {
	downtreamSubscriber = downstreamConnect
	.subscribe(function(obj) {
		// Pass endpoint object to message bus  
		downstream_channel.getMessage(obj);
		admin_channel_io.emit('admin_topic', obj);
	});
}

function auth_loop() {
	downstreamConnect = Rx.Observable.create(function(observer) {   
		downstream_channel_io.sockets
		.on('connection', socketioJwt.authorize({
			secret:config.jwt_secret,
			timeout: 15000
		})).on('authenticated', function(socket) {
			outLogger.info('DECODED TOKEN ====>');
			Object.getOwnPropertyNames(socket.decoded_token).forEach(
				function (val, idx, array) {
					outLogger.info(val + ' -> ' + socket.decoded_token[val]);
				}
			);
			initEndpoint(socket);
			inner_socket_loop(socket, observer); 
		});
	});
	manageMessageBus();
}

function no_auth_loop() {
	downstreamConnect = Rx.Observable.create(function(observer) {   
		downstream_channel_io.sockets
		.on('connection', function(socket) {
			initEndpoint(socket);
			inner_socket_loop(socket, observer); 
		});
	});
	manageMessageBus();
}

// The inner functionality in either loop  
function inner_socket_loop(socket, observer) {
	socket.on('subscribe', function(msg){
			try {
				endpoint = JSON.parse(msg);
				endpoint.action = 'subscribe';
				observer.onNext(endpoint);
			} catch (e) {
				errLogger.info('SUBSCRIBE ERROR', e);
			}
	});

	socket.on('unsubscribe', function(msg){
		try {
			endpoint = JSON.parse(msg);
			endpoint.action = 'unsubscribe';
			observer.onNext(endpoint);
		} catch(e) {
			errLogger.info('UNSUBSCRIBE ERROR', e);
		}
	});

	socket.on('close_socket', function(msg){
		endpoint = {};
		endpoint.slot = msg;
		endpoint.action = 'close';
		observer.onNext(endpoint);
	});
}