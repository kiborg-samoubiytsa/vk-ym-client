import { configureStore } from "@reduxjs/toolkit";
import playerSlice from "./reducers/playerSlice";
import currentTrack from "./reducers/currentTrackSlice";
import { playlistSlice } from "./reducers/selectedItemSlice";
import { currentQueueSlice } from "./reducers/currentQueueSlice";
import { rotorSliceReducer } from "./reducers/rotorSlice";
import favoriteTracksSliceReducer from "./reducers/favoriteTracksSlice";

export const store = configureStore({
  reducer: {
    playerSlice,
    currentTrack,
    playlistSlice,
    currentQueueSlice,
    rotorSliceReducer,
    favoriteTracksSliceReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
