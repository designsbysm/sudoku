import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

// components
import Grid from "./components/grid";

// assets
import "./styles/index.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEraser, faLightbulb, faPenFancy, faPencil, faUndo } from "@fortawesome/pro-light-svg-icons";

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
  const update = getCleanCopyOfCells(cells);

  for (let row = 1; row < 10; row++) {
    for (let column = 1; column < 10; column++) {
      update[row - 1][column - 1].notes = possibles[row - 1][column - 1].possible;
    }
  }

  return update;
};

const convertCellsToPossibles = cells =>
  cells.map(r => {
    return r.map(cell => {
      const { column, grid, row, value } = cell;

      /* eslint-disable array-element-newline */
      return {
        column,
        grid,
        possible: value ? [value] : [1, 2, 3, 4, 5, 6, 7, 8, 9],
        row,
      };
      /* eslint-enable array-element-newline */
    });
  });

const countPossibles = cells => {
  const count = {};

  cells.forEach(cell => {
    cell.possible.forEach(value => {
      count[value] = count[value] ? count[value] + 1 : 1;
    });
  });

  return count;
};

const generateNewPuzzle = (setup, level) => {
  const cellsToEmpty = (min, max) => parseInt(randomNumber(min, max) / 2, 10);

  const randomNumber = (min, max) => parseInt((max - min + 1) * Math.random(), 10) + min;

  const possibles = convertCellsToPossibles(setup);
  const grid = possibleBruteForce(possibles);

  const solution = getSolutionFromPossibles(grid);
  // const puzzle = getSolutionFromPossibles(possibles);
  const puzzle = solution.map(unit => {
    return [...unit];
  });

  let emptyLevel = 0;

  switch (level) {
    case "extreme":
      emptyLevel = cellsToEmpty(54, 58);
      break;

    case "difficult":
      emptyLevel = cellsToEmpty(50, 53);
      break;

    case "medium":
      emptyLevel = cellsToEmpty(46, 49);
      break;

    default:
      emptyLevel = cellsToEmpty(40, 45);
  }

  const empty = {};

  for (let index = 0; index < emptyLevel; index++) {
    // const toEmpty = [];
    let emptySearch = true;

    while (emptySearch) {
      const row = randomNumber(1, 9);
      const column = randomNumber(1, 9);

      // console.log(empty[`${row}${column}`]);

      if (!empty[`${row}${column}`]) {
        //   break;
        // } else {
        emptySearch = false;

        const mirrorRow = 10 - row;
        const mirrorColumn = 10 - column;

        empty[`${row}${column}`] = true;
        empty[`${mirrorRow}${mirrorColumn}`] = true;

        puzzle[row - 1][column - 1] = 0;
        puzzle[mirrorRow - 1][mirrorColumn - 1] = 0;
      }
    }

    // console.log(row, column);
    // console.log(10 - row, 10 - column);

    // console.log(puzzle, puzzle[row - 1][column - 1], puzzle[mirrorRow - 1][mirrorColumn - 1]);

    // puzzle[row-1][column-1].value=0;
  }

  const cells = setupCells();

  puzzle.forEach((r, row) =>
    r.forEach((c, column) => {
      // console.log(row, column);

      cells[row][column].value = c;
    }),
  );

  // console.log(cells);
  // const zeros = puzzle
  //   .flat()
  //   .map(digit => {
  //     if (digit === 0) {
  //       return 1;
  //     } else {
  //       return 0;
  //     }
  //   })
  //   .reduce((current, accum) => {
  //     return accum + current;
  //   });

  // console.log(zeros);
  const possible = getPossibleValues(cells, possiblePipeline);
  const s = getSolutionFromPossibles(possible);
  const least = getCellsByLeastPossibles(possible);

  // console.log(isSolutionValid(s), least);

  return { puzzle, solution };
};

