import { FC, useEffect, useRef, useState } from "react";
import {
  setIsPlaying,
  setIndex,
  trackUrl,
  trackArtists,
  trackCover,
  trackTitle,
  setTrackStatus,
  setCurrentTrackAlbum,
} from "../../store/reducers/currentTrackSlice";
import { useSelector, useDispatch } from "react-redux";
import { IconContext } from "react-icons";
import { AiOutlinePause, AiOutlineUnorderedList } from "react-icons/ai";
import { BiPlay, BiSkipNext, BiSkipPrevious } from "react-icons/bi";
import { MdRepeat, MdRepeatOne, MdVolumeUp, MdVolumeOff } from "react-icons/md";
import { FaTheaterMasks } from "react-icons/fa";
import styles from "./Player.module.scss";
import { durationToMinutes } from "../../helpers/durationToMinutes";
import { concatArtistNames } from "../../helpers/concatArtistNames";
import {
  PlaylistTrack,
  IPlaylist,
  AlbumWithTracks,
  Track,
} from "../../types/types";
import {
  selectIsPlaying,
  selectIndex,
} from "../../store/reducers/currentTrackSlice";
import {
  setIsRadioMode,
  toggleIsPlayerVisible,
} from "../../store/reducers/playerSlice";
import { AppDispatch, RootState } from "../../store/store";
import { startAudioRequest } from "../../requests/startAudioRequest";
import { endAudioRequest } from "../../requests/endAudioRequest";
import { generatePlayId } from "../../helpers/generatePlayId";
import {
  setCurrentTrackId,
  fetchTrackUrl,
} from "../../store/reducers/currentTrackSlice";
import {
  fetchRotorQueue,
  fetchRotorSettings,
  rotorQueueStatus,
} from "../../store/reducers/rotorSlice";
import { sendRotorFeedBack } from "../../requests/rotorFeedback";
import { RotorSettings } from "./RotorSettings";
import { PlayerLikeButton } from "./PlayerLikeButton";
import { queueType as type } from "../../store/reducers/currentQueueSlice";
import { setSelectedCollectionType } from "../../store/reducers/selectedPlaylistSlice";

