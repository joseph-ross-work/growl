define([
    'growl/package-attribute',
    'less!../src/css/styles'
], function (PackageAttribute) {
    'use strict';

    var MAIN_TEMPLATE = '<div class="growl-box lf">'+
        '<div class="growl-article-icon"></div><div class="growl-body">'+
        '<div class="growl-header"><span class="growl-header-text">NEW ARTICLE ADDED TO</span><ul class="growl-tags"></ul></div>'+
        '<div class="growl-message"></div></div>'+
        '<button type="button" class="growl-close"></button>'+
        '</div>';


    var growlButton, growlBox, growlMsg, growlTags;
    var inDelay, inInterval, outDelay, outInterval;
    var msgQueue = [];

    var GrowlView = function (opts) {
        opts = opts || {};
        this.el = opts.el;
        inDelay = opts.inDelay || 500;
        outDelay = opts.outDelay || 4000;

        PackageAttribute.decorate(this.el);
        this.el.innerHTML = MAIN_TEMPLATE;

        window.addEventListener('message', this.onPostMessage.bind(this), false);

        growlButton = this.el.getElementsByTagName('button')[0];
        growlBox = this.el.getElementsByClassName('growl-box')[0];
        growlTags = this.el.getElementsByClassName('growl-tags')[0];
        growlMsg = this.el.getElementsByClassName('growl-message')[0];

        growlButton.onclick = function(event) {
            if(inInterval) clearInterval(inInterval);
            if(outInterval) clearInterval(outInterval);
            inInterval = undefined;
            outInterval = undefined;

            growlBox.classList.remove('growl-show');
            growlBox.classList.add('growl-hide');
        };
    };

    GrowlView.prototype.onPostMessage = function(event){
        var msg = typeof event.data === "string" ?
            JSON.parse(event.data) : event.data;

        if(msg.channel === 'personalized-stream'){
            if(msg.topic === 'content'){
                msgQueue.push(msg.data)
                this.showMessage();
            }
        }
    };

    GrowlView.prototype.getTagsHtml = function(activity){
        if(!activity || !activity.object || !activity.object.tags) return;

        var tags = activity.object.tags;
        var tagsString = '';

        for(var i = 0; i < tags.length; i++){
            if(!tags[i].displayName) continue;
            tagsString += '<li class="growl-tag"><span class="growl-tag-text">' +
                tags[i].displayName + '</span></li>';
        }

        return tagsString;
    };

    GrowlView.prototype.showMessage = function(){
        var self = this;

        if(inInterval || outInterval) return;
        var activity = msgQueue.length > 0 ? msgQueue.shift() : null;
        if(!activity) return;

        var text = activity.object.title || ' ';
        growlMsg.innerHTML = text;
        growlTags.innerHTML = this.getTagsHtml(activity);

        var myInInterval;
        inInterval = setInterval(function(){
            if(outInterval) clearInterval(outInterval);
            clearInterval(myInInterval);
            inInterval = undefined;

            growlBox.classList.remove('growl-hide');
            growlBox.classList.add('growl-show');
            
            var myOutInterval;
            outInterval = setInterval(function(){
                clearInterval(myOutInterval);
                outInterval = undefined;
                growlBox.classList.add('growl-hide');
                growlBox.classList.remove('growl-show');
                self.showMessage();
            }, outDelay);
            myOutInterval = outInterval;
        }, inDelay);
        myInInterval = inInterval;
    };

    GrowlView.prototype.destroy = function(){
        growlButton.onclick = null;
        window.removeEventListener('message', this.onPostMessage, false)
    };

    return GrowlView;
});
