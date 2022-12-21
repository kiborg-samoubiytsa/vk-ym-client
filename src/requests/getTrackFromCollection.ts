import axios from "axios";
import { Album, IPlaylist, AlbumWithTracks } from "../types/types";
export const getQueueFromCollection = async (
  type: "album" | "playlist",
  collection: Album | IPlaylist
): Promise<AlbumWithTracks | IPlaylist> => {
  const userData = JSON.parse(localStorage.getItem("user-data") || "");

  const url =
    type == "album"
      ? `http://localhost:3002/api/album/with-tracks/id=/${
          (collection as Album).id
        }`
      : `http://localhost:3002/api/playlists/info/user=${
          (collection as IPlaylist).owner.login
        }/kind=${(collection as IPlaylist).kind}/username=${
          userData.username
        }/password=${userData.password}/`;

  const { data } = await axios.get(url);

  return data;
};
