import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./inputDialogComp.css";

const InputDialogComp = ({ value, title, callback }) => {
  const [inputVal, setInputVal] = useState(value);

  return (
    <Styled styles={styles}>
      <div className="input-dialog-comp">
        <div className="input-dialog-comp-content">
          <div className="content-title">{title}</div>
          <input
            className="content-input"
            autoFocus={true}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <div className="content-btns">
            <div className="content-btn-item cacel-btn" onClick={() => callback('cancel', inputVal)}>Cancel</div>
            <div className="content-btn-item confrim-btn" onClick={() => callback('confirm', inputVal)}>Save</div>
          </div>
        </div>
			</div>
		</Styled>
  );
};

export default InputDialogComp;
