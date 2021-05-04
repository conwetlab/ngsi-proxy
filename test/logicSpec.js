/*
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

const logic = require('../logic');

describe('ngsi-proxy server', () => {

    it("should send heartbeat messages to connected clients", () => {
        const connection = logic.createConnection();
        connection.response = {
            write: jasmine.createSpy("write"),
            flush: jasmine.createSpy("flush")
        };

        logic.heartbeat();

        expect(connection.response.write).toHaveBeenCalledWith("; heartbeat\n");
        expect(connection.response.flush).toHaveBeenCalledWith();
    });

    it("should ignore connections without client and not expired", () => {
        const connection = logic.createConnection();
        connection.close_timestamp = new Date();

        logic.heartbeat();
    });

    it("should close expired connections", () => {
        const connection = logic.createConnection();
        connection.close_timestamp = 0;
        connection.callbacks = [];

        logic.heartbeat();
    });

});