const getCellsByLeastPossibles = possibles => {
  const byCount = {};
  const sorted = [];

  possibles
    .flat()
    .filter(cell => cell.possible.length > 1)
    .forEach(cell => {
      if (!byCount[cell.possible.length]) {
        byCount[cell.possible.length] = [];
      }

      byCount[cell.possible.length].push(cell);
    });

  for (const key of Object.keys(byCount)) {
    sorted.push(...byCount[key]);
  }

  return sorted;
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
  // console.time("getPossibleValues");

  let continueSearch = true;
  let possibles = convertCellsToPossibles(cells);
  const scores = {};

  while (continueSearch) {
    let changes = false;

    for (const fn of pipeline) {
      const key = fn.name.replace("possible", "");

      // console.time(key);
      const result = fn(possibles);
      changes = hasPossibleChanges(possibles, result);
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

  // console.timeEnd("getPossibleValues");
  // console.table(scores);

  return possibles;
};

const getSolutionFromPossibles = cells =>
  cells.map(row => {
    return row.map(cell => {
      if (cell.possible.length > 1) {
        return 0;
      }

      return cell.possible[0];
    });
  });

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
    const test = [...x.toString()];

    if (!/(.).*\1/.test(x) && test.every(number => stringDitgits.includes(number))) {
      unique.add(test.sort()
        .join(""));
    }
  }

  return [...unique].map(test => [...test].map(number => parseInt(number, 10)));
};

const hasPossibleChanges = (before, after) => {
  if (!before || !after) {
    return null;
  }

  const hashPossibles = grid => grid.map(r => r.map(cell => cell.possible.join(""))
    .join(""))
    .join("");

  return hashPossibles(before) !== hashPossibles(after);
};

const hintCellValue = (cells, current) => {
  const { column, row } = current;
  if (column === -1 && row === -1) {
    return cells;
  }

  const update = [...cells];

  if (update[row - 1][column - 1].solution) {
    update[row - 1][column - 1].predefined = true;
    update[row - 1][column - 1].status = "";
    update[row - 1][column - 1].value = update[row - 1][column - 1].solution;
  }

  return update;
};

const initialCurrentCell = {
  column: -1,
  grid: -1,
  row: -1,
};

