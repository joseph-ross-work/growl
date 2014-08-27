define([
    'stream-client',
    'auth',
    'base64'
], function (StreamClient, auth, base64) {
    'use strict';

    var stream = null;
    var streamId = null;
    var token = null;

    var getStreamId = function(token){
        var parts = token.split('.');
        var dataPart = parts[1];
        var data = JSON.parse(base64.atob(dataPart));
        var network = data.domain;
        var userId = data.user_id;

        return 'urn:livefyre:'+ network +':user='+ userId +':personalStream';
    };

    var PersonalizedStreamClient = function(opts) {
        var opts = opts || {};
        this.auth = opts.auth || auth;

        this.initialize(this.auth.get('livefyre'));
        this.attachListeners();
    };

    PersonalizedStreamClient.prototype.initialize = function(user){
        if(!stream){
            stream = new StreamClient({ environment: 'production' });
        }

        if (user && user.get) {
            token = user.get('token');
            streamId = getStreamId(token);
            stream.connect(token, streamId);
        } 
    };

    PersonalizedStreamClient.prototype.attachListeners = function(){
        var self = this;

        this.auth.on('login.livefyre', function(newUser) {
            self.initialize(newUser);
        });

        this.auth.on('logout', function() {
            streamId = null;
            token = null;
            try{
                stream.disconnect();
            } catch(e){

            }
        });

        stream.on('data', self.onStreamData.bind(self));
        //window.addEventListener('message', this.onPostMessage.bind(this), false);
    };

    //PersonalizedStreamClient.prototype.onPostMessage = function(event){
        /*var msg = typeof event.data === "string" ?
            JSON.parse(event.data) : event.data;*/

    //};

    PersonalizedStreamClient.prototype.onStreamData = function(data){
        console.log(data);
        if(typeof data === 'string'){
            data = JSON.parse(data);
        }

        //Broadcast all new post-type data
        if(data.published && data.verb === "create"){
            var msg = {
                channel: 'personalized-stream',
                topic: 'content',
                action: 'UPDATE',
                data: data
            };
            window.postMessage(JSON.stringify(msg), '*');
        }
    };

    PersonalizedStreamClient.prototype.destroy = function(){
        //window.removeEventListener('message', this.onPostMessage, false)
    };

    return PersonalizedStreamClient;
});
