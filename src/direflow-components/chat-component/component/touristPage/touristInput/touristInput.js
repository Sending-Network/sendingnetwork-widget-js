import React from "react";
import { Styled } from "direflow-component";
import styles from "./touristInput.css";
import { roomInputUploadIcon } from "../../../imgs/index";

const TouristInput = () => {
  return (
    <Styled styles={styles}>
      <div className="tourist-input-box">
          {/* pic-upload */}
          <div className="tourist-input-box-upload">
            <img src={roomInputUploadIcon} />
          </div>

          {/* input */}
          <input
            id="sendMessage"
            className="tourist-input-box-input"
            type="text"
            autoComplete="off"
            placeholder="Message"
            disabled
          />
        </div>
		</Styled>
  );
};

export default TouristInput;
