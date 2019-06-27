import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

//components
import Grid from "./components/grid";

//assets
import "./styles/index.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEraser, faLightbulb, faPenFancy, faPencil, faPlus } from "@fortawesome/pro-light-svg-icons";

const allowCellUpdate = (cells, current) => {
  const { column, row } = current;
  if (column === -1 && row === -1) {
    return false;
  }

  const { predefined } = cells[row][column];
  if (predefined) {
    return false;
  }

  return true;
};

const getGridID = (col, row) => {
  let grid = 0;

  if ((col + 1) / 3 > 2) {
    grid = 2;
  } else if ((col + 1) / 3 > 1) {
    grid = 1;
  }

  if ((row + 1) / 3 > 2) {
    grid += 6;
  } else if ((row + 1) / 3 > 1) {
    grid += 3;
  }

  return grid;
};

const hintCellValue = (cells, current) => {
  const { column, row } = current;
  if (column === -1 && row === -1) {
    return cells;
  }

  const update = [ ...cells ];
  update[row][column].predefined = true;
  update[row][column].status = "";
  update[row][column].value = update[row][column].solution;

  return update;
};

const isGameComplete = cells => {
  if (!cells) {
    return false;
  }

  let valid = true;

  cells.forEach(r => {
    let test = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9, 
    ];

    r.forEach(cell => {
      test = test.filter(value => value !== cell.value);
    });

    if (test.length > 0) {
      valid = false;
    }
  });

  return valid;
};

const isMoveValid = (cells, current, value) => {
  const { column, grid, row } = current;
  if (column === -1 && row === -1) {
    return;
  } else if (value === 0) {
    return true;
  }

  let valid = true;

  cells.forEach(r => {
    r.forEach(cell => {
      if (
        (cell.column === column || cell.grid === grid || cell.row === row) &&
        !(cell.column === column && cell.grid === grid && cell.row === row)
      ) {
        if (cell.value === value) {
          valid = false;
        }
      }
    });
  });

  return valid;
};

const isStillMoveValid = cells => {
  if (!cells) {
    return null;
  }

  const update = [ ...cells ];

  update.forEach(r => {
    r.forEach(cell => {
      if (cell.status === "error") {
        if (isMoveValid(update, cell, cell.value)) {
          cell.status = "";
        }
      }
    });
  });

  return update;
};

const moveCurrent = (key, col, row) => {
  if (col === -1 || row === -1) {
    return;
  }

  let newColumn = col;
  let newRow = row;

  switch (key) {
    case "ArrowLeft":
      if (col > 0) {
        newColumn -= 1;
      }
      break;

    case "ArrowRight":
      if (col < 8) {
        newColumn += 1;
      }
      break;

    case "ArrowUp":
      if (row > 0) {
        newRow -= 1;
      }
      break;

    case "ArrowDown":
      if (row < 8) {
        newRow += 1;
      }
      break;

    default:
  }

  const grid = getGridID(newColumn, newRow);

  return {
    column: newColumn,
    grid,
    row: newRow,
  };
};

const newGame = cells => {
  const update = [ ...cells ];

  /* eslint-disable array-element-newline */
  const solution = [
    [ 3, 9, 5, 4, 6, 7, 1, 8, 2 ],
    [ 1, 4, 6, 2, 8, 9, 5, 3, 7 ],
    [ 2, 7, 8, 5, 1, 3, 6, 9, 4 ],
    [ 4, 5, 1, 9, 3, 8, 7, 2, 6 ],
    [ 9, 8, 7, 6, 4, 2, 3, 1, 5 ],
    [ 6, 2, 3, 7, 5, 1, 9, 4, 8 ],
    [ 5, 6, 2, 3, 9, 4, 8, 7, 1 ],
    [ 8, 3, 4, 1, 7, 5, 2, 6, 9 ],
    [ 7, 1, 9, 8, 2, 6, 4, 5, 3 ],
  ];

  const puzzle = [
    [ 0, 0, 5, 4, 0, 0, 1, 8, 0 ],
    [ 1, 4, 6, 0, 8, 0, 5, 0, 0 ],
    [ 0, 7, 0, 0, 1, 3, 0, 0, 0 ],
    [ 4, 5, 1, 0, 0, 8, 7, 0, 6 ],
    [ 0, 8, 0, 0, 0, 0, 0, 1, 0 ],
    [ 6, 0, 3, 7, 0, 0, 9, 4, 8 ],
    [ 0, 0, 0, 3, 9, 0, 0, 7, 0 ],
    [ 0, 0, 4, 0, 7, 0, 2, 6, 9 ],
    [ 0, 1, 9, 0, 0, 6, 4, 0, 0 ],
  ];
  /* eslint-enable array-element-newline */

  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 9; column++) {
      if (puzzle[row][column]) {
        update[row][column].predefined = true;
        update[row][column].value = puzzle[row][column];
      }

      update[row][column].solution = solution[row][column];
    }
  }

  return update;
};

