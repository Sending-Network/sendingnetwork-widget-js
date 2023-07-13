import React, { useState } from "react";
import { Styled } from "direflow-component";
import { Dropdown, Button } from "antd";
import styles from "./mainMenu.css";
import {
  widgetTitleMore,
  widgetTitleMoreSet,
  widgetTitleMoreCreate,
  widgetTitleLogout,
} from "../../../imgs/index";

const MainMenu = ({ menuClick }) => {
  const [_open, setOpen] = useState(false);

  const items = [
    {
      key: "create",
      label: (
        <Styled styles={styles}>
          <div
            className="chat_widget_main_menu_item"
            onClick={() => menuClick("create")}>
            <img src={widgetTitleMoreCreate} />
            New Chat
          </div>
        </Styled>
      ),
    },
    {
      key: "setting",
      label: (
        <Styled styles={styles}>
          <div
            className="chat_widget_main_menu_item"
            onClick={() => menuClick("set")}>
            <img src={widgetTitleMoreSet} />
            <span>Settings</span>
          </div>
        </Styled>
      ),
    },
    {
      key: "logout",
      label: (
        <Styled styles={styles}>
          <div
            className="chat_widget_main_menu_item"
            onClick={() => menuClick("logout")}>
            <img width={20} src={widgetTitleLogout} />
            <span>Logout</span>
          </div>
        </Styled>
      ),
    },
  ];

  return (
    <Styled styles={styles}>
      <div>
        <Dropdown
          key="main-menu"
          trigger={["click"]}
          menu={{ items }}
          placement="topRight"
          onOpenChange={setOpen}>
          <Button
            style={{ border: 0 }}
            className={`chat_widget_main_menu ${_open ? "open" : ""}`}>
            <img src={widgetTitleMore} />
          </Button>
        </Dropdown>
      </div>
    </Styled>
  );
};

export default MainMenu;
