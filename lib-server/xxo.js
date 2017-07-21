// const now = require('now');
// const fileServer = require('fileServer');
const GameEnums = require('../lib/GameEnums');

const dnode = require('dnode');
const shoe = require('shoe');

/** +++++++++++++++++++++++++++++ Constants +++++++++++++++++++++++++++++ **/

const SIGN = GameEnums.SIGN;
const GAMESTATE = GameEnums.GAMESTATE;

/** ----------------------------- Constants ----------------------------- **/
/** +++++++++++++++++++++++++++++ Object Definitions +++++++++++++++++++++++++++++ **/

function User(name, now){
    this.name = name;  // unique
    this.now = now;
    this.sign;
    this.boardId;
    this.points = 0;
    this.userState = GAMESTATE.boardNotready;
}
function Field(idx, sign){
    this.index = idx;
    this.sign = sign;
}

const boards = [];

function Board(id,user){
    this.id=id;
    this.user1 = user;
    this.user2;
    this.fields;
    this.board = [
        new Field(0,SIGN.noSign),
        new Field(1,SIGN.noSign),
        new Field(2,SIGN.noSign),
        new Field(3,SIGN.noSign),
        new Field(4,SIGN.noSign),
        new Field(5,SIGN.noSign),
        new Field(6,SIGN.noSign),
        new Field(7,SIGN.noSign),
        new Field(8,SIGN.noSign)
    ];
}

/** ----------------------------- Object Definitions ----------------------------- **/

