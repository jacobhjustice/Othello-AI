var Othello = {
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
    checkIndex(index, isRow) {
        if (isRow) {
            return (rowIndex < this.cells.length && rowIndex >= 0);
        }
        return (colIndex < currentRow.length && colIndex >= 0)
    },

    getNeighborCells(cell) {
        neighbors = [];
        for (var r = -1; r <= 1; r++) {
            var rowIndex = cell.row + r;
            if (this.checkIndex(rowIndex, true)) {
                var currentRow = this.cells[rowIndex];
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

    UI: {
        boardID: "#Othello-Board",
        renderBoard: function(cells) {
            new Vue({
                el: this.boardID,
                data: {
                  rows: cells,
                }
            });
        }
    },
    ROW_SIZE: 8,
    COL_SIZE:  8,
    cells: [],
    playerTurn: -1,
    initialize: function() {
        // Create the set of cells
        this.cells = [];
        for (var r = 0; r < this.ROW_SIZE; r++) {
            var row = [];
            for (var c = 0; c < this.COL_SIZE; c++) {
                var status = this.Status.UNDETERMINED;
                if ((r == this.ROW_SIZE / 2 && c == this.COL_SIZE / 2) || (r + 1 == this.ROW_SIZE / 2 && c + 1 == this.COL_SIZE / 2)) {
                    status = this.Status.BLACK;
                }
                else if ((r + 1 == this.ROW_SIZE / 2 && c == this.COL_SIZE / 2) || (r == this.ROW_SIZE / 2 && c + 1 == this.COL_SIZE / 2)) {
                    status = this.Status.WHITE;
                }
                row.push(new this.Cell(r, c, status));
            }
            this.cells.push(row);
        }

        // Set Black to go first
        this.playerTurn = this.Status.BLACK;

        // Render the initial set
        this.UI.renderBoard(this.cells);
    }, 

    getSelectableCells: function() {
        contenders = [];
        var potentialAdjacentColor = this.getOpposingPlayer();
        for (var r = 0; r < this.ROW_SIZE; r++) {
            for (var c = 0; c < this.COL_SIZE; c++) {
                var cell = this.cells[r][c];

                // Check to see if cell is avaliable
                if (cell.status != this.Status.UNDETERMINED) {
                    continue;
                }
                
                // Check neighbors of opposing color
                var neighbors = this.getNeighborCells(cell);
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
                            if(!this.checkIndex(rowIndex, true) || !this.checkIndex(colIndex, false)) {
                                failedFind = true
                                break;
                            }

                            // Move to next cell, and if it is not of the opponent's color, we failed.
                            current = this.cells[rowIndex][colIndex];
                            if (current.status == this.Status.UNDETERMINED) {
                                failedFind = true;
                                break;
                            }
                        } while(current.status != this.playerTurn)
                        if (!failedFind) {
                            contenders.push(cell)
                        }
                        break;
                    }
                }
            }
        }
        return contenders;
    },

    getOpposingPlayer: function() {
        var testPlayer = this.Status.BLACK;
        if (testPlayer != this.playerTurn) {
            return testPlayer;
        }
        return this.Status.WHITE;
    }
};

Othello.initialize();