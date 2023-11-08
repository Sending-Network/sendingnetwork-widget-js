import React, { useEffect, useRef, useState } from "react";
import { Styled } from "direflow-component";
import { api } from "../../../api";
import styles from "./messageItem.css";
// import { EventStatus } from "sendingnetwork-js-sdk/src/models/event";
// import { EventType } from "sendingnetwork-js-sdk/src/@types/event";
import classNames from "classnames";
import ThumbupRowButtonTooltip from "./ThumbupRowButtonTooltip";

const ThumbupRowButton = ({
  content,
  count,
  mxEvent,
  reactionEvents,
  myReactionEvent,
  room,
}) => {
  const clickEmojiItemHandle = () => { // ReactionsRowButton
    console.log('click thumbup emoji directly')
    if (myReactionEvent) {
      api._client.redactEvent(
        mxEvent.getRoomId(),
        myReactionEvent.getId(),
      );
    } else {
      api._client.sendEvent(mxEvent.getRoomId(), "m.reaction", {
        "m.relates_to": {
          "rel_type": "m.annotation",
          "event_id": mxEvent.getId(),
          "key": content,
        },
      });
      // dis.dispatch({ action: "message_sent" });
    }
  }
  const classes = classNames({
    msgBox_info_thumb_up_item: true,
    msgBox_info_thumb_up_item_selected: !!myReactionEvent,
  });
  return <div className={classes} key={content} onClick={clickEmojiItemHandle}>
    <span className="emoji_icon">{content}</span>
    <span className="emoji_count">{count}</span>
    <ThumbupRowButtonTooltip
      content={content}
      reactionEvents={reactionEvents}
      mxEvent={mxEvent}
      visible={true}
      room={room}
    ></ThumbupRowButtonTooltip>
  </div>
};

export default React.memo(ThumbupRowButton);
