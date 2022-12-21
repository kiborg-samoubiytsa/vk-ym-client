import { FC, useState } from "react";
import "./App.scss";
import "../_global.scss";
import Player from "./YMPlayer/Player";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { UserPlaylistsPage } from "./pages/UserPlaylistsPage";
import Header from "./Header/Header";
import CurrentQueuePage from "./CurrentQueue/CurrentQueue";
import { Auth } from "./pages/Auth/Auth";
import { UserAlbumsPage } from "./pages/UserAlbumsPage";
import { UserPodcastsPage } from "./pages/UserPodcastsPage";
import { PlaylistPage } from "./pages/PlaylistPage/PlaylistPage";
const App: FC = () => {
  //TODO менять текущий плейлист только по нажатию на трек
  const [isQueueDisplayed, setIsQueueDisplayed] = useState(false);
  return (
    <>
      <Provider store={store}>
        {localStorage.getItem("user-data") ? (
          <Router>
            {isQueueDisplayed ? (
              <div>
                <CurrentQueuePage setIsQueueDisplayed={setIsQueueDisplayed} />
              </div>
            ) : (
              <div className="Content">
                <Header />
                <Routes>
                  <Route path="users/">
                    <Route
                      path=":userId/playlists"
                      element={<UserPlaylistsPage />}
                    />
                    <Route
                      path=":userId/albums"
                      element={<UserAlbumsPage />}
                    ></Route>
                    <Route
                      path=":userId/podcasts"
                      element={<UserPodcastsPage />}
                    ></Route>
                    <Route />
                  </Route>
                  <Route
                    path="users/:userId/playlists/:playlistId"
                    element={<PlaylistPage />}
                  />
                </Routes>
              </div>
            )}
            <div className="Player-Container">
              <Player
                isQueueDisplayed={isQueueDisplayed}
                setIsQueueDisplayed={setIsQueueDisplayed}
              />
            </div>
          </Router>
        ) : (
          <Auth />
        )}
      </Provider>
    </>
  );
};

export default App;
