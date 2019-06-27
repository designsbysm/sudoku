import React from "react";

//components
import Cell from "./cell";

//assets
import "../styles/grid.scss";

const Grid = ({ cells, current, setCurrent }) => (
  <div className="grid">
    {cells.map(r => {
      return r.map(cell => {
        const { column, row } = cell;
        return <Cell key={`${column}${row}`} props={cell} current={current} setCurrent={setCurrent} />;
      });
    })}
  </div>
);

export default Grid;