const setupCells = () => {
  const cells = [];

  for (let row = 0; row < 9; row++) {
    const rowArray = [];

    for (let column = 0; column < 9; column++) {
      const grid = getGridID(column, row);

      rowArray.push({
        column,
        grid,
        notes: [],
        // predefined: true,
        row,
        // value: `${row},${column},${grid}`,
        // value: 1,
      });
    }

    cells.push(rowArray);
  }

  return cells;
};

const updateCellNotes = (key, cells, current) => {
  if (!allowCellUpdate(cells, current) || key === "backspace") {
    return null;
  }

  const { column, row } = current;
  const newValue = parseInt(key, 10);

  const update = [ ...cells ];
  let notes = update[row][column].notes;

  if (notes.includes(newValue)) {
    notes = notes.filter(item => item !== newValue);
    // console.log(notes.filter(item => item !== newValue));
  } else if (!notes.includes(newValue)) {
    notes.push(newValue);
  }

  update[row][column].notes = notes;

  return update;
};

const updateCellValue = (key, cells, current) => {
  if (!allowCellUpdate(cells, current)) {
    return null;
  }

  const { column, row } = current;

  let newValue = parseInt(key, 10);
  if (key === "Backspace") {
    newValue = 0;
  }

  const update = [ ...cells ];
  update[row][column].notes = [];
  update[row][column].status = isMoveValid(cells, current, newValue) ? "" : "error";
  update[row][column].value = newValue;

  return update;
};

const App = () => {
  const emptyCurrent = {
    column: -1,
    grid: -1,
    row: -1,
  };

  const [
    cells,
    setCells, 
  ] = useState(setupCells());

  const [
    current,
    setCurrent, 
  ] = useState(emptyCurrent);

  const [
    penMode,
    setPenMode, 
  ] = useState(true);

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  const handleKeydown = event => {
    const { key } = event;

    switch (key) {
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
        const { column, row } = current;
        const newPosition = moveCurrent(key, column, row);

        if (newPosition) {
          setCurrent(newPosition);
        }

        break;

      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "Backspace":
        updateCell(key);
        break;

      case "h":
      case "H":
        hintCell(cells, current);
        break;

      case "n":
      case "N":
        setPenMode(!penMode);
        break;

      default:
    }
  };

  const hintCell = () => {
    const update = hintCellValue(cells, current);
    console.log(isGameComplete(update));

    setCells(update);
  };

  const resetCurrent = () => {
    setCurrent(emptyCurrent);
  };

  const updateCell = key => {
    let update = null;

    if (penMode) {
      update = updateCellValue(key, cells, current);
      // console.log(update);
      update = isStillMoveValid(update);
      console.log(isGameComplete(update));
    } else {
      update = updateCellNotes(key, cells, current);
    }

    if (!update) {
      return;
    }
    setCells(update);
  };

  newGame(cells);

  return (
    <section
      className="content"
      // onClick={() => {
      //   console.log("main click");
      // }}
    >
      <main>
        <Grid
          cells={cells}
          current={current}
          setCurrent={setCurrent}
          // onClick={() => {
          //   console.log("grid click");
          // }}
        />
      </main>
      <aside onClick={() => resetCurrent()}>
        <div className="number-pad">
          <div onClick={() => updateCell(1)} className="button">
            1
          </div>
          <div onClick={() => updateCell(2)} className="button">
            2
          </div>
          <div onClick={() => updateCell(3)} className="button">
            3
          </div>
          <div onClick={() => updateCell(4)} className="button">
            4
          </div>
          <div onClick={() => updateCell(5)} className="button">
            5
          </div>
          <div onClick={() => updateCell(6)} className="button">
            6
          </div>
          <div onClick={() => updateCell(7)} className="button">
            7
          </div>
          <div onClick={() => updateCell(8)} className="button">
            8
          </div>
          <div onClick={() => updateCell(9)} className="button">
            9
          </div>
        </div>
        <div className="commands">
          <div onClick={() => setPenMode(!penMode)} className="button">
            <FontAwesomeIcon icon={penMode ? faPenFancy : faPencil} size="2x" />
            {penMode ? "Pen" : "Pencil"}
          </div>
          <div onClick={() => updateCell(0)} className="button">
            <FontAwesomeIcon icon={faEraser} size="2x" />
            Delete
          </div>
          <div onClick={() => hintCell(cells, current)} className="button">
            <FontAwesomeIcon icon={faLightbulb} size="2x" />
            Hint
          </div>
          <div onClick={() => setCells(newGame(setupCells()))} className="button">
            <FontAwesomeIcon icon={faPlus} size="2x" />
            New Game
          </div>
        </div>
      </aside>
    </section>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
