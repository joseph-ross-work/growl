define([
    'growl/package-attribute',
    './personalized-stream-client',
    'less!../src/css/styles'
], function (PackageAttribute, PersonalizedStreamClient) {
    'use strict';

    var MAIN_TEMPLATE = '<div class="growl-box lf">'+
        '<div class="growl-article-icon"></div><div class="growl-body">'+
        '<div class="growl-header"><span class="growl-header-text">NEW ARTICLE ADDED TO</span><ul class="growl-tags"></ul></div>'+
        '<div class="growl-message"></div></div>'+
        '<button type="button" class="growl-close"></button>'+
        '</div>';


    var growlButton, growlBox, growlMsg, growlTags, growlLocation;
    var inDelay, inInterval, inAnimationClass, outDelay, outInterval, outAnimationClass;
    var msgQueue = [];

    var GrowlView = function (opts) {
        opts = opts || {};
        this.el = opts.el;
        this._psc = opts.personalizedStreamClient !== undefined ? opts.personalizedStreamClient : new PersonalizedStreamClient(opts);
        this._showMessages = opts.initializePaused !== undefined ? !opts.initializePaused : true;
        
        inDelay = opts.inDelay || 500;
        outDelay = opts.outDelay || 4000;
        inAnimationClass = opts.inAnimationClass || 'growl-show';
        outAnimationClass = opts.outAnimationClass || 'growl-hide';

        PackageAttribute.decorate(this.el);
        this.el.innerHTML = MAIN_TEMPLATE;

        window.addEventListener('message', this.onPostMessage.bind(this), false);

        growlButton = this.el.getElementsByTagName('button')[0];
        growlBox = this.el.getElementsByClassName('growl-box')[0];
        growlTags = this.el.getElementsByClassName('growl-tags')[0];
        growlMsg = this.el.getElementsByClassName('growl-message')[0];

        growlButton.onclick = function(event) {
            event.stopPropagation();
            if (inInterval) { 
                clearInterval(inInterval);
            }
            if (outInterval) {
                clearInterval(outInterval);
            }
            inInterval = undefined;
            outInterval = undefined;

            growlBox.classList.remove(inAnimationClass);
            growlBox.classList.add(outAnimationClass);
        };

        growlBox.onclick = function(event) {
            event.stopPropagation();
            if (growlLocation) {
                window.location.href = growlLocation;
            }
        };
    };

    GrowlView.prototype.pause = function() {
        this._showMessages = false;
    }

    GrowlView.prototype.play = function() {
        this._showMessages = true;
    }

    GrowlView.prototype.onPostMessage = function(event) {
        var msg = null; 
        if (typeof event.data === 'object') {
            msg = event.data;
        }
        else {
            try{ 
                msg = JSON.parse(event.data);
            } catch(e){ 
                return; 
            }       
        }

        if (msg.channel === 'personalized-stream' && this._showMessages) {
            if(msg.topic === 'content'){
                msgQueue.push(msg.data)
                this.showMessage();
            }
        }
    };

    GrowlView.prototype.getTagsHtml = function(activity) {
        if (!activity || !activity.object || !activity.object.tags) { 
            return;
        }

        var tags = activity.object.tags;
        var tagsString = '';

        for(var i = 0; i < tags.length; i++) {
            if(!tags[i].displayName) 
                continue;
            tagsString += '<li class="growl-tag"><span class="growl-tag-text">' +
                tags[i].displayName + '</span></li>';
        }

        return tagsString;
    };

    GrowlView.prototype.showMessage = function() {
        var self = this;

        if (inInterval || outInterval) {
            return;
        }

        var activity = msgQueue.length > 0 ? msgQueue.shift() : null;
        
        if (!activity) {
            return;
        }

        var text = activity.object.title || ' ';
        growlLocation = activity.target ? activity.target.url : null;
        growlMsg.innerHTML = text;
        growlTags.innerHTML = this.getTagsHtml(activity);

        var myInInterval;
        inInterval = setInterval(function() {
            if(outInterval) clearInterval(outInterval);
            clearInterval(myInInterval);
            inInterval = undefined;

            growlBox.classList.remove(outAnimationClass);
            growlBox.classList.add(inAnimationClass);
            
            var myOutInterval;
            outInterval = setInterval(function() {
                clearInterval(myOutInterval);
                outInterval = undefined;
                growlBox.classList.add(outAnimationClass);
                growlBox.classList.remove(inAnimationClass);
                self.showMessage();
            }, outDelay);
            myOutInterval = outInterval;
        }, inDelay);
        myInInterval = inInterval;
    };

    GrowlView.prototype.destroy = function() {
        growlButton.onclick = null;
        growlBox.onclick = null;
        this._psc.destroy();
        this._psc = null;
        window.removeEventListener('message', this.onPostMessage, false)
    };

    return GrowlView;
});
