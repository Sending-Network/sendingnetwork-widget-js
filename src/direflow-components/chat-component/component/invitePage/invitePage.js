import React, { useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./invitePage.css";
import {
	roomTitleBackIcon,
	inviteSelectedIcon,
	inviteUnselectIcon,
	dialogLoadingIcon
} from "../../imgs/index"
import { api } from "../../api";
import { formatTextLength, showToast, getAddressByUserId } from "../../utils/index";
import InputDialogComp from "../inputDialogComp/inputDialogComp";
import { AvatarComp } from "../avatarComp/avatarComp";

const InvitePage = ({ roomId, onBack, title }) => {
	const [filterStr, setFilterStr] = useState("");
	const [searchList, setSearchList] = useState([]);
	const [selectList, setSelectList] = useState([]);
	const [showDialog, setShowDialog] = useState(false);
	const [dialogStatus, setDialogStatus] = useState('loading');
	const [dialogText, setDialogText] = useState("");
	const [showInputDialog, setShowInputDialog] = useState(false);

	useEffect(() => {
		if (!filterStr) {
			setSearchList([]);
		} else {
			let tmpStr = filterStr;
			if (/^0[x|X]./g.test(tmpStr)) {
				const tmpStrArr = tmpStr.match(/^0[x|X](.+)/);
				tmpStr = tmpStrArr[1] || tmpStr;
			}
			api._client.searchUserDirectory({
				term: tmpStr,
				limit: 10
			}).then((resp) => {
				if (resp && resp.results && resp.results.length > 0) {
					const tmpArr = resp.results.map(item => {
						return {
							...item,
							isSelected: isSearchUserSelected(item)
						}
					})
					setSearchList(tmpArr)
				}
			}).catch(err => {
				setSearchList([])
			})
		}
	}, [filterStr])

	const isSearchUserSelected = (user) => {
		const isSelect = selectList.find(u => u.user_id === user.user_id);
		return isSelect ? true : false;
	}

	const handleBackClick = () => {
		setFilterStr("")
		setSelectList([])
		setSearchList([])
		onBack()
	}

	const handleSelectListClick = (user) => {
		const arr = JSON.parse(JSON.stringify(selectList));
		const index = arr.findIndex(v => v.user_id === user.user_id);
		arr.splice(index, 1);
		setSelectList(arr);
	}

	const handleSearchListClick = (user) => {
		const arr = JSON.parse(JSON.stringify(selectList));
		const arrSearch = JSON.parse(JSON.stringify(searchList));
		const index = arr.findIndex(v => v.user_id === user.user_id);
		const indexSearch = arrSearch.findIndex(v => v.user_id === user.user_id);

		if (index !== -1) {
			arr.splice(index, 1)
		} else {
			arr.push({
				...user,
				isSelected: true
			})
		}
		arrSearch.splice(indexSearch, 1, {
			...user,
			isSelected: !user.isSelected
		});
		setSelectList(arr);
		setSearchList(arrSearch);
	}

	const handleConfirmClick = async () => {
		if (selectList.length <= 0) {
      showToast({
        type: 'info',
        msg: 'None selected'
      })
			return;
		}
		if (roomId) {
			handleCreateAndInvite();
		} else {
			// single person not show dialog
			if (selectList.length === 1) {
				const rName = selectList[0].displayName || selectList[0].user_id;
				handleCreateAndInvite(rName);
			} else {
				setShowInputDialog(true);
			}
		}
	}

	const handleCreateAndInvite = async (roomName) => {
		setDialogStatus('loading');
		setShowDialog(true);
		let tmpRoomId = roomId;
		let tmpDialogText = `${selectList.length > 1 ? 'Invites' : 'Invite'} sent successfully!`;
		if (!tmpRoomId) {
			tmpRoomId = await api.createPublicRoom(roomName);
			tmpDialogText = "The room is created successfully!";
		}
		await selectList.map(m => {
			api.invite(tmpRoomId, m.user_id)
		});
		setDialogText(tmpDialogText);
		setDialogStatus('success');
	}

  return (
    <Styled styles={styles}>
      <div className="invite_page">
				{/* title */}
				<div className="invite_page_title">
					<div className="title_back" onClick={handleBackClick}>
						<img src={roomTitleBackIcon} />
					</div>
					<div className="title_text">{title ||"New Chat"}</div>
				</div>

				{/* search */}
				<input
          className="filter-box"
          placeholder="Search"
          value={filterStr}
          onChange={(e) => setFilterStr(e.target.value)}
        />

				{/* list */}
				<div className="list-wrap">
					{
						(searchList.length > 0 ? searchList : selectList).map(item => {
							return (
								<div className="members_item" key={item.user_id} onClick={() => {
									searchList.length > 0 ? handleSearchListClick(item) : handleSelectListClick(item)
								}}>
									<div className="members_item_select">
										<img src={item.isSelected ? inviteSelectedIcon : inviteUnselectIcon} />
									</div>
									<div className="members_item_avatar">
										<AvatarComp url={item.avatar_url} />
									</div>
									<div className="members_item_desc">
										<p className="members_item_desc_name">{formatTextLength(item.display_name, 13, 5)}</p>
										<p className="members_item_desc_addr">{getAddressByUserId(item.user_id)}</p>
									</div>
								</div>
							)
						})
					}
				</div>

				{/* btn */}
				<div className="select-box">
					<div className="select-box-btn" onClick={handleConfirmClick}>
						<span>Selected </span>
						{selectList.length > 0 && (
							<span> ({selectList.length}) </span>
						)}
					</div>
				</div>

				{/* dialog */}
        {showDialog && (
          <div className="invite_page_dialog">
            <div className="invite_page_dialog_content">
              <div className="info">
								{dialogStatus === 'loading' && (
									<div className="invite_page_dialog_loading">
										<img src={dialogLoadingIcon} />
										<span>Processing...</span>
									</div>
								)}
								{dialogStatus === 'success' && (<p className="info-desc">{dialogText}</p>)}
              </div>
							{dialogStatus === 'success' && (<div className="btns" onClick={handleBackClick}>Ok</div>)}
            </div>
          </div>
        )}

				{/* input-dialog */}
				{showInputDialog && (
					<InputDialogComp
						title='Set Room Name'
						value=''
						callback={(type, text) => {
							setShowInputDialog(false);
							if (type === 'confirm') {
								handleCreateAndInvite(text);
							}
						}}
					/>
				)}
			</div>
		</Styled>
  );
};

export default InvitePage;
