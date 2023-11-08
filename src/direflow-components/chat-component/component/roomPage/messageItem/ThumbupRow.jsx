import React, { useEffect, useRef, useState } from "react";
import { Styled } from "direflow-component";
import { api } from "../../../api";
import styles from "./messageItem.css";
import ThumbupRowButton from "./ThumbupRowButton";
// import { EventStatus } from "sendingnetwork-js-sdk/src/models/event";
// import { EventType } from "sendingnetwork-js-sdk/src/@types/event";

const ThumbupRow = ({
  mxEvent,
  reactions,
  isOwn,
  roomId,
  room,
}) => {
  // const getMyReactions = () => { // ReactionsRow
  //   // const reactions = this.props.reactions;
  //   if (!reactions) {
  //       return null;
  //   }
  //   const userId = api.getUserId();
  //   const myReactions = reactions.getAnnotationsBySender()[userId];
  //   if (!myReactions) {
  //       return null;
  //   }
  //   return [...myReactions.values()];
  // }
  // const [myReactions, setMyReactions] = useState(getMyReactions())
  const [updateFlag, setUpdateFlag] = useState(0);
  useEffect(() => {
    if (reactions) { // ReactionsRow
      reactions.on("Relations.add", onReactionsChange);
      reactions.on("Relations.remove", onReactionsChange);
      reactions.on("Relations.redaction", onReactionsChange);
      console.log('reactions: event added')
    }
    return () => {
      if (reactions) { // ReactionsRow
        reactions.off("Relations.add", onReactionsChange);
        reactions.off("Relations.remove", onReactionsChange);
        reactions.off("Relations.redaction", onReactionsChange);
      }
    }
  }, [reactions])

  const onReactionsChange = (event) => { // ReactionsRow
    // TODO: Call `onHeightChanged` as needed
    // this.setState({
    //     myReactions: this.getMyReactions(),
    // });
    // setMyReactions(getMyReactions())
    // Using `forceUpdate` for the moment, since we know the overall set of reactions
    // has changed (this is triggered by events for that purpose only) and
    // `PureComponent`s shallow state / props compare would otherwise filter this out.
    // this.forceUpdate();
    // console.log('onReactionsChange', event);
    setUpdateFlag(Date.now())
  };

  // const isContentActionable = (mxEvent: MatrixEvent): boolean {
  const isContentActionable = (mxEvent) => {
    const { status: eventStatus } = mxEvent;

    // status is SENT before remote-echo, null after
    // const isSent = !eventStatus || eventStatus === EventStatus.SENT;
    const isSent = !eventStatus || eventStatus === "sent";

    if (isSent && !mxEvent.isRedacted()) {
        if (mxEvent.getType() === "m.room.message") {
            const content = mxEvent.getContent();
            if (
                content.msgtype &&
                content.msgtype !== "m.bad.encrypted" &&
                content.hasOwnProperty("body")
            ) {
                return true;
            }
        } else if (
            // mxEvent.getType() === "m.sticker" ||
            // mxEvent.getType() === EventType.PollStart ||
            // mxEvent.getType() === EventType.PollEnd
            mxEvent.getType() === "m.sticker" ||
            mxEvent.getType() === "m.poll.start" ||
            mxEvent.getType() === "m.poll.end"
        ) {
            return true;
        }
    }

    return false;
  }

  const genReactionsRowButton = () => { // ReactionsRow
    // console.error('-----genReactionsRowButton-----', mxEvent.event.content)
    // console.error(mxEvent.event.content, reactions)
    if (!reactions || !isContentActionable(mxEvent)) {
      return null;
    }
    let items = reactions.getSortedAnnotationsByKey().map(([content, events]) => {
      const count = events.size;
      if (!count) {
        return null;
      }
      if (content === 'published') {
        return null;
      }
      const userId = api.getUserId();
      const set = reactions.getAnnotationsBySender()[userId];
      const myReactions = set ? [...set.values()] : null;
      const myReactionEvent = myReactions && myReactions.find(mxEvent => {
        if (mxEvent.isRedacted()) {
          return false;
        }
        return mxEvent.getRelation().key === content;
      });
      return <ThumbupRowButton
        key={content}
        content={content}
        count={count}
        mxEvent={mxEvent}
        reactionEvents={events}
        myReactionEvent={myReactionEvent}
        room={room}
      />;
    }).filter(item => !!item);
    if (!items.length) return null;
    return items
  }
  const reactionsRowButtonContent = genReactionsRowButton()
  return reactionsRowButtonContent ? <div className={["msgBox_info_thumb_up", isOwn ? "msgBox_right_info_thumb_up" : "msgBox_left_info_thumb_up"].join(" ")}>
    {reactionsRowButtonContent}
  </div> : null;
};

export default React.memo(ThumbupRow);

