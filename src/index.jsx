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

const countPossibles = cells => {
  const count = {};

  cells.forEach(cell => {
    cell.possible.forEach(value => {
      count[value] = count[value] ? count[value] + 1 : 1;
    });
  });

  return count;
};

const initialCurrentCell = {
  column: -1,
  grid: -1,
  row: -1,
};

const getCleanCopyOfCells = cells =>
  cells.map(unit =>
    unit.map(cell => {
      return { ...cell };
    }),
  );

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

const getPossibleSearchDigits = (set, min, max) => {
  const count = countPossibles(set);
  const digits = [];

  for (const key of Object.keys(count)) {
    if (count[key] > 1) {
      if (count[key] >= min && count[key] <= max) {
        digits.push(parseInt(key, 10));
      }
    }
  }

  return digits;
};

const getPossibleValues = (cells, pipeline) => {
  const hashPossibles = grid => grid.map(r => r.map(cell => cell.possible.join(""))
    .join(""))
    .join("");

  const hasChanges = (before, after) => hashPossibles(before) !== hashPossibles(after);

  let possibles = cells.map(r => {
    return r.map(cell => {
      const { column, grid, notes, row, value } = cell;

      /* eslint-disable array-element-newline */
      const possible = notes.length > 0 ? notes : [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
      /* eslint-enable array-element-newline */

      return {
        column,
        grid,
        possible: value ? [ value ] : possible,
        row,
      };
    });
  });

  let continueSearch = true;
  const scores = {};

  while (continueSearch) {
    let changes = false;

    for (const fn of pipeline) {
      const key = fn.name.replace("possible", "");

      // console.time(key);
      const result = fn(possibles);
      changes = hasChanges(possibles, result);
      // console.timeEnd(key);

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

  console.table(scores);

  return possibles;
};

const getTargetDigits = (digits, length) => {
  const start = parseInt(
    Array(length)
      .fill(1)
      .join(""),
    10,
  );

  const end = parseInt(
    Array(length)
      .fill(9)
      .join(""),
    10,
  );

  const unique = new Set();
  const stringDitgits = digits.map(number => number.toString());

  for (let x = start + 1; x < end; x++) {
    const test = [ ...x.toString() ];

    if (!/(.).*\1/.test(x) && test.every(number => stringDitgits.includes(number))) {
      unique.add(test.sort()
        .join(""));
    }
  }

  return [ ...unique ].map(test => [ ...test ].map(number => parseInt(number, 10)));
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

  const solution = cells.map(r => {
    return r.map(cell => cell.value || 0);
  });

  return isSolutionValid(solution);
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

  if (cells[current.row - 1][current.column - 1].solution) {
    return valid && cells[current.row - 1][current.column - 1].solution === value;
    // } else if (cells[current.row - 1][current.column - 1].notes.length === 1) {
    // return valid && cells[current.row - 1][current.column - 1].notes[0] === value;
  } else {
    return valid;
  }
};

const isMoveStillValid = cells => {
  if (!cells) {
    return null;
  }

  const update = getCleanCopyOfCells(cells);

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

const isSolutionValid = values => {
  if (!values) {
    return false;
  }

  const rows = values;
  /* eslint-disable array-element-newline */
  const columns = [ [], [], [], [], [], [], [], [], [] ];
  /* eslint-enable array-element-newline */

  values.forEach(row => {
    row.forEach((cell, index) => {
      columns[index].push(cell);
    });
  });

  let valid = true;
  [
    ...rows,
    ...columns, 
  ].forEach(r => {
    /* eslint-disable array-element-newline */
    let test = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
    /* eslint-enable array-element-newline */

    r.forEach(cell => {
      test = test.filter(value => value !== cell);
    });

    if (test.length > 0) {
      valid = false;
    }
  });

  return valid;
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

const newGame = importGrid => {
  const cells = setupCells();

  let solution = [];
  let puzzle = [];

  if (importGrid) {
    let index = 1;
    let row = [];
    puzzle = [];

    [ ...importGrid ].forEach(digit => {
      row.push(parseInt(digit, 10));

      index++;
      if (index > 9) {
        puzzle.push(row);
        row = [];
        index = 1;
      }
    });
  } else {
    console.log("generate puzzle");
  }

  for (let row = 1; row < 10; row++) {
    for (let column = 1; column < 10; column++) {
      if (puzzle[row - 1][column - 1]) {
        cells[row - 1][column - 1].predefined = true;
        cells[row - 1][column - 1].value = puzzle[row - 1][column - 1];
      }
    }
  }

  if (solution.length === 0) {
    const possibles = getPossibleValues(cells, possiblePipeline);
    solution = possibles.map(row => {
      return row.map(cell => {
        if (cell.possible.length > 1) {
          return 0;
        }

        return cell.possible[0];
      });
    });
  }

  if (!isSolutionValid(solution)) {
    // TODO: warn user
    console.error("no solution found", solution);
  } else {
    // add solution to cells
    for (let row = 1; row < 10; row++) {
      for (let column = 1; column < 10; column++) {
        cells[row - 1][column - 1].solution = solution[row - 1][column - 1];
      }
    }
  }

  return cells;
};

const possibleClaimingPairs = cells => {
  const searchSet = (set, grids) => {
    const digits = getPossibleSearchDigits(set, 2, 3);

    const result = digits.map(digit => {
      const subset = set.filter(cell => cell.possible.includes(digit));

      if (subset.every(cell => cell.grid === subset[0].grid)) {
        let id = null;
        let direction = null;

        if (set.every(cell => cell.row === set[0].row)) {
          id = set[0].row;
          direction = "row";
        } else if (set.every(cell => cell.column === set[0].column)) {
          id = set[0].column;
          direction = "column";
        }

        return {
          digit,
          grid: subset[0].grid,
          id,
          set: direction,
        };
      } else {
        return null;
      }
    });

    result.forEach(found => {
      if (!found) {
        return;
      }

      const search = grids[found.grid - 1];

      search
        .filter(cell => cell[found.set] !== found.id)
        .forEach(cell => {
          cell.possible = cell.possible.filter(digit => digit !== found.digit);
        });
    });
  };

  const { columns, grids, rows } = splitRCM(cells);

  [
    ...rows,
    ...columns, 
  ].forEach(set => {
    searchSet(set, grids);
  });

  return possibleCreateUpdate(cells, rows);
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

const poccessCellPossibleFN = (cells, fn, ...args) => {
  const { columns, grids, rows } = splitRCM(cells);

  [
    ...rows,
    ...columns,
    ...grids, 
  ].forEach(set => {
    fn(set, ...args);
  });

  return possibleCreateUpdate(cells, rows);
};

const possibleHiddenSingles = cells => {
  const searchSet = set => {
    const count = countPossibles(set);

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

  return poccessCellPossibleFN(cells, searchSet);
};

const possibleHiddenQuads = cells => {
  return poccessCellPossibleFN(cells, updateHiddenPossibles, 4);
};

const possibleHiddenTriplets = cells => {
  return poccessCellPossibleFN(cells, updateHiddenPossibles, 3);
};

const possibleHiddenTwins = cells => {
  return poccessCellPossibleFN(cells, updateHiddenPossibles, 2);
};

const possibleNakedSingles = cells => {
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

  return poccessCellPossibleFN(cells, searchSet);
};

const possibleNakedQuads = cells => {
  return poccessCellPossibleFN(cells, updateNakedPossibles, 4);
};

const possibleNakedTriplets = cells => {
  return poccessCellPossibleFN(cells, updateNakedPossibles, 3);
};

const possibleNakedTwins = cells => {
  return poccessCellPossibleFN(cells, updateNakedPossibles, 2);
};

const possiblePointingPairs = cells => {
  const searchSet = (set, rows, columns) => {
    const digits = getPossibleSearchDigits(set, 2, 3);

    const result = digits.map(digit => {
      const subset = set.filter(cell => cell.possible.includes(digit));

      if (subset.every(cell => cell.row === subset[0].row)) {
        return {
          digit,
          grid: set[0].grid,
          id: subset[0].row,
          set: "row",
        };
      } else if (subset.every(cell => cell.column === subset[0].column)) {
        return {
          digit,
          grid: set[0].grid,
          id: subset[0].column,
          set: "column",
        };
      } else {
        return null;
      }
    });

    result.forEach(found => {
      if (!found) {
        return;
      }

      let search = [];

      if (found.set === "row") {
        search = rows[found.id - 1];
      } else if (found.set === "column") {
        search = columns[found.id - 1];
      }

      search
        .filter(cell => cell.grid !== found.grid)
        .forEach(cell => {
          cell.possible = cell.possible.filter(digit => digit !== found.digit);
        });
    });
  };

  const { columns, grids, rows } = splitRCM(cells);

  [ ...grids ].forEach(set => {
    searchSet(set, rows, columns);
  });

  return possibleCreateUpdate(cells, rows);
};

const possibleXWing = cells => {
  const searchSet = (set, update) => {
    const found = set
      .map(unit => {
        const digits = getPossibleSearchDigits(unit, 2, 2);

        return digits.map(digit => {
          const search = {
            id: [],
            type: null,
          };

          const exclude = {
            id: null,
            type: null,
          };

          if (
            unit.every(cell => {
              return cell.row === unit[0].row;
            })
          ) {
            search.type = "column";
            exclude.type = "row";
          } else {
            search.type = "row";
            exclude.type = "column";
          }

          const subset = unit.filter(cell => cell.possible.includes(digit));

          search.id = [
            subset[0][search.type],
            subset[1][search.type], 
          ];
          exclude.id = subset[0][exclude.type];

          return {
            digit,
            exclude,
            key: `${digit}${exclude.type}${subset.map(cell => cell[search.type])
              .join("")}`,
            search,
          };
        });
      })
      .flat();

    const condensed = {};
    found.forEach(result => {
      const { key } = result;

      if (!condensed[key]) {
        condensed[key] = [];
      }
      condensed[key].push(result);
    });

    const xwings = [];
    for (const key of Object.keys(condensed)) {
      if (condensed[key].length === 2) {
        xwings.push(
          condensed[key].reduce((current, accum) => {
            if (!current) {
              return accum;
            }

            const combined = {
              ...current,
            };
            combined.exclude.id = [
              current.exclude.id,
              accum.exclude.id, 
            ];

            return combined;
          }, null),
        );
      }
    }

    xwings.forEach(xwing => {
      update
        .filter((cell, index) => xwing.search.id.includes(index + 1))
        .map(units => units.filter(cell => !xwing.exclude.id.includes(cell[xwing.exclude.type])))
        .flat()
        .forEach(cell => {
          cell.possible = cell.possible.filter(digit => digit !== xwing.digit);
        });
    });
  };

  const { columns, rows } = splitRCM(cells);

  searchSet(rows, columns);
  searchSet(columns, rows);

  return possibleCreateUpdate(cells, rows);
};

const possiblePipeline = [
  possibleNakedSingles,
  possibleHiddenSingles,
  possibleNakedTwins,
  possibleHiddenTwins,
  possibleNakedTriplets,
  possibleHiddenTriplets,
  possibleNakedQuads,
  possibleHiddenQuads,
  possiblePointingPairs,
  possibleClaimingPairs,
  possibleXWing,
];

const removeRCMNote = (key, cells, current) => {
  const digit = parseInt(key, 10);
  const update = getCleanCopyOfCells(cells);

  update.forEach(r => {
    r.forEach(cell => {
      if (cell.column === current.column || cell.grid === current.grid || cell.row === current.row)
        cell.notes = cell.notes.filter(value => value !== digit);
    });
  });

  return update;
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

const splitRCM = cells => {
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

  const update = getCleanCopyOfCells(cells);
  update[row - 1][column - 1].notes = [];
  update[row - 1][column - 1].status = isMoveValid(cells, current, newValue) ? "" : "error";
  update[row - 1][column - 1].value = newValue;

  return update;
};

const updateHiddenPossibles = (set, length) => {
  const digits = getPossibleSearchDigits(set, 1, length);
  const targets = getTargetDigits(digits, length);

  targets.forEach(target => {
    const valid = set.filter(cell => cell.possible.some(digit => target.includes(digit)));

    if (valid.length === length) {
      valid.forEach(cell => {
        cell.possible = cell.possible.filter(digit => target.includes(digit));
      });

      // console.log(target, set);
    }
  });
};

const updateNakedPossibles = (set, length) => {
  const digits = getPossibleSearchDigits(set, 1, 9);
  const targets = getTargetDigits(digits, length);

  targets.forEach(target => {
    const valid = set.filter(cell => cell.possible.every(digit => target.includes(digit)));

    if (valid.length === length) {
      set
        .filter(cell => cell.possible.some(digit => !target.includes(digit)))
        .forEach(cell => {
          cell.possible = cell.possible.filter(digit => !target.includes(digit));
        });

      // console.log(target, set);
    }
  });
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

  const startGame = puzzle => {
    const game = newGame(puzzle);
    const possibles = getPossibleValues(game, [ possibleNakedSingles ]);
    const updated = applyPossibleValues(game, possibles);

    setCells(updated);
  };

  const updateCell = key => {
    let update = null;

    if (penMode) {
      update = updateCellValue(key, cells, current);
      update = removeRCMNote(key, update, current);
      update = isMoveStillValid(update);

      const possibles = getPossibleValues(update, possiblePipeline);
      const solution = possibles.map(row => {
        return row.map(cell => {
          if (cell.possible.length > 1) {
            return 0;
          }

          return cell.possible[0];
        });
      });

      console.log("complete:", isGameComplete(update), "solution:", isSolutionValid(solution));
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
    importPuzzle,
    setImportPuzzle, 
  ] = useState("");

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
      let puzzle = "";

      if (window.location.search && window.location.search.startsWith("?")) {
        puzzle = window.location.search.replace("?", "");

        if (puzzle.length !== 81) {
          return;
        }

        setImportPuzzle(puzzle);
      }

      startGame(puzzle);
      setMounted(true);
    }
  }, [ mounted ]);

  return (
    <section className="content">
      <main>
        <Grid cells={cells} current={current} setCurrent={setCurrent} />
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
          <div onClick={() => startGame(importPuzzle)} className="button">
            <FontAwesomeIcon icon={faPlus} size="2x" />
            New Game
          </div>
        </div>
      </aside>
    </section>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
