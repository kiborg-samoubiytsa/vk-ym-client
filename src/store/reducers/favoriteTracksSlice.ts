import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import axios from "axios";

interface FavoriteTracks {
  ids: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: FavoriteTracks = {
  ids: [],
  status: "idle",
};

export const fetchFavoriteTracks = createAsyncThunk(
  "favoriteTracks/fetch",
  async () => {
    const userData = JSON.parse(localStorage.getItem("user-data") || "");
    const { data } = await axios.get(
      `http://localhost:3002/api/tracks/favorite/uid=${userData.uid}/token=${userData.token}`
    );
    return data;
  }
);

const favoriteTracks = createSlice({
  name: "favoriteTracks",
  initialState,
  reducers: {
    setFavoriteTrackIds(state, action: PayloadAction<string[]>) {
      state.ids = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchFavoriteTracks.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchFavoriteTracks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFavoriteTracks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.ids = action.payload;
      });
  },
});

export const favoriteTrackIds = (state: RootState) =>
  state.favoriteTracksSliceReducer.ids;
export const favoriteTrackStatus = (state: RootState) =>
  state.favoriteTracksSliceReducer.status;
export const { setFavoriteTrackIds } = favoriteTracks.actions;
export default favoriteTracks.reducer;
