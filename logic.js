/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
 *
 *     This file is part of ngsi-proxy.
 *
 *     Ngsi-proxy is free software: you can redistribute it and/or modify it
 *     under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     Ngsi-proxy is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsi-proxy. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

"use strict";

const uuid = require('uuid/v1');

let RECONNECTION_TIMEOUT = Number(process.env.RECONNECTION_TIMEOUT);
if (Number.isNaN(RECONNECTION_TIMEOUT)) {
    // Default value: 24h
    RECONNECTION_TIMEOUT = 24 * 60 * 1000;
} else if (RECONNECTION_TIMEOUT < 30000) {
    // Minimun value: 30s
    RECONNECTION_TIMEOUT = 30000;
}

const connections = {};
const callbacks = {};

const createConnection = function createConnection() {
    const id = uuid();
    const connection = {
        id: id,
        client_ip: null,
        close_timestamp: null,
        reconnection_count: 0,
        response: null,
        callbacks: {}
    };
    connections[id] = connection;

    console.log('Created connection with id: ' + connection.id);
    return connection;
};

const createCallback = function createCallback(connection) {
    const id = uuid();
    const callback_info = callbacks[id] = connection.callbacks[id] = {
        id: id,
        connection: connection,
        notification_counter: 0
    };

    console.log('Created callback with id: ' + id);
    return callback_info;
};

const removeCallback = function removeCallback(id) {
    const callback_info = callbacks[id];

    delete callback_info.connection.callbacks[id];
    delete callbacks[id];
    callback_info.connection = null;

    console.log('Deleted callback with id: ' + id);
};


const URL = require('url');
const build_absolute_url = function build_absolute_url(req, url) {
    const protocol = req.protocol;
    const domain = req.hostname;
    const path = req.url;
    const port = (process.env.TRUST_PROXY_HEADERS && req.get('X-Forwarded-Port')) || req.socket.localPort;

    if (protocol === "http" && port !== 80 || protocol === "https" && port !== 443) {
        return URL.resolve(protocol + "://" + domain + ':' + port + path, url);
    } else {
        return URL.resolve(protocol + "://" + domain + path, url);
    }
};

exports.options_eventsource = function options_eventsource(req, res) {
    const origin = req.header('Origin');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        res.header('Access-Control-Expose-Headers', 'Location');
    }
    res.header('Connection', 'keep-alive');
    res.header('Content-Length', '0');
    res.sendStatus(204);
};

exports.options_eventsource_entry = function options_eventsource_entry(req, res) {
    const origin = req.header('Origin');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    }
    res.header('Connection', 'keep-alive');
    res.header('Content-Length', '0');
    res.sendStatus(204);
};

exports.list_eventsources = function list_eventsources(req, res) {
    res.writeHead(200, {'Content-Type': 'application/xhtml+xml; charset=UTF-8'});
    let content = '<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>';
    content += '<h1>Current connections</h1>'
    if (Object.keys(connections).length > 0) {
        content += '<ul>';
        for (const connection_id in connections) {
            const connection = connections[connection_id];
            content += '<li><b>' + connection_id + '</b>. ';

            content += 'The client has started the connection ' + connection.reconnection_count + ' times and is currently '
            if (connection.response != null) {
                content += ' connected (' + connection.client_ip + '). ';
            } else {
                content += ' not connected. ';
            }

            const callback_count = Object.keys(connection.callbacks).length;

            if (callback_count > 0) {
                content += callback_count + ' callbacks:';

                content += '<ul>';
                for (const callback_id in connection.callbacks) {
                    content += '<li><b>' + callback_id + '</b> (' + connection.callbacks[callback_id].notification_counter + ' received notifications)</li>';
                }
                content += '</ul>';
            } else {
                content += "No callbacks";
            }

            content += '</li>';
        }
        content += '</ul>';
    } else {
        content += 'Currently there is not connection';
    }
    content += '</body></html>';
    res.write(content);
    res.end();
};

exports.create_eventsource = function create_eventsource(req, res) {

    const origin = req.header('Origin');
    const connection = createConnection(origin);

    const url = build_absolute_url(req, '/eventsource/' + connection.id);

    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        res.header('Access-Control-Expose-Headers', 'Location');
    }
    res.header('Content-Type', 'application/json');
    res.location(url);
    res.status(201).send(JSON.stringify({
        connection_id: connection.id,
        url: url
    }));
};

