var	winston = require('winston'),
	outLogger = winston.loggers.get('category1'),
	errLogger = winston.loggers.get('category2'),
	BluebirdPromise = require('bluebird'),
	request = BluebirdPromise.promisifyAll(require('request'));

var MessageBus = function(connection) {
		this.connection = connection;
		this.topicMap = new Map();
};

MessageBus.prototype = {
	constructor: MessageBus,
	getMessage: function(msg) {
		switch (msg.action) {
			case 'subscribe' :
				outLogger.info('SUBSCRIBE '+ msg.topic);
				var t = {};
				t.slot = msg.server_slot;
				t.compId = msg.component;
				t.type = msg.type;
				this.topicMap.set(msg.topic, t);
				break;
			case 'unsubscribe' :
				outLogger.info('UNSUBSCRIBE ' + msg.topic);
				this.topicMap.delete(msg.topic);
				break;
			case 'close' :
				outLogger.info('UNSUBSCRIBE ALL ' + msg.slot);
				if(msg.slot) {
					this.topicMap.forEach(function(topic, key) {
						if(topic.slot === msg.slot) {
							this.unsubscribeTopic(key, topic);
							this.topicMap.delete(key);
						}
					}, this);
				}
				break;
			default:
		}
	},
	getTopic: function(topic) {
		return this.topicMap.get(topic);
	},
	transmitRow: function(topic, jRow) {
		this.connection.emit(topic, jRow);
	},
	showTopics: function() {
		this.topicMap.forEach(function(element, key) {
			Object.getOwnPropertyNames(element).forEach(
				function (val, idx, array) {
					console.log(val + ' -> ' + element[val]);
			});
        });
	},
	topicMapSize: function() {
		return this.topicMap.size;
	},
	//-- SEND A MESSAGE TO A TOPIC
	publishTopic: function(data) {
		this.transmitRow('topic', data);
	},
	publishAdmin: function(data) {
		this.connection.emit('test', data);
	},
	publishAdminTopics: function() {
		return this.topicMap.entries();
	}
};

module.exports = MessageBus;