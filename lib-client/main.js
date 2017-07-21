const canny = require('canny');
const GC = require('./GameController');



canny.ready(() => {

    const gc = new GC('/xxo-ws-connect');
    console.log('main:gc', gc.ready);

    // gc.initConnection({
    //     hallo : function (obj) {
    //         console.log('main:hallo', obj);
    //     }
    // });
});
