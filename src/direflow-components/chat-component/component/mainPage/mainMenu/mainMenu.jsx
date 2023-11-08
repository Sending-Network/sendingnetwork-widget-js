import React, { useState, useEffect } from "react";
import { Styled } from "direflow-component";
import styles from "./mainMenu.css";
import {
  widgetTitleMore,
  widgetTitleMoreSet,
  widgetTitleMoreCreate,
  widgetTitleLogout,
} from "../../../imgs/index";
import { menuIcon } from "../../../imgs/svgs";

const MainMenu = ({ menuFuncs, closeModalms, menuClick }) => {
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
          className="chat_widget-menu-btn svg-btn svg-btn-stroke"
          onClick={(e) => {
            e.stopPropagation();
            setShowSetBox(!showSetBox);
          }}
        >
          {menuIcon}
        </div>
        {showSetBox && (
          <div className="chat_widget_title_setBox" onClick={(e) => { e.stopPropagation() }}>
            {menuFuncs && menuFuncs.includes('Invite') && (
              <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('create')}>
                <img src={widgetTitleMoreCreate} />
                <span>New Chat</span>
              </div>
            )}
            {menuFuncs.includes('Invite') && menuFuncs.includes('Settings') && (
              <div className="chat_widget_title_setBox_item_line"></div>
            )}
            {menuFuncs && menuFuncs.includes('Settings') && (
              <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('set')}>
                <img src={widgetTitleMoreSet} />
                <span>Settings</span>
              </div>
            )}
            {menuFuncs.includes('Settings') && menuFuncs.includes('Logout') && (
              <div className="chat_widget_title_setBox_item_line"></div>
            )}
            {menuFuncs && menuFuncs.includes('Logout') && (
              <div className="chat_widget_title_setBox_item" onClick={() => handleMenuClick('logout')}>
                <img src={widgetTitleLogout} />
                <span>Logout</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Styled>
  );
};

export default MainMenu;
