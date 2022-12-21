import { useEffect, FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import useFetch from "../../hooks/useFetch";
import { AppDispatch } from "../../store/store";
import { favoriteTrackIds } from "../../store/reducers/favoriteTracksSlice";
import { Album } from "../../types/types";
import { fetchFavoriteTracks } from "../../store/reducers/favoriteTracksSlice";
import "./Collection.scss";
import { AlbumCover } from "../CollectionCovers/AlbumCover";

export const UserPodcasts: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const favoriteTracks = useSelector(favoriteTrackIds);
  const userData = JSON.parse(localStorage.getItem("user-data") || "");
  const sessionStoragePodcasts = sessionStorage.getItem("user-podcasts")
    ? JSON.parse(sessionStorage.getItem("user-podcasts") || "")
    : [];
  const { data, error } = useFetch<Album[]>(
    `http://localhost:3002/api/user-albums/podcasts/uid=${userData.uid}/token=${userData.token}`
  );
  useEffect(() => {
    if (favoriteTracks.length == 0) {
      dispatch(fetchFavoriteTracks());
    }
  }, []);
  useEffect(() => {
    if (data != sessionStoragePodcasts && data) {
      sessionStorage.setItem("user-podcasts", JSON.stringify(data));
      console.log(data);
    }
  }, [data]);
  return (
    <div className="userCollectionContainer">
      <span className="collectionInfo">Аудиокниги и Подкасты</span>
      <div className="userCollection">
        {!error ? (
          sessionStoragePodcasts.length == 0 ? (
            data?.map((album: Album, index) =>
              album ? (
                <AlbumCover
                  key={index}
                  albumInfo={album}
                  metadata="web-own_podcasts-album-track-fridge"
                />
              ) : (
                <></>
              )
            )
          ) : (
            sessionStoragePodcasts.map((album: Album, index: number) =>
              album ? (
                <AlbumCover
                  key={index}
                  albumInfo={album}
                  metadata="web-own_podcasts-album-track-fridge"
                />
              ) : (
                <></>
              )
            )
          )
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
