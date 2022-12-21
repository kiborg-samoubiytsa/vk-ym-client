import axios from "axios";
export const addTracksToFavorite = async (
  trackId: string | number,
  albumId: string | number
) => {
  const userData = JSON.parse(localStorage.getItem("user-data") || "");
  await axios.post(
    `http://localhost:3002/api/tracks/favorite/add-multiple/uid=${userData.uid}/token=${userData.token}/track-ids=${trackId}:${albumId}`,
    `${trackId}:${albumId}`
  );
};
