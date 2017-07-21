const GameEnums = require('../lib/GameEnums'),
    myToast = require('message-toast');

function log(_s){
    console.log(_s);
}

const SIGN = GameEnums.SIGN;
const GAMESTATE = GameEnums.GAMESTATE;

// get responses
now.notification = function(msg){
    myToast.showMessage(msg);
};
now.newUserInLobby = function(data){
    UI.addUserToLobby(data);
};
now.updateTableView = function(boards){
    Board_Pool.renderPool(boards,this.now.user);
};
now.drawSign = function(index,sign,state){
    if(arguments.length == 3){
        xxo.setUserState(state);
    }
    xxo.drawSign(index,sign);
};

now.startNewGame = function(userState){
    xxo.setUserState(userState);
    xxo.resetBoard();
};

now.setState = function(state){
    xxo.setUserState(state);
};

var REQUEST = {
    init : function(){
        function askName(txt){
            var name = window.prompt(txt,'');
            if(name){
                now.addUser(name);
            } else{
                askName("Please enter a name");
            }
        }
        askName("Whats your name?");
    },
    drawSign : function(index){
        log("request send index: "+index);
        now.sendSign(index);
    },
    addUserToBoard : function(name){
        // join
        now.joinBoard(name);
    },
    createNewBoard : function(){
        var id = window.prompt('Give your Board a unique name');
        if(id){
            log('create board: '+id);
            now.createNewBoard(id);
        }
    }
};

var UI = {
    addUserToLobby : function(users){
        var div = document.getElementById('userList');
        if(div.children.length > 0){
            div.removeChild(div.children[0]);
        }
        var ul = document.createElement('ul');
        console.log('say: ');
        console.log(users);
        users.forEach(function(user,index){
            log(user.sign);
            var node = document.createElement('li');
            node.innerHTML = user.name;
            ul.appendChild(node);
        });
        div.appendChild(ul);
    },
    removeAllChildrens : function(rootNode){
        var root = rootNode;
        while( root.firstChild ){
            root.removeChild( root.firstChild );
        }
    },
    showToast : function(msg){
        var DELAY = 4000;
        var toast = document.getElementById('toast');
        if(!toast){
            log('Create new Toast');
            toast = document.createElement('div');
            toast.id = "toast";
            toast.style.cssText = "position:fixed;top:10px;right:10px;border-radius:5px;color:#fff;font-size:15px;font-weight:bold;background-color:black;padding:20px;"
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(toast);
        }
        toast.style.opacity = 1;
        var p = document.createElement('p');
        p.style.cssText = "padding:5px 0";
        p.innerHTML = msg;
        toast.appendChild(p);
        var timeOut = DELAY;
        function fadeOut(){
            var opacity = toast.style.opacity;
            if(opacity > 0){
                if(opacity < 1){
                    timeOut = 40;
                }else {
                    timeOut = DELAY;
                }
                opacity = opacity-0.04;
                toast.style.opacity = opacity;
                setTimeout(function(){fadeOut();},timeOut);
            }else{
                UI.removeAllChildrens(toast);
            }
        }
        fadeOut();
    }
};

window.onload = function(){
    setTimeout(function(){
        REQUEST.init();
    },500);
};


// prepare canvas
var canvasTools = (function(){
    // http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
    function mouseCoordinates(event){

        event = event || window.event;
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var canvasX = 0;
        var canvasY = 0;
        var currentElement = this;
//            log("EVENT:");
//            log(event);
        do{
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        }
        while(currentElement = currentElement.offsetParent);
        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
        return {x:canvasX, y:canvasY}
    }
    HTMLCanvasElement.prototype.mouseCoordinates = mouseCoordinates;
})();

var Board_Pool = {
    renderPool : function(boards,me){
        var root = document.getElementById('board_pool');
        UI.removeAllChildrens(root);
        boards.forEach(function(board,i){
            var div = document.createElement('div');
            div.innerHTML = board.id;
            if(board.user2 == undefined && board.user1.name != me.name){
                div.addEventListener('click',function(){
                    REQUEST.addUserToBoard(board.id);
                },false);
                div.style.backgroundColor = "#d3d3d3";
            }
            root.appendChild(div);
        });
    }
};

