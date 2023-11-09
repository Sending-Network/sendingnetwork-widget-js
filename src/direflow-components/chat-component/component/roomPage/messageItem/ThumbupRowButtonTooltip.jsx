import React, {useState, useEffect } from "react";

// import { _t } from './languageHandler';
// import { unicodeToShortcode, formatCommaSeparatedList, replaceableComponent } from "./tooltipUtils.jsx";
import { unicodeToShortcode, formatCommaSeparatedList } from "./tooltipUtils.jsx";
// import Tooltip from "./Tooltip";
// import MatrixClientContext from "../../../contexts/MatrixClientContext";

function _t(str) {
	return str
}

// @replaceableComponent("views.messages.ReactionsRowButtonTooltip")
const ThumbupRowButtonTooltip = ({
	content,
	reactionEvents,
	mxEvent,
	visible,
	room,
	count
}) => {
	// static contextType = MatrixClientContext;

	// const room = context.getRoom(mxEvent.getRoomId());
	const genTooltip = () => {
		// console.error('===genTooltop===')
		let tooltipLabel;
		if (room) {
			const senders = [];
			for (const reactionEvent of reactionEvents) {
				const member = room.getMember(reactionEvent.getSender());
				const name = member ? member.name : reactionEvent.getSender();
				senders.push(name);
			}
			const shortName = unicodeToShortcode(content);
			// tooltipLabel = <div>{ _t(
			// 	"<reactors/><reactedWith>--22--reacted with %(shortName)s</reactedWith>",
			// 	{
			// 		shortName,
			// 	},
			// 	{
			// 		reactors: () => {
			// 			return <div className="mx_Tooltip_title">
			// 				{ formatCommaSeparatedList(senders, 6) }
			// 			</div>;
			// 		},
			// 		reactedWith: (sub) => {
			// 			if (!shortName) {
			// 				return null;
			// 			}
			// 			return <div className="mx_Tooltip_sub">
			// 				{ sub }
			// 			</div>;
			// 		},
			// 	},
			// ) }</div>;
			tooltipLabel = visible ? <div className="mx_Tooltip_wrapper">
				Reacted by { formatCommaSeparatedList(senders, 6) }
				{/* {senders.length > 4 && 'and ' + senders.length - 4 + ' others'} */}
			</div> : null
		}

		let tooltip;
		if (tooltipLabel) {
			// tooltip = <Tooltip
			// 	className={'className'}
			// 	tooltipClassName={'tooltipClassName'}
			// 	visible={visible}
			// 	label={tooltipLabel}
			// 	alignment={'Top'}
			// 	id={'id'}
			// 	maxParentWidth={100}
			// 	thumbupRowButtonRef={thumbupRowButtonRef}
			// />;
			tooltip = tooltipLabel
		}
		return tooltip;
	}
	const [tooltip, setTooltip] = useState(genTooltip())
	useEffect(() => {
		setTooltip(genTooltip())
	}, [count])
	return tooltip;
}

export default React.memo(ThumbupRowButtonTooltip)
