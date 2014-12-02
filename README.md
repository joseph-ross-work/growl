# Growl

A widget that hooks into Livefyre personalized stream content and provides growl notifications when new content is recieved. 

### Usage
```
Livefyre.require(['auth', 'growl#0'], function(auth, growl) {
    var user = auth.get('livefyre');
    if (user) {
        var growlView = new growl({
            el: document.getElementById('growlframe')
        });
    }
    else {
        console.log("No user");
    };
});
```

### Options

####```el```
The element you want Growl to render in. If not provided Growl will create its own unattached div to render into.

####```initializedPaused```
Default true. If false, Growl will immediate begin showing messages once stream data is avaliable.

####```inDelay```
Millisecond delay before animating in a growl message. Default is 500.

####```outDelay```
Millisecond delay before animating out a growl message. Default is 4000.

####```inAnimationClass```
You can provide the name of a class that will be used instead of 'growl-show' for the growl in animation.

####```outAnimationClass```
You can provide the name of a class that will be used instead of 'growl-hide' for the growl out animation.