const chatStart = function(socketServer){

    const sock = shoe(function (stream) {
        const d = dnode({
            initConnection : function (s) {
                console.log('xxo:initConnection', s);
                s.hallo('Hello client')
            }
        });
        d.pipe(stream).pipe(d);
    });
    sock.install(socketServer, '/xxo-ws-connect');

    return ;

    var userList = [];
//    var

    /** +++++++++++++++++++++++++++++ Gamelogic +++++++++++++++++++++++++++++ **/

    var TEST_STATES = {
        notComplete : 100,
        complete : 200
    };
    function RowCheck(idx1,idx2,idx3){
        this.idx1 = idx1;
        this.idx2 = idx2;
        this.idx3 = idx3;
        this.test = function(board,_sign){
            if(board[idx1].sign == SIGN.noSign || board[idx2].sign == SIGN.noSign || board[idx3].sign == SIGN.noSign ){
                return TEST_STATES.notComplete;
            }
            if(board[idx1].sign == board[idx2].sign &&
                board[idx1].sign == board[idx3].sign &&
                board[idx2].sign == board[idx3].sign){
                console.log(idx1+" : "+idx2+" : "+idx3);
                console.log(board);
                return board[idx1].sign;
            }
            return TEST_STATES.complete;
        }
    }
    var ROW_STATES = [
        new RowCheck(0,1,2),
        new RowCheck(3,4,5),
        new RowCheck(6,7,8),
        new RowCheck(0,4,8),
        new RowCheck(2,4,6),
        new RowCheck(0,3,6),
        new RowCheck(1,4,7),
        new RowCheck(2,5,8)
    ];
    /**
     * Returns the current state of the board.
     *
     * @param _board (the current board with a [Field] )
     * @param _sign
     * @return {GAMESTATE}
     */
    function handleGameLogic(_board,_sign){
        var board = _board;
        var sign = _sign;
        var isDraw = true;
        for (var i = 0; i < ROW_STATES.length; i++) {
            var testState = ROW_STATES[i].test(board);
            if(testState == TEST_STATES.notComplete){
                // cant be a draw
                isDraw = false;
            } else if(testState == TEST_STATES.complete){
                // all fields in this test are set but no winner
            } else {
                isDraw = false;
                // looks like we have a winner
                return testState == _sign ? GAMESTATE.won : GAMESTATE.lost;
            }
        }
        return isDraw ? GAMESTATE.draw : GAMESTATE.play;
    }
    function handleWonState(_board,_user){
        var user = _user;
        getOpponent(user,function(user){
            user.userState = GAMESTATE.lost;
            RESPONSE.setState(user.now,GAMESTATE.lost);
        });
        getUser(user,function(user){
            user.userState = GAMESTATE.won;
            user.points++;
            RESPONSE.setState(user.now,GAMESTATE.won);
        });
    }
    function handleLostState(_board,_user){
        var user = _user;
        getOpponent(user,function(user){
            user.userState = GAMESTATE.won;
            user.points++;
            RESPONSE.setState(user.now,GAMESTATE.won);
        });
        getUser(user,function(user){
            user.userState = GAMESTATE.lost;
            RESPONSE.setState(user.now,GAMESTATE.lost);
        });
    }
    function handleDrawState(_board,_user){
        var user = _user;
        getOpponent(user,function(user){
            user.userState = GAMESTATE.draw;
            user.points++;
            RESPONSE.setState(user.now,GAMESTATE.draw);
        });
        getUser(user,function(user){
            user.userState = GAMESTATE.draw;
            user.points++;
            RESPONSE.setState(user.now,GAMESTATE.draw);
        });
    }
    /** ----------------------------- Gamelogic ----------------------------- **/

    function getUserFromUserList(user){
        for (var i = 0; i < userList.length; i++) {
            if(userList[i].name == user.name){
                return userList[i];
            }
        }
        console.log('Cant found user '+user.name+' in userList!');
        return -1;
    }
    function getOpponent(user,fc){
        boards.forEach(function(board,i){
            if(board.user1.name == user.name){fc(board.user2);}
            if(board.user2 != undefined && board.user2.name == user.name){fc(board.user1);}
        });
    }
    function getUser(user,fc){
        boards.forEach(function(board,i){
            if(board.user1.name == user.name){fc(board.user1);}
            if(board.user2 != undefined && board.user2.name == user.name){fc(board.user2);}
        });
    }
    function getOpponentFromBoard(board,user){
        if(board.user1 == user.name){
            return board.user2;
        }else{
            return board.user1;
        }
    }
    function getUserFromBoard(board,user){
        if(board.user1 == user.name){
            return board.user1;
        }else{
            return board.user2;
        }
    }
    function getBoard(user,fc){
        boards.forEach(function(board,i){
            if(board.user1.name == user.name ||
                board.user2 != undefined && board.user2.name == user.name){
                fc(boards[i]);
            }
        });
    }
    function getBoardById(id){
        for (var i = 0; i < boards.length; i++) {
            var board = boards[i];
            if(board.id == id){
                return board
            }
        }
        console.log('No board find');
        return -1;
    }
    function removeBoard(user){
        boards.forEach(function(board,i){
            if(board.user1.name == user.name ||
                board.user2 != undefined && board.user2.name == user.name){
                boards.splice(i,1);
                RESPONSE.updateTableView(everyone.now);
            }
        });
    }
    function restartGame(_board){
        var board = _board;

    }

    var RESPONSE = {
        notification : function(call,message){
            call.notification(message);
        },
        notificateBoard : function(board,message){
            board.user1.now.notification(message);
            board.user2.now.notification(message);
        },
        startNewGame : function(board){
            board.user1.now.startNewGame(board.user1.userState);
            board.user2.now.startNewGame(board.user2.userState);
        },
        updateLobby : function(call,userList){
            call.newUserInLobby(userList);
        },
        updateTableView : function(call){
            call.updateTableView(boards);
        },
        drawSign : function(call,index,sign,gameState){
            console.log("Arguments:"+arguments);
            if(arguments.length == 3){
                call.drawSign(index,sign);
            }else{
                call.drawSign(index,sign,gameState);
            }
        },
        setState : function(call,state){
            call.setState(state);
        }
    };

    /**
     * Handle socket disconnect
     *  -remove user
     *  -delete the board where the user played (if exists)
     */
    now.on('disconnect', function(){
        console.log("DISCONNECT XXO USER");

        var user = this.now.user;

        if(user == undefined){return;}
        var userFromList = getUserFromUserList(user);
        if(userFromList == -1){
            console.log('Cant find user: '+user.name+'. Stop remove user');
            return;
        }
        var idx = userList.indexOf(userFromList);
        if(idx!=-1){userList.splice(idx, 1);}
        RESPONSE.updateLobby(everyone.now,userList);

        removeBoard(user);
    });

    /**
     * A new User comes in the lobby
     * @param name
     */
    everyone.now.addUser = function(name){
        var user = new User(name,this.now);
        userList.push(user);
        this.now.user = user;
        // update user pool for all
        RESPONSE.updateLobby(everyone.now,userList);
        // send current user the actual tables
        RESPONSE.updateTableView(this.now);
        RESPONSE.notification(everyone.now,'New user: '+user.name+" in lobby");
    };

    /**
     * User will draw a sign
     * Handle logic for:
     *  -is allowed to make a sign on this position
     *  -gamelogic
     * @param index
     */
    everyone.now.sendSign = function(index){
        var sign = this.now.user.sign;
        if(this.now.user.userState == GAMESTATE.play){
            var currentNow = this.now;
            getBoard(this.now.user,function(board){
                if( board.board[index].sign == SIGN.noSign ){
                    board.board[index].sign = sign;

                    RESPONSE.notificateBoard(board,"Sign on index:"+index);

                    var userGameState = handleGameLogic(board.board,sign);
                    var opponentGameState = userGameState == GAMESTATE.won ? GAMESTATE.lost : userGameState;

                    switch(userGameState){
                        case GAMESTATE.won:
                            RESPONSE.notificateBoard(board,currentNow.user.name+" has won this game");
                            handleWonState(board,currentNow.user);
                            break;
                        case GAMESTATE.lost:
                            RESPONSE.notificateBoard(board,currentNow.user.name+" has lost this game");
                            handleLostState(board,currentNow.user);
                            break;
                        case GAMESTATE.draw:
                            RESPONSE.notificateBoard(board,"Game Over... it's a draw!");
                            handleDrawState(board,currentNow.user);
                            break;
                    }
                    getOpponent(currentNow.user,function(user){
                        user.userState = GAMESTATE.play;
                        RESPONSE.drawSign(user.now,index,sign,user.userState);
//                        RESPONSE.drawSign(user.now,index,sign,opponentGameState);
                    });
                    getUser(currentNow.user,function(user){
                        user.userState = GAMESTATE.waitForOpponent;
                        RESPONSE.drawSign(user.now,index,sign,user.userState);
//                        RESPONSE.drawSign(user.now,index,sign,userGameState);
                    });
                }else{
                    RESPONSE.notification(currentNow,"Error: This Field is already signed!");
                }
            });
        }else {
            RESPONSE.notification(this.now,"The game is already Finished - start a new one.");
        }
    };

    everyone.now.createNewBoard = function(name){
        removeBoard(this.now.user);
        this.now.user.sign = SIGN.circle;
        var newBoard = new Board(name,this.now.user);
        boards.push(newBoard);
        RESPONSE.updateTableView(everyone.now);
        RESPONSE.notification(everyone.now,this.now.user.name +" Creates a new Board named "+name);
    };

    everyone.now.joinBoard = function(name){
        var board = getBoardById(name);

        if(board != -1 && board.user2 == undefined){
            if(board.user1.name != this.now.user.name){
                this.now.user.sign = (board.user1.sign == SIGN.circle?SIGN.cross:SIGN.circle);
                board.user2 = this.now.user;
                RESPONSE.notification(board.user1.now,"User "+this.now.user.name+" joined your board.");
                board.user1.userState = GAMESTATE.play;
                board.user2.userState = GAMESTATE.waitForOpponent;
                RESPONSE.startNewGame(board);
                RESPONSE.notificateBoard(board,board.user1.name+" begins!");
            } else {
                RESPONSE.notification(this.now,"You've allready joined this table dude");
            }
        }else{
//            console.log('Cant add user to non existing board or board is full');
        }
        RESPONSE.updateTableView(everyone.now);
    };

    return everyone;
};
module.exports = chatStart;