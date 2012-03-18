
rabblr.EventDispatcher = function() {
    this.listeners = {};
};

rabblr.EventDispatcher.prototype.addEventListener = function(evt, callback) {
    if (!this.listeners[evt]) {
        this.listeners[evt] = [];
    }
    this.listeners[evt].push(callback)
};

rabblr.EventDispatcher.prototype.removeEventListener = function(evt, callback) {
    var callbacks = this.listeners[evt];
    if (callbacks) {
        var found = -1;
        for (var i in callbacks) {
            var existing_callback = callbacks[i];
            if (existing_callback === callback) {
                found = i;
                break;
            }
        }
        if (found >= 0) {
            callbacks.splice(i, 1);
        }
    }
};

rabblr.EventDispatcher.prototype.dispatchEvent = function(evt) {
    var callbacks = this.listeners[evt];
    if (callbacks && callbacks.length > 0) {
        // submit all args to callbacks except for the name of the event
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i in callbacks) {
            var callback = callbacks[i];
            callback.apply(null, args);
        }
    }
};

rabblr.Validator = {

    validateUsername: function(username) {
        var errmsgPrefix = "Invalid username: ";
        if (username.length <= 3 || username.length >= 20) {
            throw errmsgPrefix + "Must be between 4 and 20 characters.";
        }
        if (!username.match(/^[a-zA-Z0-9_]+$/)) {
            throw errmsgPrefix + "Can only contain letters, numbers, and underscores.";
        }
    }

};
