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

  const { predefined } = cells[row - 1][column - 1];
  if (predefined) {
    return false;
  }

  return true;
};

const applyPossibleValues = (cells, possibles) => {
  const update = [ ...cells ];

  for (let row = 1; row < 10; row++) {
    for (let column = 1; column < 10; column++) {
      update[row - 1][column - 1].notes = possibles[row - 1][column - 1].possible;
    }
  }

  return update;
};

const initialCurrentCell = {
  column: -1,
  grid: -1,
  row: -1,
};

const getGridID = (col, row) => {
  let grid = 1;

  if (col / 3 > 2) {
    grid = 3;
  } else if (col / 3 > 1) {
    grid = 2;
  }

  if (row / 3 > 2) {
    grid += 6;
  } else if (row / 3 > 1) {
    grid += 3;
  }

  return grid;
};

const getPossibleValues = cells => {
  const hashPossibles = grid => grid.map(r => r.map(cell => cell.possible.join(""))
    .join(""))
    .join("");

  const hasChanges = (before, after) => hashPossibles(before) !== hashPossibles(after);

  let possibles = cells.map(r => {
    return r.map(cell => {
      const { column, grid, row, value } = cell;

      return {
        column,
        grid,
        possible: value ? [ value ] : [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9, 
        ],
        row,
      };
    });
  });

  let continueSearch = true;

  /* eslint-disable sort-keys */
  const pipeline = {
    crme: possibleCRME,
    loneRangers: possibleLoneRangers,
    twins: possibleTwins,
    triplets: possibleTriplets,
  };
  /* eslint-enable sort-keys */

  const scores = {};

  while (continueSearch) {
    let changes = false;

    for (const key of Object.keys(pipeline)) {
      const fn = pipeline[key];

      const result = fn(possibles);
      changes = hasChanges(possibles, result);

      if (changes) {
        scores[key] = scores[key] ? scores[key] + 1 : 1;
        possibles = result;
        break;
      }
    }

    if (!changes) {
      continueSearch = false;
    }
  }

  console.log(scores);

  return possibles;
};

