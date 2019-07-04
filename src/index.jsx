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

const getCellsSubset = (set, exclude) =>
  set.filter(cell => exclude.every(target => `${cell.row}${cell.column}` !== `${target.row}${target.column}`));

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

const getNakedDigits = (set, length, quanity) => {
  const keys = set.filter(cell => cell.possible.length === length)
    .map(cell => cell.possible.join(""));

  const count = {};
  keys.forEach(key => {
    count[key] = count[key] ? count[key] + 1 : 1;
  });

  const targets = [];
  for (const key of Object.keys(count)) {
    if (count[key] === quanity) {
      targets.push([ ...key ].map(digit => parseInt(digit, 10)));
    }
  }

  return targets;
};

const getPossibleSearchDigits = (set, min, max) => {
  const count = {};

  set.forEach(cell => {
    cell.possible.forEach(value => {
      count[value] = count[value] ? count[value] + 1 : 1;
    });
  });

  const digits = [];

  for (const key of Object.keys(count)) {
    // console.log(key,count[key],min,max);
    if (count[key] >= min && count[key] <= max) {
      digits.push(parseInt(key, 10));
    }
  }

  return digits;
};

const getPossibleSearchTriplets = digits => {
  const values = [];

  digits.forEach(digit1 => {
    digits.forEach(digit2 => {
      digits.forEach(digit3 => {
        if (digit1 !== digit2 && digit1 !== digit3 && digit2 !== digit3) {
          values.push([
            digit1,
            digit2,
            digit3, 
          ].sort());
        }
      });
    });
  });

  const used = {};

  const unique = values.filter(set => {
    const key = set.join("");

    if (!used[key]) {
      used[key] = true;

      return true;
    } else {
      return false;
    }
  });

  return unique;
};

const getPossibleSearchTwins = digits => {
  const values = [];

  digits.forEach(digit1 => {
    digits.forEach(digit2 => {
      if (digit1 !== digit2) {
        values.push([
          digit1,
          digit2, 
        ].sort());
      }
    });
  });

  const used = {};

  const unique = values.filter(set => {
    const key = set.join("");

    if (!used[key]) {
      used[key] = true;

      return true;
    } else {
      return false;
    }
  });

  return unique;
};

