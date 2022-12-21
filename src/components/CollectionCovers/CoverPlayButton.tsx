import { useEffect, FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  isTrackPlaying,
  setIndex,
  setIsPlaying,
} from "../../store/reducers/currentTrackSlice";
import {
  currentQueue as queue,
  queueType as type,
  setCurrentQueue,
  setQueueType,
} from "../../store/reducers/currentQueueSlice";
import { Album, AlbumWithTracks, IPlaylist } from "../../types/types";
import { getQueueFromCollection } from "../../requests/getTrackFromCollection";
import { BiPause, BiPlay } from "react-icons/bi";
import { IconContext } from "react-icons";
import {
  isPlayerVisible as isVisible,
  setIsRadioMode,
  setPlayerVisible,
} from "../../store/reducers/playerSlice";

interface Props {
  playlistInfo?: IPlaylist;
  albumInfo?: Album;
  styles: any;
}

export const CoverPlayButton: FC<Props> = ({
  playlistInfo,
  albumInfo,
  styles,
}) => {
  const dispatch = useDispatch();
  const isPlayerVisible = useSelector(isVisible);

  const currentQueue = useSelector(queue);

  const isPlaying = useSelector(isTrackPlaying);

  const handlePlaylistPlayStart = async () => {
    if (!isPlayerVisible) {
      dispatch(setPlayerVisible(true));
    }
    if (playlistInfo) {
      if (playlistInfo.kind == (currentQueue as IPlaylist).kind) {
        dispatch(setIsPlaying(true));
      } else {
        const trackQueue = await getQueueFromCollection(
          "playlist",
          playlistInfo
        );
        dispatch(setIsRadioMode(false));
        dispatch(setQueueType("playlist"));
        dispatch(setCurrentQueue(trackQueue));
        dispatch(setIndex(0));
        dispatch(setIsPlaying(true));
      }
    }
    if (albumInfo) {
      if (albumInfo.id == (currentQueue as AlbumWithTracks).id) {
        dispatch(setIsPlaying(true));
      } else {
        const trackQueue = await getQueueFromCollection("album", albumInfo);
        dispatch(setQueueType("album"));
        dispatch(setCurrentQueue(trackQueue));
        dispatch(setIndex(0));
        dispatch(setIsPlaying(true));
        dispatch(setIsRadioMode(false));
      }
    }
  };
  const handlePlaylistPause = () => {
    dispatch(setIsPlaying(false));
  };
  return (
    <div className={styles.coverPlayButtonContainer}>
      <IconContext.Provider value={{ size: "24px" }}>
        {isPlaying &&
        ((albumInfo?.id &&
          (currentQueue as AlbumWithTracks).id == albumInfo.id) ||
          (playlistInfo?.kind &&
            (currentQueue as IPlaylist).kind == playlistInfo?.kind)) ? (
          <BiPause
            onClick={handlePlaylistPause}
            className={styles.coverPlayButton}
          />
        ) : (
          <BiPlay
            onClick={handlePlaylistPlayStart}
            className={styles.coverPlayButton}
          />
        )}
      </IconContext.Provider>
    </div>
  );
};
