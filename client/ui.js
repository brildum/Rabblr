
rabblr.UI = function(jQuery) {
    var self = this;
    this.$ = jQuery;
    this.username = "";
    this.showSetUserForm = true;

    this.$("#rabblr_container").html(
        '<div id="rabblr">' +
            '<div class="rabblr_padding">' +
                '<div id="rabblr_messages" class="rabblr"></div>' +
                '<div id="rabblr_input">' +
                    '<input type="text" class="rabblr_text" id="rabblr_chat_input" length="200"/>' +
                '</div>' +
                '<div id="rabblr_header"><div class="rabblr_padding">' +
                    '<div class="rabblr_right"><span class="rabblr_count">1</span> online</div>' +
                    'User: <a href="#change_user" class="rabblr_user" id="rabblr_change_user">[set username]</a>' +
                '</div></div>' +
                '<div id="rabblr_username" class="rabblr_clear"><div class="rabblr_padding">' +
                    '<input type="text" class="rabblr_text" id="rabblr_user_input" length="20"/>' +
                    '<input type="button" value="Set username" id="rabblr_user_submit"/>' +
                '</div></div>' +
            '</div>' +
        '</div>'
    );

    this.headerDiv = this.$("#rabblr_header");
    this.userSpans = this.$(".rabblr_user");
    this.countSpans = this.$(".rabblr_count");
    this.changeUsernameButton = this.$("#rabblr_change_user");
    this.usernameDiv = this.$("#rabblr_username");
    this.usernameInput = this.$("#rabblr_user_input");
    this.usernameSubmit = this.$("#rabblr_user_submit");
    this.userMessageInput = this.$("#rabblr_chat_input");
    this.messagesDiv = this.$("#rabblr_messages");

    this.changeUsernameButton.click(function() {
        self.changeUserButtonClicked();
        return false;
    });
    this.usernameSubmit.click(function() {
        self.usernameFormSubmitted();
        return false;
    });
    this.usernameInput.keyup(function(evt) {
        if (evt.which == 13) {
            self.usernameFormSubmitted();
            return false;
        }
    });
    this.userMessageInput.keyup(function(evt) {
        if (evt.which == 13) {
            self.userMessageFormSubmitted();
            return false;
        }
    });

    this.focusMessageInput();
};
rabblr.UI.prototype = new rabblr.EventDispatcher();

rabblr.UI.prototype.setUsername = function(username) {
    this.username = username;
    this.userSpans.html(username);
    this.showSetUserForm = false;
    this.usernameDiv.hide();
};

rabblr.UI.prototype.focusMessageInput = function() {
    this.userMessageInput.focus();
};

rabblr.UI.prototype.setRoomCount = function(count) {
    this.countSpans.html(count + "");
};

rabblr.UI.prototype.showError = function(errMsg) {
    this.messagesDiv.append('<div class="rabblr_error">Error: ' + errMsg + '</div>');
    this.messagesDiv.scrollTop(this.messagesDiv[0].scrollHeight);
};

rabblr.UI.prototype.showMessage = function(user, message) {
    this.messagesDiv.append('<div class="rabblr_message"><b>' + user + ':</b> ' + message + '</div>');
    this.messagesDiv.scrollTop(this.messagesDiv[0].scrollHeight);
};

rabblr.UI.prototype.userMessageFormSubmitted = function() {
    var message = this.$.trim(this.userMessageInput.val());
    if (message) {
        this.dispatchEvent("sendMessage", {message: message});
    }
    this.userMessageInput.val("");
};

rabblr.UI.prototype.usernameFormSubmitted = function() {
    var username = this.$.trim(this.usernameInput.val());
    this.usernameInput.val(username);
    try {
        rabblr.Validator.validateUsername(username);
        this.dispatchEvent("setUsername", {username: username});
    }
    catch (errmsg) {
        this.dispatchEvent("error", {message: errmsg});
    }
};

rabblr.UI.prototype.changeUserButtonClicked = function() {
    this.showSetUserForm = !this.showSetUserForm;
    if (this.showSetUserForm) {
        this.usernameDiv.show();
        this.usernameInput.focus();
    }
    else {
        this.usernameDiv.hide();
        this.focusMessageInput();
    }
};