const getPossibleValues = cells => {
  const hashPossibles = grid => grid.map(r => r.map(cell => cell.possible.join(""))
    .join(""))
    .join("");

  const hasChanges = (before, after) => hashPossibles(before) !== hashPossibles(after);

  let possibles = cells.map(r => {
    return r.map(cell => {
      const { column, grid, row, value } = cell;

      /* eslint-disable array-element-newline */
      return {
        column,
        grid,
        possible: value ? [ value ] : [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
        row,
      };
      /* eslint-enable array-element-newline */
    });
  });

  let continueSearch = true;

  const pipeline = [
    possibleCRME,
    possibleHiddenSingles,
    possibleNakedTwins,
    possibleNakedTriplets,
    possibleHiddenTwins,
    possibleHiddenTriplets,
  ];

  const scores = {};

  while (continueSearch) {
    let changes = false;

    for (const fn of pipeline) {
      const key = fn.name.replace("possible", "");
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

  console.table(scores);

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
    /* eslint-disable array-element-newline */
    let test = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
    /* eslint-enable array-element-newline */

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

  if (cells[current.row - 1][current.column - 1].solution) {
    return valid && cells[current.row - 1][current.column - 1].solution === value;
  } else {
    return valid;
  }
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

const newGame = (cells, load) => {
  const update = [ ...cells ];

  /* eslint-disable array-element-newline */
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

  // easy
  let puzzle = [
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

  // medium
  // const puzzle = [
  //   [ 7, 6, 0, 1, 3, 0, 4, 5, 0 ],
  //   [ 0, 0, 0, 0, 0, 0, 0, 0, 3 ],
  //   [ 1, 0, 0, 9, 0, 0, 0, 2, 0 ],
  //   [ 2, 0, 5, 0, 0, 7, 0, 0, 0 ],
  //   [ 0, 4, 0, 8, 6, 9, 0, 7, 0 ],
  //   [ 0, 0, 0, 5, 0, 0, 1, 0, 9 ],
  //   [ 0, 1, 0, 0, 0, 4, 0, 0, 5 ],
  //   [ 9, 0, 0, 0, 0, 0, 0, 0, 0 ],
  //   [ 0, 7, 3, 0, 9, 5, 0, 6, 1 ],
  // ];

  // difficult
  // const puzzle = [
  //   [ 0, 0, 0, 0, 6, 0, 0, 2, 0 ],
  //   [ 0, 0, 0, 0, 0, 0, 0, 0, 7 ],
  //   [ 0, 0, 0, 1, 0, 4, 0, 0, 9 ],
  //   [ 0, 0, 4, 0, 0, 0, 9, 0, 5 ],
  //   [ 0, 5, 2, 0, 0, 6, 0, 7, 0 ],
  //   [ 9, 0, 7, 0, 0, 0, 6, 0, 0 ],
  //   [ 7, 0, 0, 6, 0, 3, 0, 0, 0 ],
  //   [ 6, 3, 0, 0, 0, 0, 0, 0, 0 ],
  //   [ 0, 9, 0, 0, 1, 0, 0, 0, 0 ],
  // ];

  // extreme
  // const puzzle = [
  //   [ 0, 0, 0, 0, 3, 0, 0, 0, 0 ],
  //   [ 0, 0, 0, 6, 0, 7, 0, 0, 9 ],
  //   [ 0, 0, 0, 9, 0, 0, 7, 3, 0 ],
  //   [ 0, 0, 0, 0, 0, 6, 0, 0, 4 ],
  //   [ 1, 8, 0, 4, 0, 5, 0, 2, 7 ],
  //   [ 7, 0, 0, 3, 0, 0, 0, 0, 0 ],
  //   [ 0, 7, 1, 0, 0, 9, 0, 0, 0 ],
  //   [ 2, 0, 0, 1, 0, 8, 0, 0, 0 ],
  //   [ 0, 0, 0, 0, 7, 0, 0, 0, 0 ],
  // ];

  // const puzzle = [
  //   [ 0, 0, 0, 3, 4, 0, 0, 0, 9 ],
  //   [ 2, 0, 0, 0, 7, 0, 0, 0, 0 ],
  //   [ 0, 8, 0, 0, 0, 6, 0, 4, 0 ],
  //   [ 0, 9, 7, 0, 0, 0, 2, 0, 0 ],
  //   [ 0, 0, 0, 0, 8, 0, 5, 0, 0 ],
  //   [ 0, 0, 0, 7, 3, 0, 0, 0, 4 ],
  //   [ 0, 4, 0, 0, 0, 1, 0, 8, 0 ],
  //   [ 9, 6, 0, 0, 0, 0, 0, 0, 5 ],
  //   [ 0, 0, 0, 0, 0, 0, 0, 3, 0 ],
  // ];

  // const puzzle = [
  //   [ 0, 0, 0, 0, 0, 1, 0, 3, 0 ],
  //   [ 2, 3, 1, 0, 9, 0, 0, 0, 0 ],
  //   [ 0, 6, 5, 0, 0, 3, 1, 0, 0 ],
  //   [ 6, 7, 8, 9, 2, 4, 3, 0, 0 ],
  //   [ 1, 0, 3, 0, 5, 0, 0, 0, 6 ],
  //   [ 0, 0, 0, 1, 3, 6, 7, 0, 0 ],
  //   [ 0, 0, 9, 3, 6, 0, 5, 7, 0 ],
  //   [ 0, 0, 6, 0, 1, 9, 8, 4, 3 ],
  //   [ 3, 0, 0, 0, 0, 0, 0, 0, 0 ],
  // ];
  /* eslint-enable array-element-newline */

  if (load) {
    let index = 1;
    let row = [];
    puzzle = [];

    [ ...load ].forEach(digit => {
      row.push(parseInt(digit, 10));

      index++;
      if (index > 9) {
        puzzle.push(row);
        row = [];
        index = 1;
      }
    });
  }

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

const possibleHiddenSingles = cells => {
  const searchSet = set => {
    const count = {};

    set.forEach(cell => {
      cell.possible.forEach(value => {
        count[value] = count[value] ? count[value] + 1 : 1;
      });
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

const possibleHiddenTriplets = cells => {
  const getTwins = (set, triplets, target, quanity) => {
    const subset = getCellsSubset(set, triplets);

    const twins = getPossibleSearchTwins(target)
      .map(values => {
        return subset.filter(cell => cell.possible.includes(values[0]) && cell.possible.includes(values[1]));
      })
      .flat();

    if (twins.length === quanity) {
      if (
        getCellsSubset(set, [
          ...triplets,
          ...twins, 
        ])
          .filter(cell => cell.possible.some(digit => target.includes(digit)))
          .length === 0
      ) {
        return twins;
      } else {
        return [];
      }
    } else {
      return [];
    }
  };

  const searchSet = set => {
    const digits = getPossibleSearchDigits(set, 2, 3);
    const search = getPossibleSearchTriplets(digits);

    search.forEach(target => {
      const triplets = set.filter(
        cell =>
          cell.possible.includes(target[0]) && cell.possible.includes(target[1]) && cell.possible.includes(target[2]),
      );

      if (triplets.length === 3) {
        removePossibleSearch(triplets, target);
      } else if (triplets.length === 2) {
        const twins = getTwins(set, triplets, target, 1);

        if ([
          ...triplets,
          ...twins, 
        ].length === 3) {
          removePossibleSearch([
            ...triplets,
            ...twins, 
          ], target);
        }
      } else if (triplets.length === 1) {
        const twins = getTwins(set, triplets, target, 2);

        if ([
          ...triplets,
          ...twins, 
        ].length === 3) {
          removePossibleSearch([
            ...triplets,
            ...twins, 
          ], target);
        }
      }
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

const possibleHiddenTwins = cells => {
  const searchSet = set => {
    const digits = getPossibleSearchDigits(set, 2, 2);
    const search = getPossibleSearchTwins(digits);

    search.forEach(target => {
      const twins = set.filter(cell => cell.possible.includes(target[0]) && cell.possible.includes(target[1]));

      if (twins.length === 2) {
        removePossibleSearch(twins, target);
      }
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

const possibleNakedTriplets = cells => {
  const searchSet = set => {
    let triplets = getNakedDigits(set, 3, 3);
    if (triplets.length > 0) {
      triplets.forEach(target => updateNakedPossibles(set, target));
    }

    triplets = getNakedDigits(set, 3, 2);
    if (triplets.length > 0) {
      triplets.forEach(triplet => {
        const twins = getNakedDigits(set, 2, 1);
        const valid = twins.filter(twin => twin.every(digit => triplet.includes(digit)));

        if (valid.length === 1) {
          updateNakedPossibles(set, triplet);
        }
      });
    }

    triplets = getNakedDigits(set, 3, 1);
    if (triplets.length > 0) {
      triplets.forEach(triplet => {
        const twins = getNakedDigits(set, 2, 1);
        const valid = twins.filter(twin => twin.every(digit => triplet.includes(digit)));

        if (valid.length === 2) {
          updateNakedPossibles(set, triplet);
        }
      });
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

const possibleNakedTwins = cells => {
  const searchSet = set => {
    const targets = getNakedDigits(set, 2, 2);
    targets.forEach(target => updateNakedPossibles(set, target));
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

const removePossibleSearch = (cells, target) => {
  cells.forEach(cell => {
    cell.possible = cell.possible.filter(digit => target.includes(digit));
  });
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

const updateNakedPossibles = (set, target) => {
  set
    .filter(cell => cell.possible.some(digit => !target.includes(digit)))
    .forEach(cell => {
      cell.possible = cell.possible.filter(digit => !target.includes(digit));
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
    const game = newGame(setupCells(), puzzle);

    const possibles = getPossibleValues(game);
    const updated = applyPossibleValues(game, possibles);

    setCells(updated);
  };

  const updateCell = key => {
    let update = null;

    if (penMode) {
      update = updateCellValue(key, cells, current);

      const possibles = getPossibleValues(update);
      update = applyPossibleValues(update, possibles);

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
      let query = "";

      if (window.location.search && window.location.search.startsWith("?")) {
        query = window.location.search.replace("?", "");
      }

      startGame(query);
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
          <div onClick={() => startGame()} className="button">
            <FontAwesomeIcon icon={faPlus} size="2x" />
            New Game
          </div>
        </div>
      </aside>
    </section>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