exports.eventsource = function eventsource(req, res) {
    const connection = connections[req.params.id];
    const origin = req.header('Origin');

    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    if (connection == null) {
        // https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events-intro
        return res.sendStatus(204);
    }

    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    // Forbid Nginx buffering
    res.header('X-Accel-Buffering', 'no');
    req.socket.setTimeout(0);

    if (connection.response != null) {
        console.log('A client is currently connected to this eventsource. Closing connection with the old client (' + connection.client_ip + ').');
        try {
            connection.response.removeListener('close', connection.close_listener);
        } catch (e) {}
        try {
            connection.response.end();
        } catch (e) {}
    }
    connection.response = res;
    connection.client_ip = req.connection.remoteAddress;
    connection.reconnection_count++;
    connection.close_listener = function close_listener() {
        console.log('Client closed connection with eventsource: ' + connection.id);
        connection.response = null;
        connection.client_ip = null;
        connection.close_timestamp = new Date();
    };

    res.header('Content-Type', 'text/event-stream');
    res.write('event: init\n');
    res.write('retry: 10\n');
    res.write('data: ' + JSON.stringify({
        id: connection.id,
        url: build_absolute_url(req, '/eventsource/' + connection.id)
    }).toString('utf8') + '\n\n');

    // Force sending init event
    res.flush();
    res.on('close', connection.close_listener);
};

exports.delete_eventsource = function delete_eventsource(req, res) {
    const connection = connections[req.params.id];
    const origin = req.header('Origin');

    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    }
    if (connection == null) {
        return res.sendStatus(404);
    }

    console.log('Deleting subscription ' + req.params.id);
    delete connections[req.params.id];

    if (connection.response != null) {
        console.log('A client is currently connected to this eventsource. Closing connection with (' + connection.client_ip + ').');
        try {
            connection.response.removeListener('close', connection.close_listener);
        } catch (e) {}
        try {
            connection.response.end();
        } catch (e) {}
    }

    for (const callback_id in connection.callbacks) {
        console.log('Deleting callback ' + callback_id);
        delete callbacks[callback_id];
    }

    res.header('Content-Length', '0');
    res.sendStatus(204);
};

exports.options_callbacks = function options_callbacks(req, res) {
    const origin = req.header('Origin');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'OPTIONS, POST');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
        res.header('Access-Control-Expose-Headers', 'Location');
    }
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Content-Length', '0');
    res.sendStatus(204);
};

exports.create_callback = function create_callback(req, res) {
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Content-Length', '0');

    const origin = req.header('Origin');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
        res.header('Access-Control-Expose-Headers', 'Location');
    }

    let buf = '';
    req.setEncoding('utf8');
    req.on('data', function (chunck) { buf += chunck; });
    req.on('end', function () {
        buf = buf.trim();

        if (buf.length === 0) {
            res.status(400).send('invalid json: empty request body');
            return;
        }

        let data;
        try {
            data = JSON.parse(buf);
        } catch (e) {
            res.status(400).send('invalid json: ' + e);
            return;
        }

        const connection = connections[data.connection_id];

        if (connection == null) {
            res.sendStatus(404);
            return;
        }
        const callback_info = createCallback(connection);
        const url = build_absolute_url(req, '/callbacks/' + callback_info.id);
        res.header('Content-Type', 'application/json');
        res.location(url);
        res.status(201).send(JSON.stringify({
            callback_id: callback_info.id,
            url: url
        }));
    });
};

exports.process_callback = function process_callback(req, res) {

    if (!(req.params.id in callbacks)) {
        res.sendStatus(404);
        return;
    }

    console.log('Processing callback ' + req.params.id);
    const connection = callbacks[req.params.id].connection;

    let buf = '';
    req.on('data', function (chunck) { buf += chunck; });
    req.on('end', function () {
        const eventsource = connection.response;

        if (eventsource != null) {
            const data = JSON.stringify({
                callback_id: req.params.id,
                payload: buf,
                headers: req.headers
            }).toString('utf8');
            eventsource.write('event: notification\n');
            eventsource.write('data: ' + data + '\n\n');
            // Send this event
            eventsource.flush();
        } else {
            console.log('Ignoring notification as the client is not connected');
        }

        res.header('Content-Length', '0');
        res.sendStatus(204);
        callbacks[req.params.id].notification_counter++;
    });
};

exports.options_callback_entry = function options_callback_entry(req, res) {
    const origin = req.header('Origin');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS, POST');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    }
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Content-Length', '0');
    res.sendStatus(204);
};

exports.delete_callback = function delete_callback(req, res) {
    console.log('Deleting callback ' + req.params.id);

    const origin = req.header('Origin');
    if (origin != null) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    }

    if (!(req.params.id in callbacks)) {
        res.sendStatus(404);
        return;
    }

    removeCallback(req.params.id);
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Content-Length', '0');
    res.sendStatus(204);
};

exports.heartbeat = function heartbeat() {
    const now = new Date();

    console.log("Checking current connections:");
    Object.values(connections).forEach((connection) => {
        const eventsource = connection.response;

        if (eventsource != null) {
            console.log(`  - Sending heartbeat message to eventsource ${connection.id}`);
            // Send a heartbeat message
            eventsource.write('; heartbeat\n');
            eventsource.flush();
        } else if ((now - connection.close_timestamp) > RECONNECTION_TIMEOUT) {
            console.log(`  - Closing dead connection ${connection.id}`);
            delete connections[connection.id];
            for (const callback_id in connection.callbacks) {
                delete callbacks[callback_id];
            }
        }
    });
};

exports.createConnection = createConnection;
