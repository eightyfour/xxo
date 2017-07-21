const dnode = require('dnode'),
    shoe = require('shoe');

/**
 *
 */
module.exports = class GameController {

    constructor(mount) {

        const stream = shoe(mount),
            d = dnode();

        d.on('remote', (connection) => {
            this.server = connection;
            console.log('setup remote', connection);
            connection.initConnection({
                hallo : function (s) {
                    console.log('GameController:server says:', s);
                } 
            })

            // call ready queue - and clear
            // this.readyQueue.forEach((cb) => {
            //     cb(this.server);
            // });
            this.readyQueue = null;

        });

        d.pipe(stream).pipe(d);

    }

    ready (cb) {
        if (this.readyQueue !== null) {
            this.readyQueue.push(cb);
        } else {
            cb(this.server);
        }
    };

    /**
     * pass the client connection object which can be called from server
     *
     * @param clientConnection
     * @param cb
     */
    initConnection (clientConnection, cb) {
        this.server.init(clientConnection, cb);
    };

}