const hintCellValue = (cells, current) => {
  const { column, row } = current;
  if (column === -1 && row === -1) {
    return cells;
  }

  const update = [ ...cells ];

  if (update[row - 1][column - 1].solution) {
    update[row - 1][column - 1].predefined = true;
    update[row - 1][column - 1].status = "";
    update[row - 1][column - 1].value = update[row - 1][column - 1].solution;
  }

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
      if (col > 1) {
        newColumn -= 1;
      }
      break;

    case "ArrowRight":
      if (col < 9) {
        newColumn += 1;
      }
      break;

    case "ArrowUp":
      if (row > 1) {
        newRow -= 1;
      }
      break;

    case "ArrowDown":
      if (row < 9) {
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
  // const solution = [
  //   [ 3, 9, 5, 4, 6, 7, 1, 8, 2 ],
  //   [ 1, 4, 6, 2, 8, 9, 5, 3, 7 ],
  //   [ 2, 7, 8, 5, 1, 3, 6, 9, 4 ],
  //   [ 4, 5, 1, 9, 3, 8, 7, 2, 6 ],
  //   [ 9, 8, 7, 6, 4, 2, 3, 1, 5 ],
  //   [ 6, 2, 3, 7, 5, 1, 9, 4, 8 ],
  //   [ 5, 6, 2, 3, 9, 4, 8, 7, 1 ],
  //   [ 8, 3, 4, 1, 7, 5, 2, 6, 9 ],
  //   [ 7, 1, 9, 8, 2, 6, 4, 5, 3 ],
  // ];

  // const puzzle = [
  //   [ 0, 0, 5, 4, 0, 0, 1, 8, 0 ],
  //   [ 1, 4, 6, 0, 8, 0, 5, 0, 0 ],
  //   [ 0, 7, 0, 0, 1, 3, 0, 0, 0 ],
  //   [ 4, 5, 1, 0, 0, 8, 7, 0, 6 ],
  //   [ 0, 8, 0, 0, 0, 0, 0, 1, 0 ],
  //   [ 6, 0, 3, 7, 0, 0, 9, 4, 8 ],
  //   [ 0, 0, 0, 3, 9, 0, 0, 7, 0 ],
  //   [ 0, 0, 4, 0, 7, 0, 2, 6, 9 ],
  //   [ 0, 1, 9, 0, 0, 6, 4, 0, 0 ],
  // ];

  const solution = [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
  ];

  const puzzle = [
    [ 0, 0, 0, 0, 3, 0, 0, 0, 0 ],
    [ 0, 0, 0, 6, 0, 7, 0, 0, 9 ],
    [ 0, 0, 0, 9, 0, 0, 7, 3, 0 ],
    [ 0, 0, 0, 0, 0, 6, 0, 0, 4 ],
    [ 1, 8, 0, 4, 0, 5, 0, 2, 7 ],
    [ 7, 0, 0, 3, 0, 0, 0, 0, 0 ],
    [ 0, 7, 1, 0, 0, 9, 0, 0, 0 ],
    [ 2, 0, 0, 1, 0, 8, 0, 0, 0 ],
    [ 0, 0, 0, 0, 7, 0, 0, 0, 0 ],
  ];
  /* eslint-enable array-element-newline */

  for (let row = 1; row < 10; row++) {
    for (let column = 1; column < 10; column++) {
      if (puzzle[row - 1][column - 1]) {
        update[row - 1][column - 1].predefined = true;
        update[row - 1][column - 1].value = puzzle[row - 1][column - 1];
      }

      update[row - 1][column - 1].solution = solution[row - 1][column - 1];
    }
  }

  return update;
};

const possibleCreateUpdate = (cells, possibles) => {
  const updates = cells.map(r => {
    return r.map(cell => {
      return { ...cell };
    });
  });

  possibles.flat()
    .forEach(cell => {
      const { column, possible, row } = cell;

      updates[row - 1][column - 1].possible = possible;
    });

  return updates;
};

const possibleCRME = cells => {
  const searchSet = set => {
    const usedValues = [];

    set.forEach(cell => {
      if (cell.possible.length === 1) {
        usedValues.push(...cell.possible);
      }
    });

    usedValues.forEach(used => {
      set.forEach(cell => {
        if (cell.possible.length > 1) {
          cell.possible = cell.possible.filter(value => value !== used);
        }
      });
    });
  };

  const { columns, grids, rows } = splitCRM(cells);

  [
    ...rows,
    ...columns,
    ...grids, 
  ].forEach(set => {
    searchSet(set);
  });

  return possibleCreateUpdate(cells, rows);
};

const possibleLoneRangers = cells => {
  const searchSet = set => {
    const count = {};

    set.forEach(cell => {
      if (cell.possible.length > 1) {
        cell.possible.forEach(value => {
          count[value] = count[value] ? count[value] + 1 : 1;
        });
      }
    });

    for (const key of Object.keys(count)) {
      if (count[key] === 1) {
        set.forEach(cell => {
          if (cell.possible.includes(parseInt(key, 10))) {
            cell.possible = cell.possible.filter(value => value === parseInt(key, 10));
          }
        });
      }
    }
  };

  const { columns, grids, rows } = splitCRM(cells);

  [
    ...rows,
    ...columns,
    ...grids, 
  ].forEach(set => {
    searchSet(set);
  });

  return possibleCreateUpdate(cells, rows);
};

const possibleTriplets = cells => {
  const searchSet = set => {
    const update = [ ...set ];
    const possibles = set.map(cell => cell.possible.join(""));
    const count = {};

    possibles.forEach(cell => {
      if (cell.length === 2) {
        count[cell] = count[cell] ? count[cell] + 1 : 1;
      }
    });

    for (const key of Object.keys(count)) {
      if (count[key] === 2) {
        update.forEach(cell => {
          if (cell.possible.length > 2) {
            const values = [ ...key ].map(value => parseInt(value, 10));

            cell.possible = cell.possible.filter(value => !values.includes(value));
          }
        });
      }
    }

    return update;
  };

  const { columns, grids, rows } = splitCRM(cells);

  [
    ...rows,
    ...columns,
    ...grids, 
  ].forEach(set => {
    searchSet(set);
  });

  return possibleCreateUpdate(cells, rows);
};

const possibleTwins = cells => {
  const searchSet = set => {
    const update = [ ...set ];
    const possibles = set.map(cell => cell.possible.join(""));
    const count = {};

    possibles.forEach(cell => {
      if (cell.length === 2) {
        count[cell] = count[cell] ? count[cell] + 1 : 1;
      }
    });

    for (const key of Object.keys(count)) {
      if (count[key] === 2) {
        update.forEach(cell => {
          if (cell.possible.length > 2) {
            const values = [ ...key ].map(value => parseInt(value, 10));

            cell.possible = cell.possible.filter(value => !values.includes(value));
          }
        });
      }
    }

    return update;
  };

  const { columns, grids, rows } = splitCRM(cells);

  [
    ...rows,
    ...columns,
    ...grids, 
  ].forEach(set => {
    searchSet(set);
  });

  return possibleCreateUpdate(cells, rows);
};

const setupCells = () => {
  const cells = [];

  for (let row = 1; row < 10; row++) {
    const rowArray = [];

    for (let column = 1; column < 10; column++) {
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

const splitCRM = cells => {
  /* eslint-disable array-element-newline */
  const rows = [ [], [], [], [], [], [], [], [], [] ];

  const columns = [ [], [], [], [], [], [], [], [], [] ];

  const grids = [ [], [], [], [], [], [], [], [], [] ];
  /* eslint-enable array-element-newline */

  cells.flat()
    .forEach(cell => {
      const { column, grid, row } = cell;
      const newCell = { ...cell };

      columns[column - 1].push(newCell);
      grids[grid - 1].push(newCell);
      rows[row - 1].push(newCell);
    });

  return {
    columns,
    grids,
    rows,
  };
};

const updateCellNotes = (key, cells, current) => {
  if (!allowCellUpdate(cells, current) || key === "backspace") {
    return null;
  }

  const { column, row } = current;
  const newValue = parseInt(key, 10);

  const update = [ ...cells ];
  let notes = update[row - 1][column - 1].notes;

  if (notes.includes(newValue)) {
    notes = notes.filter(item => item !== newValue);
    // console.log(notes.filter(item => item !== newValue));
  } else if (!notes.includes(newValue)) {
    notes.push(newValue);
  }

  update[row - 1][column - 1].notes = notes;

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
  update[row - 1][column - 1].notes = [];
  update[row - 1][column - 1].status = isMoveValid(cells, current, newValue) ? "" : "error";
  update[row - 1][column - 1].value = newValue;

  return update;
};

const App = () => {
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
    setCurrent(initialCurrentCell);
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

  const [
    cells,
    setCells, 
  ] = useState([]);

  const [
    current,
    setCurrent, 
  ] = useState(initialCurrentCell);

  const [
    mounted,
    setMounted, 
  ] = useState(false);

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

  useEffect(() => {
    if (!mounted) {
      const game = newGame(setupCells());
      const possibles = getPossibleValues(game);
      const updated = applyPossibleValues(game, possibles);

      setCells(updated);
      setMounted(true);
    }
  }, [ mounted ]);

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
