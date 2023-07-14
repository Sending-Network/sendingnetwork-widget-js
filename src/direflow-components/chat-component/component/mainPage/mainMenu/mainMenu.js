import React, { useState, useEffect } from "react";
import { Styled } from "direflow-component";
import styles from "./mainMenu.css";
import {
  widgetTitleMore,
  widgetTitleMoreSet,
  widgetTitleMoreCreate,
  widgetTitleLogout,
} from "../../../imgs/index";

const MainMenu = ({ closeModalms, menuClick }) => {
  const [showSetBox, setShowSetBox] = useState(false);

  useEffect(() => {
    if (showSetBox) {
      setShowSetBox(false)
    }
  }, [closeModalms])

  const handleMenuClick = (type) => {
    setShowSetBox(false)
    menuClick(type)
  }

  return (
    <Styled styles={styles}>
      <div className="chat_widget-menu">
        <div
          className={[ "chat_widget-menu-btn", showSetBox ? "chat_widget-menu-btn-active" : "" ].join(" ")}
          onClick={(e) => {
            e.stopPropagation();
            setShowSetBox(!showSetBox);
          }}
        >
          <img src={widgetTitleMore} />
        </div>
        {showSetBox && (
          <div className="chat_widget_title_setBox" onClick={(e) => { e.stopPropagation() }}>
            <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('create')}>
              <img src={widgetTitleMoreCreate} />
              <span>New Chat</span>
            </div>
            <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('set')}>
              <img src={widgetTitleMoreSet} />
              <span>Settings</span>
            </div>
            <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('logout')}>
              <img src={widgetTitleLogout} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </Styled>
  );
};

export default MainMenu;