var xxo = new function(){

    var userState = GAMESTATE.boardNotready;

    this.setUserState = function(state){
        userState = state;
    };

    function P(x,y){
        this.x = x;
        this.y = y;
        this.out = function(){
            return "p= "+this.x+" * "+this.y;
        }
    }
    function Field(p,idx,w,h){
        this.p = p;
        this.w = w || fieldWidth;
        this.h = h || fieldHeight;
        this.signed = false;
        this.index = idx;
    }
    var fieldWidth = 100, fieldHeight = 100, fieldSize = 3;
    // store the activeField
    var activeField;

    // 2 5 8
    // _____
    // 0 1 2| 0
    // 3 4 5| 1
    // 6 7 8| 2
    var board = [
        new Field(new P(0,0),0),
        new Field(new P(0,100),1),
        new Field(new P(0,200),2),
        new Field(new P(100,0),3),
        new Field(new P(100,100),4),
        new Field(new P(100,200),5),
        new Field(new P(200,0),6),
        new Field(new P(200,100),7),
        new Field(new P(200,200),8)
    ];

    var canvas = document.getElementById('xxo');
    var ctx = document.getElementById('xxo').getContext("2d");

    var fc = {
        //draw a circle
        drawCircle : function(p,d){
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.arc(p.x+(fieldWidth/2), p.y+(fieldHeight/2), d/2, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.stroke(); // change to stroke
        },
        drawCross : function(p){
            var w = 20;
            var h = 20;
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.moveTo(p.x+(fieldWidth/2)-w/2, p.y+(fieldHeight/2)-h/2);
            ctx.lineTo(p.x+(fieldWidth/2)+w/2, p.y+(fieldHeight/2)+h/2);
            ctx.moveTo(p.x+(fieldWidth/2)+w/2, p.y+(fieldHeight/2)-h/2);
            ctx.lineTo(p.x+(fieldWidth/2)-w/2, p.y+(fieldHeight/2)+h/2);
            ctx.closePath();
            ctx.stroke();
        },
        drawSign : function(p,sign){
            if(sign == 0){
                fc.drawCircle(p,20);
            }else{
                fc.drawCross(p);
            }
        },
        getField : function(p,foundOnIndex){
            board.forEach(function(elem,index){
                if(p.x >= elem.p.x && p.x < elem.p.x+elem.w && p.y >= elem.p.y && p.y < elem.p.y+elem.h){
                    x = index;
                    foundOnIndex(index);
                }
            });
            foundOnIndex(-1);
        },
        drawBoard : function(){
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.moveTo(fieldWidth,0);
            ctx.lineTo(fieldWidth,fieldHeight*fieldSize);
            ctx.moveTo(fieldWidth*2,0);
            ctx.lineTo(fieldWidth*2,fieldHeight*fieldSize);
            ctx.moveTo(0,fieldHeight);
            ctx.lineTo(fieldWidth*fieldSize,fieldHeight);
            ctx.moveTo(0,fieldHeight*2);
            ctx.lineTo(fieldWidth*fieldSize,fieldHeight*2);
            ctx.closePath();
            ctx.stroke();
        },
        registerEventsOnCanvas : function(){
            canvas.addEventListener('click',function doClick(){
                if(!activeField.signed && userState == GAMESTATE.play){
//                        fc.deActivateHighlight(activeField);
//                        board[activeField.index].signed = true;
                    events.makeMove();
                }else{
                    myToast.showMessage("I's not you turn");
                }
            });
            canvas.addEventListener('mousemove',function doOver(){
                events.hightlightField();
            });
            canvas.addEventListener('mouseout',function doOver(){
                fc.deActivateHighlight(activeField);
                activeField = undefined;
            });
            // bind click event
            // bind mouse over event
        },
        deActivateHighlight : function(field){
            if(field != undefined && !field.signed){
                fc.fillWithcolor(field.p,'#ffffff');
            }
        },
        activateHighlight : function(p){
            if(userState == GAMESTATE.play){
                fc.fillWithcolor(p,'#006600');
            }else {
                fc.fillWithcolor(p,'#660000');
            }
        },
        fillWithcolor : function(p,color){
            ctx.fillStyle = color;
            ctx.fillRect(p.x+1,p.y+1,fieldWidth-2,fieldHeight-2);
        }
    };

    var events = {
        makeMove : function(){
            log(activeField);
            REQUEST.drawSign(activeField.index);
        },
        hightlightField : function(){
            var event;
            coords = canvas.mouseCoordinates(event);
            var p = new P(coords.x,coords.y);
            var fieldIndex = fc.getField(p,function(fieldIndex){
                if(fieldIndex == -1){return;}
                var field = board[fieldIndex];
                if(field.signed){
                    fc.deActivateHighlight(activeField);
                    activeField = field;
                    return;
                }
                if(activeField == undefined){ // initialize
                    activeField = field;
                    fc.activateHighlight(activeField.p);
                }else {
                    if(activeField.p.x != field.p.x || activeField.p.y != field.p.y){
                        if(activeField.p.x != undefined){
                            fc.deActivateHighlight(activeField);
                        }
                        activeField = field;
                        fc.activateHighlight(field.p);
                    }
                }
            });
        }
    };

    this.resetBoard = function(){
        log("Canvase w "+canvas.width);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        board.forEach(function(field,idx){
            field.signed = false;
        });
        fc.drawBoard();
    };

    this.drawSign = function(index,sign){
        var field = board[index];
        fc.deActivateHighlight(field);
        board[field.index].signed = true;
        fc.drawSign(field.p,sign);
    };

    // init Board
    fc.drawBoard();
    fc.registerEventsOnCanvas();
};