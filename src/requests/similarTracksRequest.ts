import axios from "axios";

export const getSimilarTracks = async (trackId: "string") => {
  try {
    const { data } = await axios.get(
      `http://localhost:3002/api/similar/${trackId}`
    );
    return { data };
  } catch (error) {
    console.log(error);
    return;
  }
};
