import { useDispatch } from "react-redux";

export function useSettingsUpdate() {
  const dispatch = useDispatch();

  const updateSetting = (action: any, messageType: string, data: any) => {
    // Dispatch to Redux
    dispatch(action);

    // Notify background script
    browser.runtime.sendMessage({
      type: messageType,
      ...data,
    });
  };

  return { updateSetting };
}