interface Props {
  setIsQueueDisplayed: React.Dispatch<React.SetStateAction<boolean>>;
  isQueueDisplayed: boolean;
}
const Player: FC<Props> = ({ setIsQueueDisplayed, isQueueDisplayed }) => {
  //useStates

  const [maxDuration, setMaxDuration] = useState<number>(0);
  const [currentDuration, setCurrentDuration] = useState<number>(0); //refers to time current track has played
  const [volume, setVolume] = useState<number>(
    localStorage.getItem("user-volume")
      ? JSON.parse(localStorage.getItem("user-volume") || "1")
      : 1
  );
  const [isTimeBeingChanged, setIsTimeBeingChanged] = useState<boolean>(false);
  const [isReplayTrack, setIsReplayTrack] = useState<boolean>(false);
  const [isReplayPlaylist, setIsReplayPlaylist] = useState<boolean>(false);
  const [displayTimeBar, setDisplayTimeBar] = useState<boolean>(false);
  const [cursorX, setCursorX] = useState<number>(0);
  const [displayRotorSettings, setDisplayRotorSettings] =
    useState<boolean>(false);

  //useRefs

  const audioRef = useRef<HTMLAudioElement>(null);
  const radioTrackEndReason = useRef<"trackFinished" | "skip">("trackFinished");
  const audioTimeRef = useRef<number>(0); //refers to time has been played
  const timeRangeRef = useRef<HTMLInputElement>(null);
  const volumeRangeRef = useRef<HTMLInputElement>(null);
  const isQueuePresent = useRef<boolean>(false);
  const fromRef = useRef<string>("");
  const playIdRef = useRef<string>(generatePlayId());

  //useSelectors

  const isPlayerVisible = useSelector(toggleIsPlayerVisible);

  const sourceQueue = useSelector(
    (state: RootState) => state.currentQueueSlice.currentQueue
  );

  const queueType = useSelector(type);

  const index = useSelector(selectIndex);

  const isPlaying = useSelector(selectIsPlaying);

  const tracksArray =
    queueType == "playlist"
      ? (sourceQueue as IPlaylist).tracks
      : queueType == "album"
      ? (sourceQueue as AlbumWithTracks).volumes?.flat()
      : [];

  const playlistLoadingStatus = useSelector(
    (state: RootState) => state.currentQueueSlice.status
  );
  const trackLoadingStatus = useSelector(
    (state: RootState) => state.currentTrack.status
  );
  const rotorQueue = useSelector(
    (state: RootState) => state.rotorSliceReducer.currentQueue
  );
  const isRadioMode = useSelector(
    (state: RootState) => state.setPlayerVisible.isInRadioMode
  );

  const currentTrackId = useSelector(
    (state: RootState) => state.currentTrack.currentTrackId
  );

  const rotorStatus = useSelector(rotorQueueStatus);

  const title = useSelector(trackTitle);
  const cover = useSelector(trackCover);
  const artists = useSelector(trackArtists);

  const src = useSelector(trackUrl);

  //others

  const radioIdArray = rotorQueue.map((track: any) => {
    return track.track.id;
  });
  const trackIdArray = tracksArray?.map((track) => {
    return track.id;
  });
  useEffect(() => {
    //starts playing track if its index is different
    console.log(isRadioMode);
    if (
      isQueuePresent.current &&
      playlistLoadingStatus == "succeeded" &&
      !isRadioMode
    ) {
      fromRef.current = sourceQueue.metadata;
    }
    if (isQueuePresent.current && isRadioMode && rotorQueue) {
      fromRef.current = "web-radio-playlist-autoflow";
    }
    playIdRef.current = generatePlayId();
    if (trackLoadingStatus == "succeeded") {
      handleStartPlaying();

      if (!isRadioMode && queueType == "playlist") {
        dispatch(setCurrentTrackId(tracksArray![index || 0].id));
        dispatch(
          setCurrentTrackAlbum(
            (tracksArray as PlaylistTrack[])![index || 0].track.albums[0].id
          )
        );
      } else if (!isRadioMode && queueType == "album") {
        dispatch(setCurrentTrackId(tracksArray![index || 0].id));
        dispatch(setCurrentTrackAlbum((sourceQueue as AlbumWithTracks).id));
      } else {
        dispatch(setCurrentTrackId(radioIdArray[index || 0]));
        dispatch(
          setCurrentTrackAlbum(rotorQueue![index || 0].track.albums[0].id)
        );
      }
    }
  }, [index, trackLoadingStatus, queueType]);

  useEffect(() => {
    return () => {
      if (isQueuePresent.current) {
        if (!isRadioMode && queueType == "playlist") {
          endAudioRequest(
            (sourceQueue as Required<IPlaylist>).tracks[index || 0].track,
            audioTimeRef.current,
            playIdRef.current,
            fromRef.current,
            sourceQueue as IPlaylist
          );
        }
        if (!isRadioMode && queueType == "album") {
          endAudioRequest(
            (tracksArray as Track[])[index || 0],
            audioTimeRef.current,
            playIdRef.current,
            fromRef.current
          );
        }
        if (isRadioMode) {
          endAudioRequest(
            rotorQueue![index || 0].track,
            audioTimeRef.current,
            playIdRef.current,
            fromRef.current
          );
        }
      }
    };
  }, [index]);

  useEffect(() => {
    if (trackLoadingStatus == "succeeded" && !isPlaying) {
      audioRef.current?.pause();
    }
    if (trackLoadingStatus == "playing" && isPlaying) {
      audioRef.current?.play();
    }
    if (trackLoadingStatus == "playing" && !isPlaying) {
      audioRef.current?.pause();
    }
  }, [isPlaying, trackLoadingStatus]);

  useEffect(() => {
    if (
      (timeRangeRef.current?.valueAsNumber ||
        timeRangeRef.current?.valueAsNumber == 0) &&
      !isTimeBeingChanged
    ) {
      timeRangeRef.current.valueAsNumber = currentDuration;
    }
  }, [currentDuration, isTimeBeingChanged]);

  const dispatch = useDispatch<AppDispatch>();

  const handleResumePlaying = async () => {
    if (trackLoadingStatus == "succeeded") {
      await audioRef.current?.play();
    }
    dispatch(setIsPlaying(true));
  };
  const handleStartPlaying = async () => {
    isQueuePresent.current = true;
    await audioRef.current?.play();
    dispatch(setTrackStatus("playing"));
    dispatch(setIsPlaying(true));

    if (queueType == "playlist" && !isRadioMode) {
      setTimeout(async () => {
        await startAudioRequest(
          (tracksArray as PlaylistTrack[])[index || 0].track,
          playIdRef.current,
          fromRef.current,
          sourceQueue as IPlaylist
        );
      }, 200);
    }
    if (queueType == "album" && !isRadioMode) {
      setTimeout(async () => {
        await startAudioRequest(
          (tracksArray as Track[])![index || 0],
          playIdRef.current,
          fromRef.current
        );
      }, 200);
    }
    if (rotorQueue && isRadioMode) {
      setTimeout(async () => {
        await startAudioRequest(
          rotorQueue![index || 0].track,
          playIdRef.current,
          fromRef.current
        );
      });
      dispatch(setCurrentTrackId(radioIdArray[index || 0]));
    }
    if (isRadioMode) {
      sendRotorFeedBack(
        "trackStarted",
        fromRef.current,
        `${rotorQueue![index || 0].track.id}:${
          rotorQueue![index || 0].track.albums[0].id
        }`,
        0
      );
    }
  };
  const handlePause = () => {
    dispatch(setIsPlaying(false));
  };

  const displayPopUpTimeBar = () => {
    if (
      (maxDuration / timeRangeRef.current!.offsetWidth) *
        (cursorX -
          (window.innerWidth - timeRangeRef.current!.offsetWidth) / //divided by 2 because there's a padding at right and left
            2) >
      maxDuration
    ) {
      return durationToMinutes(maxDuration * 1000);
    }
    return durationToMinutes(
      (maxDuration / timeRangeRef.current!.offsetWidth) *
        (cursorX -
          (window.innerWidth - timeRangeRef.current!.offsetWidth) / //divided by 2 because there's a padding at right and left
            2) *
        1000 //
    );
  };

  useEffect(() => {
    if (audioRef.current?.volume || audioRef.current?.volume == 0) {
      audioRef.current.volume = volume;
    }
  }, [src, volume]);

  const handleVolumeChange = () => {
    if (audioRef.current?.volume || audioRef.current?.volume == 0) {
      setVolume(volumeRangeRef.current?.valueAsNumber || 0);
      localStorage.setItem(
        "user-volume",
        JSON.stringify(volumeRangeRef.current?.valueAsNumber || 0)
      );
    }
  };

  setTimeout(() => {
    setCurrentDuration(audioRef.current?.currentTime || 0);
    audioTimeRef.current = audioRef.current?.currentTime || 0;
  }, 50);

  const handleTimeChange = () => {
    setTimeout(() => {
      setIsTimeBeingChanged(false);
    }, 100);
    if (audioRef.current?.currentTime || audioRef.current?.currentTime == 0) {
      audioRef.current.currentTime = timeRangeRef.current?.valueAsNumber || 0;
    }
  };
  const handleSkipPrevious = () => {
    if (
      (trackLoadingStatus == "playing" || trackLoadingStatus == "succeeded") &&
      !isRadioMode
    ) {
      if (audioRef.current?.currentTime) {
        if (audioRef.current.currentTime < 10) {
          //if track current time is less than 5 seconds, changes track index. If not, replays the track
          if (index || index == 0) {
            const newIndex = index - 1;
            if (newIndex > -1) {
              dispatch(setIndex(newIndex));
            }
          }
        } else {
          audioRef.current.currentTime = 0;
          setCurrentDuration(0);
          audioTimeRef.current = 0;
        }
      }
    }
    if (isRadioMode) {
      return;
    }
  };
  useEffect(() => {
    //fetches rotor array if track playing is the last in playlist
    if (
      tracksArray?.length &&
      (index || index == 0) &&
      index + 1 > tracksArray.length - 1 &&
      !isRadioMode
    ) {
      dispatch(fetchRotorQueue());
    }
  }, [sourceQueue, index, isRadioMode]);

  useEffect(() => {
    console.log(tracksArray);
    console.log(queueType);
  }, [sourceQueue]);
  useEffect(() => {
    //fetches new rotor array when previous ends
    if (
      isRadioMode &&
      (index || index == 0) &&
      index + 1 > radioIdArray.length - 1
    ) {
      dispatch(fetchRotorQueue());
    }
  }, [index, isRadioMode]);

  useEffect(() => {
    if (!isRadioMode && (index || index == 0)) {
      dispatch(fetchTrackUrl(trackIdArray![index].toString()));
    }
    if (isRadioMode && (index || index == 0) && radioIdArray) {
      dispatch(fetchTrackUrl(radioIdArray![index]));
      console.log(currentTrackId, radioIdArray![index]);
    }
    return () => {
      if (isRadioMode) {
        sendRotorFeedBack(
          radioTrackEndReason.current,
          fromRef.current,
          `${rotorQueue![index || 0].track.id}:${
            rotorQueue![index || 0].track.albums[0].id
          }`,
          audioTimeRef.current
        );
      }
    };
  }, [index, isRadioMode, sourceQueue]);

  const handleSkipNextPlaylist = () => {
    if (trackLoadingStatus == "playing" || trackLoadingStatus == "succeeded") {
      if (index || index == 0) {
        const newIndex = index + 1;
        if (newIndex <= tracksArray!.length - 1) {
          dispatch(setIndex(newIndex));
        }
      }
    }
  };

  const handleSkipNextRadio = (reason: "trackFinished" | "skip") => {
    if (
      (trackLoadingStatus == "playing" || trackLoadingStatus == "succeeded") &&
      rotorStatus == "succeeded"
    ) {
      if (index || index == 0) {
        console.log(index);
        const newIndex = index + 1;
        radioTrackEndReason.current = reason;
        dispatch(setIndex(newIndex));
        if (newIndex > radioIdArray.length - 1) {
          dispatch(setIndex(0));
        }
      }
    }
  };
  const onTrackEnded = () => {
    if (index || index == 0) {
      if (!isReplayTrack && index < tracksArray!.length - 1 && !isRadioMode) {
        handleSkipNextPlaylist();
      } else if (audioRef.current?.currentTime && isReplayTrack) {
        dispatch(setIndex(index || 0));
      }
      if (
        !isReplayPlaylist &&
        index >= tracksArray!.length - 1 &&
        !isReplayTrack
      ) {
        dispatch(setIsRadioMode(true));
        dispatch(setIndex(0));
        dispatch(fetchRotorSettings());
        sendRotorFeedBack("radioStarted", "web-radio-playlist-autoflow");
      }
      if (!isReplayTrack && index <= rotorQueue.length - 1 && isRadioMode) {
        handleSkipNextRadio("trackFinished");
      }
    }
  };
  return (
    <div>
      {isPlayerVisible ? (
        <div className={styles.playerContainer}>
          <div className={styles.playerActive}>
            <span className={styles.currentDuration}>
              {`-${
                durationToMinutes((maxDuration - currentDuration) * 1000) ||
                "00:00"
              }`}
            </span>
            <input
              type="range"
              min={0}
              max={maxDuration}
              step="any"
              onMouseMove={(e) => {
                setDisplayTimeBar(true);
                setCursorX(e.clientX);
              }}
              onMouseLeave={(e) => {
                setDisplayTimeBar(false);
                if (isTimeBeingChanged) {
                  handleTimeChange();
                }
              }}
              ref={timeRangeRef}
              className={styles.playerTime}
              onClickCapture={(e) => {
                if (e.button == 2) {
                  handleTimeChange();
                }
              }}
              onMouseDown={() => {
                setIsTimeBeingChanged(true);
              }}
            />
            <span className={styles.maxDuration}>
              {durationToMinutes(maxDuration * 1000) || "00:00"}
            </span>
            <div className={styles.controlButtons}>
              <IconContext.Provider value={{ size: "36px" }}>
                {isRadioMode ? (
                  <FaTheaterMasks
                    className={styles.controlButton}
                    onClick={() =>
                      displayRotorSettings
                        ? setDisplayRotorSettings(false)
                        : setDisplayRotorSettings(true)
                    }
                  />
                ) : (
                  <BiSkipPrevious
                    onClick={handleSkipPrevious}
                    className={styles.controlButton}
                  />
                )}
                {isPlaying ? (
                  <AiOutlinePause
                    onClick={handlePause}
                    className={styles.controlButton}
                  />
                ) : (
                  <BiPlay
                    onClick={handleResumePlaying}
                    className={styles.controlButton}
                  />
                )}
                <BiSkipNext
                  onClick={() => {
                    console.log("dick");
                    isRadioMode
                      ? handleSkipNextRadio("skip")
                      : handleSkipNextPlaylist();
                  }}
                  className={styles.controlButton}
                />
                <AiOutlineUnorderedList
                  className={styles.controlButton}
                  onClick={() =>
                    isQueueDisplayed
                      ? (dispatch(setSelectedCollectionType("not-selected")),
                        setIsQueueDisplayed(false))
                      : (dispatch(setSelectedCollectionType(queueType)),
                        setIsQueueDisplayed(true))
                  }
                />
              </IconContext.Provider>
              <div className={styles.trackInfoContainer} draggable="false">
                {trackLoadingStatus == "succeeded" ||
                trackLoadingStatus == "playing" ? (
                  <>
                    <img
                      src={cover}
                      alt={title}
                      className={styles.trackCover}
                    />

                    <div className={styles.trackInfo}>
                      <span className={styles.title}>{title}</span>
                      <span className={styles.artists}>
                        {concatArtistNames(artists)}
                      </span>
                    </div>
                    <PlayerLikeButton
                      isRadioMode={isRadioMode}
                      from={fromRef.current}
                    />
                  </>
                ) : (
                  <></>
                )}
              </div>
              <div className={styles.volumeControlsContainer}>
                <div className={styles.volumeIconContainer}>
                  <IconContext.Provider value={{ size: "36" }}>
                    {volume > 0 ? (
                      <MdVolumeUp
                        className={styles.controlButton}
                        onClick={() => setVolume(0)}
                      />
                    ) : (
                      <MdVolumeOff
                        className={styles.controlButton}
                        onClick={() =>
                          setVolume(
                            JSON.parse(
                              localStorage.getItem("user-volume") || "1"
                            )
                          )
                        }
                      />
                    )}
                  </IconContext.Provider>
                </div>
                <div className={styles.volumeValueContainer}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    value={volume}
                    step={0.01}
                    onChange={handleVolumeChange}
                    ref={volumeRangeRef}
                    className={styles.volumeValue}
                  />
                </div>
              </div>
            </div>
            <div className={styles.extraButtons}>
              <IconContext.Provider value={{ size: "36px" }}>
                {isReplayPlaylist ? (
                  <MdRepeatOne
                    onClick={() => setIsReplayTrack(false)}
                    className={styles.controlButton}
                  />
                ) : isReplayTrack ? (
                  <MdRepeat
                    onClick={() => setIsReplayTrack(false)}
                    className={styles.controlButton_replayOn}
                  />
                ) : (
                  <MdRepeat
                    onClick={() => setIsReplayTrack(true)}
                    className={styles.controlButton}
                  />
                )}
              </IconContext.Provider>
            </div>
            <audio
              src={src}
              autoPlay={false}
              preload="auto"
              ref={audioRef}
              onPlaying={() => setMaxDuration(audioRef.current?.duration || 0)}
              onEnded={onTrackEnded}
            />
            {displayTimeBar ? (
              <div
                className={styles.popupBar}
                style={{
                  left:
                    cursorX -
                    (window.innerWidth - timeRangeRef.current!.offsetWidth) / 2,
                  top: -35,
                }}
              >
                <div className={styles.setTimeBar}>{displayPopUpTimeBar()}</div>
                <div className={styles.popupBar_stair}></div>
              </div>
            ) : (
              <></>
            )}
            {displayRotorSettings ? <RotorSettings /> : <></>}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Player;
