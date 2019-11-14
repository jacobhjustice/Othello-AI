var Othello = {
    Status: {
        UNOWNED: 0,
        WHITE: 1,
        BLACK: 2
    },
    
    Cell: function(row, column, status) {
        this.row = row;
        this.column = column;
        this.isWhite = status == Othello.Status.WHITE;
        this.isBlack = status == Othello.Status.BLACK;
        this.status = status;
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
    initialize: function() {
        // Create the set of cells
        this.cells = [];
        for (var r = 0; r < this.ROW_SIZE; r++) {
            var row = [];
            for (var c = 0; c < this.COL_SIZE; c++) {
                status = this.Status.UNOWNED;
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

        // Render the initial set
        this.UI.renderBoard(this.cells);
    } 
};

Othello.initialize();