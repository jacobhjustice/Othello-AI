var global_board;

var Othello = {  


    UI: {
        boardID: "#Othello-Board",
        messageID: "#Othello-Message",
        levelSelectID: "#Othello-Select",
        levelSelect2ID: "#Othello-Select2",
        depthSelectID: "#Depth-Select",
        depthSelect2ID: "#Depth-Select2",
        board: undefined,
        levelSelect: undefined,
        message: undefined,
        initializeLevelSelectComponent: function(selectCallback, depthSelectCallback) {
            this.levelSelect = new Vue({
                el: this.levelSelectID,
                data: {
                    loaded: false
                },
                methods: {
                    select: selectCallback,
                    depthSelect: depthSelectCallback
                }
            });
        },
        initializeDepthSelectComponent: function(selectCallback) {
            this.depthSelect = new Vue({
                el: this.depthSelectID,
                data: {
                    loaded: false,
                    depths: [1,3,5,7],
                    depthSel: 3,
                }, 
                methods: {
                    select: selectCallback
                }

            });
        },
        initializeControllerSelectComponent: function(selectCallback, depthSelectCallback) {
            this.controllerSelect = new Vue({
                el: this.levelSelect2ID,
                data: {
                    loaded: false
                },
                methods: {
                    select: selectCallback,
                    depthSelect: depthSelectCallback
                }
            });
        },
        initializeDepthBlackSelectComponent: function(selectCallback) {
            this.depthBlackSelect = new Vue({
                el: this.depthSelect2ID,
                data: {
                    loaded: false,
                    depths: [1,3,5,7],
                    depthSel: 3,
                }, 
                methods: {
                    select: selectCallback
                }
            });
        },
        initializeBoardComponent: function(cells, selectCallback) {
            this.board = new Vue({
                el: this.boardID,
                data: {
                  rows: cells,
                  depth: -1,
                  loaded: false,
                  whiteScore: 2,
                  blackScore: 2
                },
                methods: {
                    select: selectCallback,
                }
            });
        },
        initializeMessageComponent: function() {
            this.message = new Vue({
                el: this.messageID,
                data: {
                  text: "",
                  loaded: false,
                }
            });
        },
        setTurnMessageComputer: function() {
            this.message.text = "Please wait while the computer decides its move...";
        },
        setTurnMessageHuman: function() {
            this.message.text = "Select a highlighted cell to move there!";
        },

        setTurnMessageGameover: function() {
            this.message.text = "That's it! Game over!!!";
        },

        updateBoard: function(cells, whiteScore, blackScore) {
            this.board.rows = cells;
            this.board.whiteScore = whiteScore;
            this.board.blackScore = blackScore;
        }
    },

    currentGameCells: [],
    playerTurn: -1,
    humanPlayer: -1,
    algorithmAI: -1,
    humanMode: -1,
    humanMinimaxDepth: -1,
    minimaxDepth: -1,
    load: function() {
        // Initialize UI components
        var self = this;
        this.UI.initializeLevelSelectComponent((e) => {
            var alg = parseInt(e.currentTarget.dataset.code, -1);
            self.algorithmAI = alg;
            self.UI.levelSelect.loaded = false;
            self.UI.controllerSelect.loaded = true;
        }, (_) => {
            self.algorithmAI = 3;
            self.UI.levelSelect.loaded = false;
            self.UI.depthSelect.loaded = true;
        });

        this.UI.initializeDepthSelectComponent((e) => {
            // pass in depth
            var depth = parseInt(e.target.attributes.value.value);
            self.minimaxDepth = depth;
            self.UI.controllerSelect.loaded = true;
            self.UI.depthSelect.loaded = false;

        })

        this.UI.initializeControllerSelectComponent((e) => {
            var action = parseInt(e.currentTarget.dataset.code);
            self.humanMode = action;
            self.initializeGame();
        }, (_) => {
            self.humanMode = 3;
            self.UI.controllerSelect.loaded = false;
            self.UI.depthBlackSelect.loaded = true;
        });

        this.UI.initializeDepthBlackSelectComponent((e) => {
            var depth = parseInt(e.target.attributes.value.value);
            self.humanMinimaxDepth = depth;
            self.initializeGame();
        });

        this.UI.initializeMessageComponent();
        this.UI.initializeBoardComponent(this.currentGameCells, (e) => {
            if (e.currentTarget.classList.contains("selectable")) {
                var row = e.currentTarget.dataset.row;
                var col = e.currentTarget.dataset.column;
                self.move(row, col);
            }
        });

        
        this.UI.levelSelect.loaded = true;
    },

    initializeGame: function() {
        // Create the set of cells
        this.currentGameCells = [];
        for (var r = 0; r < this.util.ROW_SIZE; r++) {
            var row = [];
            for (var c = 0; c < this.util.COL_SIZE; c++) {
                var status = this.util.Status.UNDETERMINED;
                if ((r == this.util.ROW_SIZE / 2 && c == this.util.COL_SIZE / 2) || (r + 1 == this.util.ROW_SIZE / 2 && c + 1 == this.util.COL_SIZE / 2)) {
                    status = this.util.Status.BLACK;
                }
                else if ((r + 1 == this.util.ROW_SIZE / 2 && c == this.util.COL_SIZE / 2) || (r == this.util.ROW_SIZE / 2 && c + 1 == this.util.COL_SIZE / 2)) {
                    status = this.util.Status.WHITE;
                }
                row.push(new this.util.Cell(r, c, status));
            }
            this.currentGameCells.push(row);
        }


        // Set Black to go first
        this.playerTurn = this.util.Status.BLACK;

        // Set human player to black
        this.humanPlayer = this.util.Status.BLACK;
        
        // Update UI
        this.UI.board.loaded = true;
        this.UI.message.loaded = true;

        this.UI.levelSelect.loaded = false;
        this.UI.depthSelect.loaded = false;
        this.UI.controllerSelect.loaded = false;
        this.UI.depthBlackSelect.loaded = false;

        // Begin sequence of turns 
        this.turn();
        
    }, 

    turn: function() {
        var selectable =  this.util.getSelectableCells(this.currentGameCells, this.playerTurn);
        if(selectable.length == 0) {
            this.playerTurn = this.util.getOpposingPlayer(this.playerTurn)
            selectable =  this.util.getSelectableCells(this.currentGameCells, this.playerTurn);
            if(selectable.length == 0) {
                var score = this.util.getCurrentScore(this.currentGameCells)
                this.UI.updateBoard(this.currentGameCells, score[this.util.Status.WHITE], score[this.util.Status.BLACK]);
                return this.UI.setTurnMessageGameover();
            }
        }
        if (this.humanPlayer == this.playerTurn) {
            this.humanTurn();
        } else {
            this.computerTurn();
        }
    },

    
    humanTurn: function() {
        // Indicates the human is piloting
        if(this.humanMode == 5) {
            this.UI.setTurnMessageHuman();
            this.util.updateSelectableCells(this.currentGameCells, this.playerTurn);
            var score = this.util.getCurrentScore(this.currentGameCells)
            this.UI.updateBoard(this.currentGameCells, score[this.util.Status.WHITE], score[this.util.Status.BLACK]);
        } 
        
        // Indicates the AI is piloting for the human
        else {
            var score = this.util.getCurrentScore(this.currentGameCells)
            this.UI.updateBoard(this.currentGameCells, score[this.util.Status.WHITE], score[this.util.Status.BLACK]);
            var moveCell = null;
            switch(this.humanMode) {
                case 1: // Random move
                    moveCell = this.getRandomMove();
                    break;
                case 2: // Greedy move
                    moveCell = this.getGreedyMove();
                    break;
                case 3: // Minimax move
                    moveCell = this.getMinimaxMove(this.humanMinimaxDepth);
                    break;
            }

            setTimeout((_) => {this.move(moveCell.row, moveCell.column)}, 1000);
        }
        
    },

    computerTurn: function() {
        this.UI.setTurnMessageComputer();
        this.util.resetSelectableCells(this.currentGameCells);
        var score = this.util.getCurrentScore(this.currentGameCells)
        this.UI.updateBoard(this.currentGameCells, score[this.util.Status.WHITE], score[this.util.Status.BLACK]);

        var moveCell;

        // AI Logic goes here.
        // minimax: Should use the existing functions to build trees of board states and determine the best option to a given depth
        // Should NOT go back and forth calling humanTurn and computerTurn as that will mess up the current "real" state of the game.
        // If needed, consider creating a new struct to encapsulate all AI related computations
        switch(this.algorithmAI) {
            case 1: // Random move
                moveCell = this.getRandomMove();
                break;
            case 2: // Greedy move
                moveCell = this.getGreedyMove();
                break;
            case 3: // Minimax move
                moveCell = this.getMinimaxMove(this.minimaxDepth);
                break;
            default:
                moveCell = this.getRandomMove();
        }

        setTimeout((_) => {this.move(moveCell.row, moveCell.column)}, 1000);
    },

    getRandomMove: function() {
        var selectableCells = this.util.getSelectableCells(this.currentGameCells, this.playerTurn);
        var index = Math.floor(Math.random()*selectableCells.length) 
        return selectableCells[index]
    },

    getGreedyMove: function() {
        var cells = this.currentGameCells;
        var selectableCells = this.util.getSelectableCells(cells, this.playerTurn);
        var bestScore;
        var bestMove;

        selectableCells.forEach((cell) => {
            var score = this.util.getScoreFromPotentialMove(cells, this.playerTurn, cell.row, cell.column);
            if(bestScore == undefined || bestScore[this.playerTurn] < score[this.playerTurn]) {
                bestScore = score;
                bestMove = cell;
            }
        });
        return bestMove;
    },

    getMinimaxMove: function(depth) {
        var util = this.util;
        var AIPlayer = this.playerTurn;
        function recursiveMinimax(board, depth, isAIPlayerTurn) {
            var currentPlayer = isAIPlayerTurn ? AIPlayer : util.getOpposingPlayer(AIPlayer);
            var potentials = util.getSelectableCells(board, currentPlayer);

            // If the board is terminal or max depth is reached. Return the AI's overall score and bubble back up
            if (depth == 0 || potentials.length == 0) {
                var score = util.getCurrentScore(board)[AIPlayer]
                return [score, null];
            }
            var move = null;

            // If it is the AI's turn, want to maximize score
            if (isAIPlayerTurn) { 
                var value = Number.NEGATIVE_INFINITY;
                potentials.forEach((cell) => {
                    var tempScore = recursiveMinimax(util.move(board, cell.row, cell.column, currentPlayer), depth - 1, !isAIPlayerTurn)[0]
                    if (tempScore > value) {
                        value = tempScore
                        move = [tempScore, cell];
                    }
                });
            }

            // Otherwise it is opponent's turn, want to minimize score
            else {
                var value = Number.POSITIVE_INFINITY;
                potentials.forEach((cell) => {
                    var tempScore = recursiveMinimax(util.move(board, cell.row, cell.column, currentPlayer), depth - 1, !isAIPlayerTurn)[0]
                    if (tempScore < value) {
                        value = tempScore
                        move = [tempScore, cell];
                    }
                });
            }
            
            return move;
        };

        var r = recursiveMinimax(this.currentGameCells, depth, true);
        console.log(r[0])
        return r[1];
    },

    // Given a row and column to the currentGameCells
    // Set that cell to the current player's move.
    move: function(row, column) {
        this.currentGameCells = this.util.move(this.currentGameCells, row, column, this.playerTurn)
        this.playerTurn = this.util.getOpposingPlayer(this.playerTurn);
        this.turn();
    },

    // Util contains a series of functions that can be used from the Othello class,
    // but are abstracted to their own level as to not access or modify information about the current player's turn or state of the game unless explicitly passed.
    util: {
        ROW_SIZE: 8,
        COL_SIZE:  8,

        // Given an index and whether or not it corresponds to a row
        // Return whether or not the index is valid
        checkIndex(index, isRow) {
            if (isRow) {
                return (index < this.ROW_SIZE && index >= 0);
            }
            return (index < this.COL_SIZE && index >= 0)
        },

        // Given a set of cells, a corresponding row, col, and turn
        // Return a new set of cells that exists after making the corresponding move
        move(cells, row, column, playerTurn) {
            var newCells = this.copyCells(cells);
            cell = newCells[row][column]
            cell.status = playerTurn;
            this.flipEffectedCellsFromMove(newCells, cell, playerTurn);
            return newCells
        },


        // Given a set of cells, and a specific cell in the set
        // Find the neighbors of cell
        getNeighborCells(cells, cell) {
            neighbors = [];
            for (var r = -1; r <= 1; r++) {
                var rowIndex = cell.row + r;
                if (this.checkIndex(rowIndex, true)) {
                    var currentRow = cells[rowIndex];
                    for (var c = -1; c <= 1; c++) {
                        var colIndex = cell.column + c;
                        if (this.checkIndex(colIndex, false)) {
                            var neighboringCell = currentRow[colIndex];
                            if (neighboringCell != cell) {
                                neighbors.push(neighboringCell);
                            }
                        }
                    }
                }
            }
            return neighbors;
        },

        // Given an array of cells
        // Create a deep copy of this array so that the original set is not modified
        copyCells: function(cells) {
            var newCells = [];
            cells.forEach((row) => {
                var cells = [];
                row.forEach((cell) => {
                    cells.push(new this.Cell(cell.row, cell.column, cell.status))
                });
                newCells.push(cells);
            });
            return newCells;
         },

        // Given a set of cells
        // Reset the selectable property in each infividual cell to false
        resetSelectableCells: function(cells) {
            cells.forEach(row => {
                row.forEach(cell => {
                    cell.selectable = false;
                })
            });
        }, 

        // Given a set of cells and the current playerTurn
        // Update all potential cells by the rules of Othello to have selectable attribute = true
        updateSelectableCells: function(cells, playerTurn) {
            this.resetSelectableCells(cells);

            selectableCells = this.getSelectableCells(cells, playerTurn);
            selectableCells.forEach(cell => {
                cell.selectable = true;
            });
        },

        // Given a set of cells
        // Evaluate the current score for both sides
        getCurrentScore: function(cells) {
            // TODO restructure to a state class so that this function isn't necesary and we can get constant time score lookups
            var whiteScore = 0;
            var blackScore = 0;
            cells.forEach((row) => {
                row.forEach((cell) => {
                    if (cell.status == this.Status.WHITE) {
                        whiteScore++;
                    } else if (cell.status == this.Status.BLACK) {
                        blackScore++;
                    }
                });
            });

            return this.Score(whiteScore, blackScore);
        },

        // Given a set of cells, player color, and the row/column of a potential move
        // Evaluate the resulting score from taking that move
        getScoreFromPotentialMove: function(cells, color, row, col) {
            var coppiedCells = this.copyCells(cells);
            var cell = coppiedCells[row][col];
            cell.status = color;
            this.flipEffectedCellsFromMove(coppiedCells, cell, color);
            return this.getCurrentScore(coppiedCells);
        },

        // Given a set of cells, the current playerTurn, and a movedCell that has just been placed down
        // Evaluate the new grid after flipping "sandwhiched" cells by following the ruled of Othello
        flipEffectedCellsFromMove: function(cells, movedCell, playerTurn) {
            var neighbors = this.getNeighborCells(cells, movedCell);
            var opposingColor = this.getOpposingPlayer(playerTurn);
            neighbors.forEach(cell => {
                if (cell.status == opposingColor) {
                    var directionR = cell.row - movedCell.row;
                    var directionC = cell.column - movedCell.column;
                    var failedFind = false;
                    var middleCells = [cell];
                    var current = cell;
                    // TODO extract incremental trail logic
                    do {
                        // Increment to next spot, and validate.
                        var rowIndex = current.row + directionR
                        var colIndex = current.column + directionC
                        if (!this.checkIndex(rowIndex, true) || !this.checkIndex(colIndex, false)) {
                            failedFind = true
                            break;
                        }

                        // Move to next cell, and if it is not of the opponent's color, we failed.
                        current = cells[rowIndex][colIndex];
                        if (current.status == this.Status.UNDETERMINED) {
                            failedFind = true;
                            break;
                        }
                        middleCells.push(current)
                    } while(current.status != playerTurn)
                    if (!failedFind) {
                        middleCells.forEach(cell => {
                            cell.status = playerTurn;
                        });
                    }
                }

            });
        },

        // Given a set of cells and the current playerTurn
        // Return an array of all cells that are selectable within that set
        getSelectableCells: function(cells, currentTurn) {
            contenders = [];
            var potentialAdjacentColor = this.getOpposingPlayer(currentTurn);
            for (var r = 0; r < this.ROW_SIZE; r++) {
                for (var c = 0; c < this.COL_SIZE; c++) {
                    var cell = cells[r][c];

                    // Check to see if cell is avaliable
                    if (cell.status != this.Status.UNDETERMINED) {
                        continue;
                    }
                    
                    // Check neighbors of opposing color
                    var neighbors = this.getNeighborCells(cells, cell);
                    for (var i = 0; i < neighbors.length; i++) {
                        neighbor = neighbors[i];
                        if (neighbor.status == potentialAdjacentColor) {
                            // Check to see if you continue in this direction, if you hit current players color.
                            // If so, add to contenders list.
                            // If not, continue to next neighbor.
                            var directionR = neighbor.row - cell.row;
                            var directionC = neighbor.column - cell.column;
                            var current = neighbor;
                            var failedFind = false;
                            do {
                                // Increment to next spot, and validate.
                                var rowIndex = current.row + directionR
                                var colIndex = current.column + directionC
                                if (!this.checkIndex(rowIndex, true) || !this.checkIndex(colIndex, false)) {
                                    failedFind = true
                                    break;
                                }

                                // Move to next cell, and if it is not of the opponent's color, we failed.
                                current = cells[rowIndex][colIndex];
                                if (current.status == this.Status.UNDETERMINED) {
                                    failedFind = true;
                                    break;
                                }
                            } while(current.status != currentTurn)
                            if (!failedFind) {
                                contenders.push(cell);
                                break;
                            }
                        }
                    }
                }
            }
            return contenders;
        },

        // Given the current player
        // Return the opposite player
        getOpposingPlayer: function(currentTurn) {
            var testPlayer = this.Status.BLACK;
            if (testPlayer != currentTurn) {
                return testPlayer;
            }
            return this.Status.WHITE;
        },

        Score: function(whiteScore, blackScore) {
            var score = [];
            score[this.Status.BLACK] = blackScore;
            score[this.Status.WHITE] = whiteScore;
            return score;
        },

        Status: {
            UNDETERMINED: -1,
            WHITE: 1,
            BLACK: 0
        },

        Cell: function(row, column, status) {
            this.row = row;
            this.column = column;
            this.status = status;
            this.selectable = false;
        },
    },
};

Othello.load();