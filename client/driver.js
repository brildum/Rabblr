
jQuery.noConflict();

(function($) {
    $(document).ready(function() {
        var url = window.location.toString();
        mixpanel.rabblr.track('loaded', {url: url});
        var lastMessageTracked = null;
        var numMessagesSent = 0;
        var chat = new rabblr.Chat(url);
        var ui = new rabblr.UI($);
        var errorHandler = function(data) {
            mixpanel.rabblr.track('error', {message: data.message, url: url});
            ui.showError(data.message);
        };
        chat.addEventListener("error", errorHandler);
        ui.addEventListener("error", errorHandler);

        ui.addEventListener("setUsername", function(data) {
            mixpanel.rabblr.track('set_username', {username: data.username, url: url});
            chat.setUsername(data.username);
        });
        var setPuserCookie = function(username) {
            if (document.getElementById("rabblr_user_iframe")) {
                var form = document.createElement('form');
                form.method = "POST";
                form.action = rabblr.URI_BASE + "/set/puser/" + username;
                form.target = "rabblr_user_iframe";
                form.submit();
            }
        };
        chat.addEventListener("usernameSet", function(data) {
            ui.setUsername(data.username);
            ui.focusMessageInput();
            setPuserCookie(data.username);
        });
        chat.addEventListener("roomSet", function(data) {
            ui.setRoomCount(data.count);
        });
        chat.addEventListener("roomCount", function(data) {
            ui.setRoomCount(data.count);
        });

        ui.addEventListener("sendMessage", function(data) {
            numMessagesSent += 1;
            if (lastMessageTracked) {
                var currentTime = new Date();
                if (currentTime - lastMessageTracked > 30 * 1000) {
                    mixpanel.rabblr.track('message', {count: numMessagesSent, url: url});
                    lastMessageTracked = currentTime;
                }
            }
            else {
                mixpanel.rabblr.track('message', {count: numMessagesSent, url: url});
                lastMessageTracked = new Date();
            }
            chat.sendMessage(data.message);
        });
        chat.addEventListener("msg", function(data) {
            ui.showMessage(data.username, data.message);
        });
    });
})(jQuery);
