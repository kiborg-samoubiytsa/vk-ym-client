import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  AlbumWithTracks,
  FullTrackInfo,
  IPlaylist,
  SimilarTracks,
  Track,
  TrackSupplement,
} from "../../types/types";
import axios from "axios";
import { RootState } from "../store";

interface CollectionState {
  isPlaylistSelected: boolean;
  isTrackSelected: boolean;
  selectedItemInfo: IPlaylist | AlbumWithTracks | FullTrackInfo;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | undefined;
  selectedItemMetadata: string;
  type: "not-selected" | "playlist" | "album" | "track" | string;
}

const initialState: CollectionState = {
  isTrackSelected: false,
  isPlaylistSelected: false,
  selectedItemInfo: {} as IPlaylist | AlbumWithTracks,
  status: "idle",
  error: undefined,
  selectedItemMetadata: "",
  type: "not-selected",
};

export const fetchPlaylist = createAsyncThunk(
  "collection/fetchPlaylist",
  async ({ user, kind }: any): Promise<IPlaylist> => {
    console.log(user, kind);
    const { data } = await axios.get(
      `http://localhost:3002/api/playlists/info/user=${user}/kind=${kind}/`
    );
    console.log(data);
    return data;
  }
);
export const fetchAlbum = createAsyncThunk(
  "collection/fetchAlbum",
  async ({ albumId }: any): Promise<AlbumWithTracks> => {
    const { data } = await axios.get(
      `http://localhost:3002/api/album/with-tracks/id=${albumId}`
    );
    return data;
  }
);
export const fetchTrackInfo = createAsyncThunk(
  "collection/fetchTrackInfo",
  async ({
    trackId,
  }: {
    trackId: string | number;
  }): Promise<{
    supplement: TrackSupplement;
    similar: SimilarTracks;
  }> => {
    const userData = JSON.parse(localStorage.getItem("user-data") || "");
    const { data: trackSupplement } = await axios.get(
      `http://localhost:3002/api/track/supplement/id=${trackId}/token=${userData.token}`
    );
    const { data: similarTracks } = await axios.get(
      `http://localhost:3002/api/track/similar/id=${trackId}/token=${userData.token}`
    );
    console.log(trackSupplement.lyrics, similarTracks);
    return { supplement: trackSupplement, similar: similarTracks };
  }
);

export const currentPlaylistSlice = createSlice({
  name: "tracks",
  initialState,
  reducers: {
    setIsCollectionSelected(state, action: PayloadAction<boolean>) {
      state.isPlaylistSelected = action.payload;
    },
    setSelectedItemType(state, action: PayloadAction<CollectionState["type"]>) {
      state.type = action.payload;
    },
    setIsTrackSelected(state, action: PayloadAction<boolean>) {
      state.isTrackSelected = action.payload;
    },
    setItemMetadata(state, action: PayloadAction<string>) {
      state.selectedItemMetadata = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPlaylist.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchPlaylist.fulfilled, (state, action) => {
        state.selectedItemInfo = action.payload;
        state.status = "succeeded";
        state.type = "playlist";
      })
      .addCase(fetchPlaylist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchAlbum.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchAlbum.fulfilled, (state, action) => {
        state.selectedItemInfo = action.payload;
        state.status = "succeeded";
        state.type = "album";
      })
      .addCase(fetchAlbum.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchTrackInfo.fulfilled, (state, action) => {
        state.selectedItemInfo = action.payload;
        state.status = "succeeded";
        state.type = "track";
      })
      .addCase(fetchTrackInfo.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchTrackInfo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});
export const selectedCollection = (state: RootState) =>
  state.playlistSlice.selectedItemInfo;
export const status = (state: RootState) => state.playlistSlice.status;
export const isCollectionSelected = (state: RootState) =>
  state.playlistSlice.isPlaylistSelected;
export const isTrackSelected = (state: RootState) =>
  state.playlistSlice.isTrackSelected;
export const collectionType = (state: RootState) => state.playlistSlice.type;
export const selectedItemMeta = (state: RootState) =>
  state.playlistSlice.selectedItemMetadata;
export const {
  setIsCollectionSelected,
  setSelectedItemType,
  setIsTrackSelected,
  setItemMetadata,
} = currentPlaylistSlice.actions;
export const playlistSlice = currentPlaylistSlice.reducer;
