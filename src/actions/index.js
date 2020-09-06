import * as types from "./actionTypes";

export const setActorPrefab = actor => {
  return { type: types.SET_ACTOR_PREFAB, actor };
};

export const setTriggerPrefab = trigger => {
  return { type: types.SET_TRIGGER_PREFAB, trigger };
};

export const setScenePrefab = scene => {
  return { type: types.SET_SCENE_PREFAB, scene };
};

export const editTrigger = (sceneId, id, values) => {
  return { type: types.EDIT_TRIGGER, sceneId, id, values };
};

export const removeCustomEvent = customEventId => {
  return { type: types.REMOVE_CUSTOM_EVENT, customEventId };
};

export const pasteClipboardEntity = clipboardData => dispatch => {
  if (clipboardData.__type === "scene") {
    const clipboardScene = clipboardData.scene;
    dispatch(pasteCustomEvents());    
    dispatch(setScenePrefab(clipboardScene));
  } else if (clipboardData.__type === "actor") {
    const clipboardActor = clipboardData.actor;
    dispatch(pasteCustomEvents());    
    dispatch(setActorPrefab(clipboardActor));
  } else if (clipboardData.__type === "trigger") {
    const clipboardTrigger = clipboardData.trigger;
    dispatch(pasteCustomEvents());
    dispatch(setTriggerPrefab(clipboardTrigger));
  }
};

export const pasteClipboardEntityInPlace = (clipboardData) => (dispatch, getState) => {
  const state = getState();
  const { scene: sceneId } = state.editor;
  if (clipboardData.__type === "scene") {
    const clipboardScene = clipboardData.scene;
    dispatch(pasteCustomEvents());
    dispatch(addScene(clipboardScene.x, clipboardScene.y, clipboardScene));
  } else if (sceneId && clipboardData.__type === "actor") {
    const clipboardActor = clipboardData.actor;
    dispatch(pasteCustomEvents());
    dispatch(
      addActor(sceneId, clipboardActor.x, clipboardActor.y, clipboardActor)
    );
  } else if (sceneId && clipboardData.__type === "trigger") {
    const clipboardTrigger = clipboardData.trigger;
    dispatch(pasteCustomEvents());
    dispatch(
      addTrigger(sceneId, clipboardTrigger.x, clipboardTrigger.y, clipboardTrigger.width, clipboardTrigger.height, clipboardTrigger)
    );
  }
};

export const pasteCustomEvents = () => {
  return { type: types.PASTE_CUSTOM_EVENTS };
};
