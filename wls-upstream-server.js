var logger = require('./wls-logger.js')('wls-upstream'),
	config = require('./wls-config.js')('wls-upstream'),
	winston = require('winston'),
	outLogger = winston.loggers.get('category1'),
	errLogger = winston.loggers.get('category2'),
	MessageBus = require('./MessageBus.js'),
	upstream_channel_io = require('socket.io').listen(config.upstream_port),
	upstream_channel = new MessageBus(upstream_channel_io),
	delim_TCP = '|^*#|',
	delim_TOPIC = '#';

	//-- Connection to downstream server 
	outLogger.info('START UPSTREAM - listening on ' + config.upstream_port);
	upstream_channel_io.sockets.on('connection', function(socket) {
		outLogger.info('UPSTREAM - connection on '  + config.upstream_port);
		// respond to test message from downstream server
		socket.on('test', function(msg) {
			outLogger.info('UPSTREAM RECEIVES ' + msg);
			var downstreamMessage = {};
			downstreamMessage.topic = 'mock-topic';
			downstreamMessage.content = 'TEST TOPIC';
			upstream_channel.publishTopic(downstreamMessage);
		});
	});