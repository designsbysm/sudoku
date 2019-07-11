import { CopyToClipboard } from "react-copy-to-clipboard";
import React from "react";

//components
import Cell from "./cell";

//assets
import "../styles/grid.scss";

const Grid = ({ cells, current, gameOtions, setCurrent }) => {
  const puzzle = cells
    .map(r => r.map(cell => cell.value || 0))
    .flat()
    .join("");

  const getClasses = () => {
    const classes = [ "grid" ];

    if (gameOtions.isComplete) {
      classes.push("success");
      // } else if (!gameOtions.hasSolution) {
      //   classes.push("error");
    }

    return classes.join(" ");
  };

  return (
    <>
      <div className={getClasses()}>
        {cells.map(r =>
          r.map(cell => (
            <Cell key={`${cell.column}${cell.row}`} props={cell} current={current} setCurrent={setCurrent} />
          )),
        )}
      </div>
      <div className="puzzle">
        <strong>Puzzle:</strong>&nbsp;&nbsp;
        <CopyToClipboard text={puzzle}>
          <span>{puzzle}</span>
        </CopyToClipboard>
      </div>
    </>
  );
};

export default Grid;
