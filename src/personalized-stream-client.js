define([
    'stream-client',
    'auth',
    'base64'
], function (StreamClient, auth, base64) {
    'use strict';

    var stream = null;
    var subscription = null;
    var urn = null;
    var token = null;

    var getUrn = function(token){
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
        this.environment = opts.environment ? opts.environment : 'production';

        this.initialize(this.auth.get('livefyre'));
        this.attachListeners();
    };

    PersonalizedStreamClient.prototype.initialize = function(user){
        if(stream || subscription){
            return;
        } 

        stream = new StreamClient({ environment: this.environment });
        if (user && user.get) {
            token = user.get('token');
            stream.auth(token);
        } 

        urn = getUrn(token);
        subscription = stream.subscribe(urn);
        subscription.on('data', this.onStreamData.bind(this));
    };

    PersonalizedStreamClient.prototype.attachListeners = function(){
        var self = this;

        //This event seems to get fired multiple times
        this.auth.on('login.livefyre', function(newUser) {
            self.initialize(newUser);
        });

        this.auth.on('logout', function() {
            try{
                stream.disconnect();
            } catch(e){

            }

            stream = null;
            subscription.off('data');
            subscription = null;
            streamId = null;
            token = null;
        });
    };

    PersonalizedStreamClient.prototype.onStreamData = function(rawData){
        var data = rawData.event;
        //Broadcast all new post-type data
        if(data.published && data.verb === "create") {
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
        subscription.close();
        stream.disconnect();
    };

    return PersonalizedStreamClient;
});
