var Othello = {  
    Cell: function(row, column, status) {
        this.row = row;
        this.column = column;
        this.status = status;
        this.selectable = false;
    },

    UI: {
        boardID: "#Othello-Board",
        messageID: "#Othello-Message",
        board: undefined,
        initializeBoardComponent: function(cells, selectCallback) {
            this.board = new Vue({
                el: this.boardID,
                data: {
                  rows: cells,
                },
                methods: {
                    select: selectCallback
                }
            });
        },
        initializeMessageComponent: function() {
            this.message = new Vue({
                el: this.messageID,
                data: {
                  text: "",
                }
            });
        },
        setTurnMessageComputer: function() {
            this.message.text = "Please wait while the computer decides its move...";
        },
        setTurnMessageHuman: function() {
            this.message.text = "Select a highlighted cell to move there!";
        },
        updateBoard: function(cells) {
            this.board.rows = cells;
        }
    },

    currentGameCells: [],
    playerTurn: -1,
    humanPlayer: -1,
    algorithmAI: 1,
    initialize: function() {
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
                row.push(new this.Cell(r, c, status));
            }
            this.currentGameCells.push(row);
        }

        // Set Black to go first
        this.playerTurn = this.util.Status.BLACK;

        // Set human player to black
        this.humanPlayer = this.util.Status.BLACK;

        // Initialize UI
        this.UI.initializeMessageComponent();
        var self = this;
        this.UI.initializeBoardComponent(this.currentGameCells, (e) => {
            if (e.currentTarget.classList.contains("selectable")) {
                var row = e.currentTarget.dataset.row;
                var col = e.currentTarget.dataset.column;
                self.move(row, col);
            }
        });

        // Begin sequence of turns 
        this.turn();
        
    }, 

    turn: function() {
        if (this.humanPlayer == this.playerTurn) {
            this.humanTurn();
        } else {
            this.computerTurn();
        }
    },

    humanTurn: function() {
        this.UI.setTurnMessageHuman();
        this.util.updateSelectableCells(this.currentGameCells, this.playerTurn);
        this.UI.updateBoard(this.currentGameCells);
    },

    computerTurn: function() {
        this.UI.setTurnMessageComputer();
        this.util.resetSelectableCells(this.currentGameCells);
        this.UI.updateBoard(this.currentGameCells);

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
                break;
            case 3: // Minimax move
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

    // Given a row and column to the currentGameCells
    // Set that cell to the current player's move.
    move: function(row, column) {
        var cells = this.currentGameCells;
        cell = cells[row][column]
        cell.status = this.playerTurn;
        this.util.flipEffectedCellsFromMove(cells, cell, this.playerTurn)
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

        Status: {
            UNDETERMINED: -1,
            WHITE: 1,
            BLACK: 0
        },
    },
};

Othello.initialize();