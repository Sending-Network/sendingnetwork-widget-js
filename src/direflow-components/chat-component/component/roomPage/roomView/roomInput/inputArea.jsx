import React, { useEffect, useRef, useState } from 'react'
import { isMobile } from '../../../../utils';

const InputArea = (props) => {
  const { className, value, placeholder, inputFocus, onKeyDown, sendTimestamp, showMemberList, selectionIndex } = props;
  const inputRef = useRef(null);
  const [nextFrameTimeout, setNextFrameTimeout] = useState(0);

  useEffect(() => {
    resize();
  }, []);

  useEffect(() => {
    if (!isMobile()) {
      focusInput();
    }
  }, [inputRef?.current])

  useEffect(() => {
    if (sendTimestamp > 0) {
      delayResize();
      focusInput();
    }
  }, [sendTimestamp])

  useEffect(() => {
    if (inputFocus > 0) {
      focusInput();
    }
  }, [inputFocus])

  useEffect(() => {
    if (inputRef && inputRef.current) {
      const { selectionStart, selectionEnd } = inputRef.current
      props.onSelectionChanged(selectionStart, selectionEnd);
    }
  }, [inputRef?.current, inputRef?.current?.selectionStart, inputRef?.current?.selectionEnd])

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.setSelectionRange(selectionIndex, selectionIndex);
      delayResize();
    }
  }, [selectionIndex])

  const focusInput = () => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }

  const resize = () => {
    if (inputRef && inputRef.current) {
      // console.log('resizing...', inputRef.current)
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }

  const delayResize = () => {
    if (nextFrameTimeout) {
      clearTimeout(nextFrameTimeout)
    }
    setNextFrameTimeout(setTimeout(resize, 0));
  }

  const handleChange = (e) => {
    props.onChange(e.target.value);
    resize();
  }

  const handleChangeDelay = (e) => {
    delayResize();
    props.onChange(e.target.value);
  }

  const handleKeyDown = (e) => {
    const { key, keyCode, shiftKey } = e;
    if (keyCode === 13 && value.trim()) {
      if (shiftKey) {
        // props.onChange(value);
        return;
      } else if (!showMemberList) {
        e.stopPropagation();
        e.preventDefault();
        props.sendMessage();
        delayResize();
        return
      }
    }
    onKeyDown(e);
  }

  return (
    <textarea
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={handleChangeDelay}
      onKeyDown={handleKeyDown}
      rows={1}
      autoComplete='off'
    />
  )
}

export default InputArea;