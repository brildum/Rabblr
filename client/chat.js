
rabblr.Chat = function(room) {
    var self = this;
    this.room = room;
    this.userIsSet = false;
    this.socket = new SockJS(rabblr.URI_BASE + rabblr.CHAT_PATH);
    this.socket.onopen = function() {
        self.onSocketOpen();
    };
    this.socket.onmessage = function(e) {
        self.onSocketMessage(e);
    };
    this.socket.onclose = function() {
        self.onSocketClose();
    };
    this.addEventListener("usernameSet", function(data) {
        self.userIsSet = true;
    });
};
rabblr.Chat.prototype = new rabblr.EventDispatcher();

rabblr.Chat.prototype.encodeEvent = function(evtName, data) {
    data = data || {};
    return JSON.stringify({type: evtName, room: this.room, data: data});
};

rabblr.Chat.prototype.sendMessage = function(message) {
    if (!this.userIsSet) {
        this.dispatchEvent("error", {message: "You must set a username before you can chat"});
    }
    else {
        this.socket.send(this.encodeEvent("msg", {message: message}));
    }
};

rabblr.Chat.prototype.setUsername = function(username) {
    this.socket.send(this.encodeEvent('setUser', {username: username}));
};

rabblr.Chat.prototype.onSocketMessage = function(e) {
    var event = e.data;
    this.dispatchEvent(event.type, event.data);
};

rabblr.Chat.prototype.onSocketOpen = function() {
    this.socket.send(this.encodeEvent("setRoom"));
};

rabblr.Chat.prototype.onSocketClose = function() {
};