const initialGameOptions = {
  hasSolution: true,
  isComplete: false,
  level: "easy",
  mounted: false,
  penMode: true,
  puzzle: "",
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

// const isSolutionLogical = values => {
//   if (!values) {
//     return false;
//   }

//   /* eslint-disable array-element-newline */
//   const rows = values;
//   const columns = [ [], [], [], [], [], [], [], [], [] ];
//   /* eslint-enable array-element-newline */

//   values.forEach(row => {
//     row.forEach((cell, index) => {
//       columns[index].push(cell);
//     });
//   });

//   let valid = true;
//   [
//     ...rows,
//     ...columns,
//   ]
//     .map(unit => unit.filter(digit => digit !== 0))
//     .map(unit => unit.join(""))
//     .forEach(unit => {
//       if (!valid) {
//         return;
//       } else if (/(.).*\1/.test(unit)) {
//         valid = false;
//       }
//     });

//   return valid;
// };

const isSolutionValid = values => {
  if (!values) {
    return false;
  }

  /* eslint-disable array-element-newline */
  const rows = values;
  const columns = [[], [], [], [], [], [], [], [], []];
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
  ].forEach(unit => {
    if (!valid) {
      return;
    }

    /* eslint-disable array-element-newline */
    let test = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    /* eslint-enable array-element-newline */

    unit.forEach(cell => {
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

const newGame = (importGrid, level) => {
  const cells = setupCells();

  let solution = [];
  let puzzle = [];

  if (importGrid) {
    /* eslint-disable array-element-newline */
    puzzle = [[], [], [], [], [], [], [], [], []];
    /* eslint-enable array-element-newline */

    const puzzleCells = getCleanCopyOfCells(cells);
    let column = 0;
    let row = 0;

    [...importGrid].forEach(digit => {
      const value = parseInt(digit, 10) || 0;
      puzzle[row][column] = value;
      if (value) {
        puzzleCells[row][column].value = value;
      }

      column++;
      if (column > 8) {
        column = 0;
        row++;
      }
    });

    const possibles = getPossibleValues(puzzleCells, possiblePipeline);
    solution = getSolutionFromPossibles(possibles);
  } else {
    const newPuzzle = generateNewPuzzle(cells, level);

    puzzle = newPuzzle.puzzle;
    solution = newPuzzle.solution;

    // console.log(solution, puzzle, cells);
  }

  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 9; column++) {
      if (puzzle[row][column]) {
        cells[row][column].predefined = true;
        cells[row][column].value = puzzle[row][column];
      }

      cells[row][column].solution = solution[row][column];
    }
  }

  if (!isSolutionValid(solution)) {
    // TODO: warn user
    console.error("no solution found", solution);
  }

  return cells;
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

const possibleBruteForce = (cells, depth = 0) => {
  const reducePossibles = possibles => {
    let result = getCleanCopyOfCells(possibles);

    for (const fn of [
      possibleNakedSingles,
      possibleHiddenSingles,
      possibleNakedTwins,
      possibleNakedTriplets,
    ]) {
      result = fn(result);
    }

    if (hasPossibleChanges(possibles, result)) {
      result = reducePossibles(result);
    }

    return result;
  };

  let solutionFound = false;
  let update = getCleanCopyOfCells(cells);
  const leastPossibles = getCellsByLeastPossibles(cells);

  if (leastPossibles.length > 1) {
    for (let index = 0; index < leastPossibles.length; index++) {
      const cell = leastPossibles[index];
      const possibleDigits = shuffleArray(cell.possible);

      for (let digit = 0; digit < possibleDigits.length; digit++) {
        update[cell.row - 1][cell.column - 1].possible = [possibleDigits[digit]];

        const reduced = reducePossibles(update);
        // const solution = getSolutionFromPossibles(reduced);

        // if (!isSolutionLogical(solution)) {
        //   return null;
        // }

        const result = possibleBruteForce(reduced, depth + 1);

        if (result) {
          solutionFound = true;
          update = result;

          break;
        }
      }

      if (solutionFound) {
        break;
        // } else {
        // update = getCleanCopyOfCells(cells);
      }
    }
  } else if (depth > 0) {
    const solution = getSolutionFromPossibles(update);

    if (isSolutionValid(solution)) {
      return update;
    } else {
      return null;
    }
  }

  const solution = getSolutionFromPossibles(update);
  if (!update || !isSolutionValid(solution)) {
    if (depth > 0) {
      return null;
    } else {
      return cells;
    }
  }

  return update;
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

  [...grids].forEach(set => {
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
  // possibleBruteForce,
];

// const removeRCMNote = (key, cells, current) => {
//   const digit = parseInt(key, 10);
//   const update = getCleanCopyOfCells(cells);

//   update.forEach(r => {
//     r.forEach(cell => {
//       if (cell.column === current.column || cell.grid === current.grid || cell.row === current.row)
//         cell.notes = cell.notes.filter(value => value !== digit);
//     });
//   });

//   return update;
// };

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

const shuffleArray = original => {
  const shuffled = [...original];
  let counter = original.length;
  let temp;
  let index;

  while (counter > 0) {
    // pick a random element
    index = Math.floor(Math.random() * counter);
    counter--;

    // and swap the last element with it
    temp = shuffled[counter];
    shuffled[counter] = shuffled[index];
    shuffled[index] = temp;
  }

  return shuffled;
};

const splitRCM = cells => {
  /* eslint-disable array-element-newline */
  const rows = [[], [], [], [], [], [], [], [], []];

  const columns = [[], [], [], [], [], [], [], [], []];

  const grids = [[], [], [], [], [], [], [], [], []];
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

  const update = getCleanCopyOfCells(cells);
  let notes = update[row - 1][column - 1].notes;

  if (notes.includes(newValue)) {
    notes = notes.filter(item => item !== newValue);
  } else if (!notes.includes(newValue)) {
    notes = [
      ...notes,
      newValue,
    ];
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
        const { column, row } = currentCell;
        const newPosition = moveCurrent(key, column, row);

        if (newPosition) {
          setCurrentCell(newPosition);
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
        hintCell(cells, currentCell);
        break;

      case "n":
      case "N":
        updateGameOptions({
          penMode: !gameOptions.penMode,
        });
        break;

      case "u":
      case "U":
        undoMove();
        break;

      default:
    }
  };

  const hintCell = () => {
    let update = hintCellValue(cells, currentCell);

    // const key = update[currentCell.row - 1][currentCell.column - 1].solution;
    // update = removeRCMNote(key, update, currentCell);

    const possibles = getPossibleValues(update, possiblePipeline);
    update = applyPossibleValues(update, possibles);

    // leastPossibles()

    setCells(update);
  };

  const resetCurrent = () => {
    setCurrentCell(initialCurrentCell);
  };

  const startGame = puzzle => {
    let game = newGame(puzzle, gameOptions.level);

    // const possibles = getPossibleValues(game, [ possibleNakedSingles ]);
    const possibles = getPossibleValues(game, possiblePipeline);
    game = applyPossibleValues(game, possibles);

    setCells(game);
  };

  const updateCell = key => {
    if (
      currentCell.row === -1 ||
      currentCell.column === -1 ||
      cells[currentCell.row - 1][currentCell.column - 1].predefined
    ) {
      return;
    }

    let update = null;

    if (gameOptions.penMode) {
      update = updateCellValue(key, cells, currentCell);
      update = isMoveStillValid(update);

      // update = removeRCMNote(key, update, currentCell);
      const possibles = getPossibleValues(update, possiblePipeline);
      update = applyPossibleValues(update, possibles);

      updateGameOptions({
        isComplete: isGameComplete(update),
      });
    } else {
      update = updateCellNotes(key, cells, currentCell);
    }

    if (!update) {
      return;
    }

    setMoveHistory(previous => {
      return [
        ...previous,
        getCleanCopyOfCells(cells),
      ];
    });
    setCells(update);
  };

  const updateGameOptions = setting => {
    setGameOptions(previous => {
      return {
        ...previous,
        ...setting,
      };
    });
  };

  const undoMove = () => {
    if (moveHistory.length === 0) {
      // console.log("no more moves");
      return;
    }

    const moves = [...moveHistory];
    const last = moves.pop();

    setCells(last);
    setMoveHistory(moves);
  };

  const [
    gameOptions,
    setGameOptions,
  ] = useState(initialGameOptions);

  const [
    cells,
    setCells,
  ] = useState([]);

  const [
    currentCell,
    setCurrentCell,
  ] = useState(initialCurrentCell);

  const [
    moveHistory,
    setMoveHistory,
  ] = useState([]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  useEffect(() => {
    if (!gameOptions.mounted) {
      let puzzle = "";

      if (window.location.search && window.location.search.startsWith("?")) {
        puzzle = window.location.search.replace("?", "");

        if (puzzle.length !== 81) {
          return;
        }

        updateGameOptions({
          puzzle,
        });
      }

      startGame(puzzle);
      updateGameOptions({
        mounted: true,
      });
    }
  });

  return (
    <section className="content">
      <main>
        <Grid cells={cells} current={currentCell} gameOtions={gameOptions} setCurrent={setCurrentCell} />
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
          <div
            onClick={() =>
              updateGameOptions({
                penMode: !gameOptions.penMode,
              })
            }
            className="button"
          >
            <FontAwesomeIcon icon={gameOptions.penMode ? faPenFancy : faPencil} size="2x" />
            {gameOptions.penMode ? "Pen" : "Pencil"}
          </div>
          <div onClick={() => updateCell(0)} className="button">
            <FontAwesomeIcon icon={faEraser} size="2x" />
            Delete
          </div>
          <div onClick={() => hintCell(cells, currentCell)} className="button">
            <FontAwesomeIcon icon={faLightbulb} size="2x" />
            Hint
          </div>
          <div onClick={() => undoMove()} className="button">
            <FontAwesomeIcon icon={faUndo} size="2x" />
            Undo
          </div>
        </div>
      </aside>
    </section>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
