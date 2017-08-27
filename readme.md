# Node Server Suite

###Summary

* wls-upstream-server 
* wls-downstream-server

The codebase for these two services consists of three source files:

* wls-upstream.js
* wls-downstream.js
* MessageBus.js


### Upstream Server 

* Uses *socket.io* module to open connection to downstream server.   


### Downstream Server

* Uses *socket.io-client* module to listen for messages from upstream server
* Uses *socket.io* module to open connections to browser endpoints
* Each socket connection to browser is named *wls* + incremented value *(e.g. - wls0, wls1 etc)*.


* When browser navigates to a streaming UI component, downstream server receives a *subscribe* message.
* Downstream server adds topic/socket name (key value pair) to its *topic list*.


* When browser navigates away from a streaming UI component, downstream server receives an *unsubscribe* message.
* Downstream server removes topic/socket name from to its *topic list*.

### Message Bus

* Used by both wls-upstream.js and wls-downstream.js.
* Includes functions to put a topic in topic list, remove it from topic list, and remove all topics associated with a given socket name.