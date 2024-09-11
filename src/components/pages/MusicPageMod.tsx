import React, { useContext, useEffect, useMemo, useRef } from "react";
import { musicSelectors } from "store/features/entities/entitiesState";
import styled, { ThemeContext } from "styled-components";
import useWindowSize from "ui/hooks/use-window-size";
import useResizable from "ui/hooks/use-resizable";
import debounce from "lodash/debounce";
import editorActions from "store/features/editor/editorActions";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import {
  modFilter,
  NavigatorModSongs,
} from "components/music/NavigatorModSongs";
import ModViewer from "components/music/ModViewer";
import { useAppDispatch, useAppSelector } from "store/hooks";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const MusicPageMod = () => {
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);
  const selectedId = useAppSelector((state) => state.navigation.id);
  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allTracks = useAppSelector((state) =>
    musicSelectors.selectAll(state).filter(modFilter)
  );

  const track = useAppSelector((state) =>
    musicSelectors.selectById(state, selectedId)
  );

  const lastTrackId = useRef("");
  useEffect(() => {
    if (track) {
      lastTrackId.current = track.id;
    }
  }, [track]);

  const viewTrackId = useMemo(
    () => track?.id || lastTrackId.current || allTracks[0]?.id,
    [allTracks, track]
  );

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResizeComplete: (v) => {
      if (v < 200) {
        setLeftPaneSize(200);
      }
    },
  });

  useEffect(() => {
    prevWindowWidthRef.current = windowWidth;
  });
  const prevWidth = prevWindowWidthRef.current;

  useEffect(() => {
    if (windowWidth !== prevWidth) {
      const panelsTotalWidth = leftPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowWidth;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [windowWidth, prevWidth, leftPaneWidth, setLeftPaneSize]);

  const debouncedStoreWidths = useRef(
    debounce((leftPaneWidth: number) => {
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100)
  );

  useEffect(() => debouncedStoreWidths.current(leftPaneWidth), [leftPaneWidth]);

  return (
    <Wrapper>
      {" "}
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: Math.max(200, leftPaneWidth),
          background: themeContext?.colors.sidebar.background,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            minWidth: 200,
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <NavigatorModSongs
            height={windowHeight - 38}
            selectedId={selectedId}
          />
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      <div
        style={{
          flex: "1 1 0",
          minWidth: 0,
          overflow: "hidden",
          background: themeContext?.colors.document.background,
          color: themeContext?.colors.text,
          height: windowHeight - 38,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flexGrow: 1, position: "relative" }}>
          <ModViewer trackId={viewTrackId} />
        </div>
      </div>
    </Wrapper>
  );
};

export default MusicPageMod;
