import React, { useState } from "react";

//assets
import "../styles/cell.scss";

const Cell = ({ current, props, setCurrent }) => {
  const [
    hover,
    setHover, 
  ] = useState(false);

  const { column, grid, notes, predefined, row, solution, status, value } = props;

  const getClasses = () => {
    const classes = [ "cell" ];

    if (current.column === column && current.row === row) {
      classes.push("current");
    }

    if (predefined) {
      classes.push("predefined");
    } else if (status) {
      classes.push(status);
    }

    if (hover) {
      classes.push("hover");
    }

    return classes.join(" ");
  };

  return (
    <div
      className={getClasses()}
      onClick={() => {
        if (predefined) {
          return;
        }

        setCurrent({
          column,
          grid,
          row,
        });
      }}
      onMouseEnter={() => {
        setHover(!!solution);
      }}
      onMouseLeave={() => {
        setHover(!!solution);
      }}
    >
      <div className={`value ${value ? "show" : "hide"}`}>{hover ? solution : value}</div>
      <div className={`notes ${value ? "hide" : "show"}`}>
        <div className="item">{notes.includes(1) ? 1 : ""}</div>
        <div className="item">{notes.includes(2) ? 2 : ""}</div>
        <div className="item">{notes.includes(3) ? 3 : ""}</div>
        <div className="item">{notes.includes(4) ? 4 : ""}</div>
        <div className="item">{notes.includes(5) ? 5 : ""}</div>
        <div className="item">{notes.includes(6) ? 6 : ""}</div>
        <div className="item">{notes.includes(7) ? 7 : ""}</div>
        <div className="item">{notes.includes(8) ? 8 : ""}</div>
        <div className="item">{notes.includes(9) ? 9 : ""}</div>
      </div>
    </div>
  );
};

export default Cell;
