import React, { useRef, useEffect, useState } from "react";
import { Styled } from "direflow-component";
import styles from "./memberProfileRemark.css";
import { Upload, UploadFile, UploadProps } from "antd";
import { RemarkStore, RemarkUser, RoomMember } from "sendingnetwork-js-sdk";
import { isEmpty } from "lodash";
import { api } from "../../../api";
import { roomTitleBackIcon } from "../../../imgs/index";
import { showToast } from "../../../utils";

const MemberProfileRemark = ({ userId, getProfileInfo, setMemberProfileRemarkDialog }) => {
  const [fileList, setFileList] = useState([]);
  const [remark, setRemark] = useState();
  const [forbidSaveBtn, setForbidSaveBtn] = useState(false);
  const [isReloadSignature, setIsReloadSignature] = useState(false);

  useEffect(() => {
    const onChangeRemark = (userid, userRemark) => {
      if(userId === userid){
        setRemark(userRemark);
      }
    }
    RemarkStore.get().addListener('User.remark_change',onChangeRemark);
    const _remark = RemarkStore.get().getRemarkMap()[userId];
    setRemark(_remark)
    return () => {
      RemarkStore.get().removeListener('User.remark_change',onChangeRemark)
    }
  }, [userId]);

  const goBack = () => {
    isReloadSignature && getProfileInfo();
    setMemberProfileRemarkDialog(false)
  }

  const onChangeName = (e) => {
    const { value } = e.target;
    setRemark({
      ...remark,
      name: value,
    });
  }
  const onChangeRemark = (e) => {
    const { value } = e.target;
    setRemark({
      ...remark,
      note: value,
    });
  }

  const onSave = async () => {
    await RemarkStore.get().setUserRemarkMap(userId, {...remark});
    // onBack()
    showToast({
      type: 'success',
      msg: 'Success',
    })
    setIsReloadSignature(true)
  }

  return (
    <Styled styles={styles}>
      <div className="memberProfileRemark">
        {/* title */}
        <div className="memberProfileRemark_room_title">
          <div className="memberProfileRemark_room_title_left" onClick={goBack}>
            <img src={roomTitleBackIcon} />
          </div>
          <div className="room_title_center">Remark</div>
        </div>

        <div className="memberProfileRemark_info_wrap">
          {/* <div className="memberProfileRemark_userinfo_remark">
            <label htmlFor="nick_name">Nick Name</label>
            <input id="nick_name" className="remark-input" value={remark?.name || ""} placeholder="Add NickName" onChange={onChangeName} />
          </div> */}
          <div className="memberProfileRemark_userinfo_remark">
            {/* <label htmlFor="remark">Remark</label> */}
            <input id="remark" className="remark-input" value={remark?.note || ""}  placeholder="Add Remark" onChange={onChangeRemark} />
          </div>

          <div className="info-grow"></div>
          <div className={["info_btns", forbidSaveBtn && "forbidden"].join(" ")}>
            <div className="info_btns-item" onClick={onSave}>Save</div>
          </div>
        </div>
      </div>
		</Styled>
  );
};

export default MemberProfileRemark;
