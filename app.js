#!/usr/bin/env node
/*
 *     Copyright (c) 2013-2017 CoNWeT Lab - Universidad Politécnica de Madrid
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

/**
 * Module dependencies.
 */

"use strict";

const compression = require('compression'),
    errorhandler = require('errorhandler'),
    express = require('express'),
    logic = require('./logic'),
    morgan = require('morgan');

const app = express();

// Configure Express
app.set('port', process.env.PORT || 3000);
if (process.env.TRUST_PROXY_HEADERS) {
    app.set('trust proxy', true);
}
app.enable('case sensitive routing');
app.use(morgan('combined'));
app.use(compression());

// Support development mode
const env = process.env.NODE_ENV || 'development';
if ('development' === env) {
    app.use(errorhandler());
}

app.get('/eventsources', logic.list_eventsources);
app.options('/eventsource', logic.options_eventsource);
app.post('/eventsource', logic.create_eventsource);
app.get('/eventsource/:id', logic.eventsource);
app.delete('/eventsource/:id', logic.delete_eventsource);
app.options('/eventsource/:id', logic.options_eventsource_entry);
app.options('/callbacks', logic.options_callbacks);
app.post('/callbacks', logic.create_callback);
app.post('/callbacks/:id', logic.process_callback);
app.options('/callbacks/:id', logic.options_callback_entry);
app.delete('/callbacks/:id', logic.delete_callback);

if (require.main === module) {
    let HEARTBEAT_INTERVAL = Number(process.env.HEARTBEAT_INTERVAL);

    if (Number.isNaN(HEARTBEAT_INTERVAL)) {
        // Defaults to 30s
        HEARTBEAT_INTERVAL = 30 * 1000;
    } else if (HEARTBEAT_INTERVAL <= 2000) {
        // Minimum interval is 2s
        HEARTBEAT_INTERVAL = 2000;
    }
    setInterval(logic.heartbeat, HEARTBEAT_INTERVAL);

    app.listen(app.get('port'), () => {
        console.log("ngsi-proxy server listening on port " + app.get('port'));
    });
} else {
    module.exports = app;
}
