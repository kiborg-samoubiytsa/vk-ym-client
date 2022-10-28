import { FC, useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import { IPlaylist } from "../../types/types";
import { PlaylistCover } from "../Playlist/PlaylistCover";
import styles from "./UserPlaylists.module.scss";

export const UserPlaylists: FC = () => {
  const sessionStoragePlaylists = sessionStorage.getItem("user-playlists")
    ? JSON.parse(sessionStorage.getItem("user-playlists") || "")
    : [];
  const userData = JSON.parse(localStorage.getItem("user-data") || "");
  const { data, error } = useFetch<IPlaylist[]>(
    `http://localhost:3002/user-playlists/username=${userData.username}/password=${userData.password}`
  );
  useEffect(() => {
    if (sessionStoragePlaylists.length == 0 && data) {
      sessionStorage.setItem("user-playlists", JSON.stringify(data));
    }
    console.log(data);
  });
  return (
    <>
      <div className={styles.userPlaylists}>
        {!error ? (
          sessionStoragePlaylists.length > 0 ? (
            sessionStoragePlaylists?.map(
              (playlist: IPlaylist, index: number) => (
                <PlaylistCover key={index} playlistInfo={playlist} />
              )
            )
          ) : (
            data?.map((playlist, index) => (
              <PlaylistCover key={index} playlistInfo={playlist} />
            ))
          )
        ) : (
          <></>
        )}
      </div>
    </>
  );
};
