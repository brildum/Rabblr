#!/usr/bin/env python

import cgi, json, random, re, urlparse
from tornado import web, ioloop
from sockjs import tornado as sockt

valid_user_re = re.compile(r'^[a-z0-9_]+$', re.IGNORECASE)

class InvalidUsername(Exception):
    pass

def validate_username(taken_usernames, conn, username):
    sid = conn.session.session_id
    if username in taken_usernames and taken_usernames[username] != sid:
        raise InvalidUsername("That username is already taken")
    if len(username) < 4 or len(username) > 20:
        raise InvalidUsername("Must be between 4 and 20 characters")
    if not valid_user_re.match(username):
        raise InvalidUsername("Only letters, numbers, and underscores allowed")

def random_username(taken_usernames):
    # returns a random valid username to be used for the user
    def generate_username():
        return "user" + str(random.randint(10000, 99999))
    username = generate_username()
    while username in taken_usernames:
        username = generate_username()
    return username

def create_event(event_type, room, data):
    return {'type': event_type, 'room': room, 'data': data}

def get_event_data(event, name):
    return event['data'].get(name, '').strip()

def is_valid_event(event):
    return (isinstance(event.get('type'), basestring) and
            isinstance(event.get('room'), basestring) and
            isinstance(event.get('data'), dict))

class ChatRoom(object):
    rooms = {}

    @classmethod
    def get_or_create_room(cls, name):
        netloc = urlparse.urlparse(name).netloc
        if netloc not in ChatRoom.rooms:
            ChatRoom.rooms[netloc] = ChatRoom(netloc)
        return ChatRoom.rooms[netloc]

    def __init__(self, name):
        self.name = name
        self.usernames = {}
        self.session_usernames = {}
        self.connections = {}
        self.user_count = 0

    def set_username(self, conn, username):
        sid = conn.session.session_id
        if sid in self.session_usernames:
            del self.usernames[self.session_usernames[sid]]
        self.session_usernames[sid] = username
        self.usernames[username] = sid

    def message(self, username, message):
        message_event = create_event('msg', self.name,
                {'username': username, 'message': message})
        for conn in self.connections.itervalues():
            conn.send(message_event)

    def add_connection(self, conn):
        sid = conn.session.session_id
        if sid not in self.connections:
            self.user_count += 1
            count_change_event = self._create_count_change_event()
            for c in self.connections.itervalues():
                c.send(count_change_event)
            # don't send the count to the new connection
            self.connections[sid] = conn

    def remove_connection(self, conn):
        sid = conn.session.session_id
        if sid in self.connections:
            del self.connections[sid]
            self.user_count -= 1
            if self.user_count == 0:
                del ChatRoom.rooms[self.name]
            else:
                count_change_event = self._create_count_change_event()
                for c in self.connections.itervalues():
                    c.send(count_change_event)
        if sid in self.session_usernames:
            del self.usernames[self.session_usernames[sid]]
            del self.session_usernames[sid]

    def _create_count_change_event(self):
        return create_event('roomCount', self.name, {'count': self.user_count})

class ChatConnection(sockt.SockJSConnection):

    def __init__(self, *args, **kwargs):
        sockt.SockJSConnection.__init__(self, *args, **kwargs)
        self.room = None
        self.username = None

    def on_message(self, data):
        event = json.loads(data)
        if is_valid_event(event):
            if event['type'] == 'msg':
                self._new_message(event)
            elif event['type'] == 'setUser':
                self._set_username(event)
            elif event['type'] == 'setRoom':
                self._set_room(event)
                if not self.username:
                    cookie = self.session.conn_info.get_cookie('puser')
                    username = cookie.value if cookie else ''
                    self._set_username(create_event('setUser', self.room.name,
                        {'username': username}))

    def on_open(self, info):
        pass

    def on_close(self):
        if self.room:
            self.room.remove_connection(self)

    def _new_message(self, event):
        message = get_event_data(event, 'message')
        if message and self.username and self.room:
            if len(message) > 200:
                message = message[:200]
            message = cgi.escape(message)
            self.room.message(self.username, message)

    def _set_username(self, event):
        username = get_event_data(event, 'username') or random_username(self.room.usernames)
        try:
            validate_username(self.room.usernames, self, username)
        except InvalidUsername as e:
            self.send(create_event('error', self.room.name, {'message': unicode(e)}))
        else:
            self.username = username
            self.room.set_username(self, username)
            self.send(create_event('usernameSet', self.room.name,
                {'username': self.username, 'count': self.room.user_count}))

    def _set_room(self, event):
        room = event.get('room', '')
        if len(room) > 200:
            room = room[:200]
        self.room = ChatRoom.get_or_create_room(room)
        self.room.add_connection(self)
        self.send(create_event('roomSet', self.room.name, {'count': self.room.user_count}))

class SetCookieHandler(web.RequestHandler):
    SUPPORTED_METHODS = ['POST']
    SUPPORTED_COOKIES = set(["puser"])

    def post(self, name, value):
        if name in self.SUPPORTED_COOKIES:
            self.add_header('Set-Cookie', "{0}={1};path=/;Max-Age=9999999;HttpOnly".format(name, value))
            origin = self.request.headers.get('Origin', '*')
            if origin == 'null':
                origin = '*'
            self.set_header('Access-Control-Allow-Origin', origin)
        self.finish()

if __name__ == "__main__":
    debug = False
    routes = [
        (r"/set/([a-zA-Z]+)/(.+)", SetCookieHandler),
    ]
    ChatRouter = sockt.SockJSRouter(ChatConnection, '/chat')
    routes.extend(ChatRouter.urls)
    if debug:
        import os.path
        static_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../client"))
        routes.extend([
            (r"/(.*)", web.StaticFileHandler, dict(path=static_path, default_filename='index.html')),
        ])
    app = web.Application(routes)
    app.listen(5000)
    ioloop.IOLoop.instance().start()
