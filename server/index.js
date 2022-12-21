const express = require("express");
const cors = require("cors");
const url = require("url");
const { YMApi, WrappedYMApi } = require("ym-api");
const { default: axios } = require("axios");

const api = new YMApi();

const wrappedApi = new WrappedYMApi();

const app = express();

const PORT = 3002;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/build"));
const initApi = async ({ username, password, token, uid }) => {
  if (username && password) {
    await api.init({
      username: username,
      password: password,
    });
  }
  if (token && uid) {
    await api.init({
      access_token: token,
      uid: uid,
    });
  }
};

const initWrappedApi = async ({ uid, token }) => {
  await wrappedApi.init({
    uid: uid,
    access_token: token,
  });
};

app.get(
  /\/api\/validate-password\/username=(.+)\/password=(.+)/,
  async (req, res) => {
    try {
      await initApi({ username: req.params["0"], password: req.params["1"] });
      const token = await api.user.token;
      const user = await api.getAccountStatus();
      const userId = user.account.uid;
      res.send({ token: token, uid: userId });
    } catch (error) {
      console.log(error);
      res.status(400).end();
    }
  }
);
app.get(
  /\/api\/rotor\/station=(.+)\/uid=(.+)\/token=(.+)/,
  async (req, res) => {
    try {
      const stationType = req.params[0];
      await initApi({ uid: req.params["1"], token: req.params["2"] });
      const userToken = api.user.token;
      console.log(api.user.token);
      const getRotor = await axios.get(
        `https://api.music.yandex.net/rotor/station/${stationType}/tracks?settings2=true` /*  "https://api.music.yandex.net/rotor/account/status" */,
        {
          headers: {
            Authorization: `OAuth ${userToken}`,
          },
        }
      );
      res.json(getRotor.data);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get("/", (req, res) => {
  try {
    console.log("121");
    res.status(200).sendFile(__dirname + "/build/index.html");
  } catch (error) {
    console.log(error);
  }
});

app.post(
  /\/api\/rotor\/station=(.+)\/settings\/uid=(.+)\/token=(.+)/,
  async (req, res) => {
    try {
      const body = req.body;
      if (!api.user.token) {
        const uid = req.params[1];
        const token = req.params[2];
        await initApi({ uid: uid, token: token });
      }
      const token = await api.user.token;
      const stationType = req.params[0];
      await axios.post(
        `https://api.music.yandex.net/rotor/station/${stationType}/settings2`,
        body,
        {
          headers: {
            Authorization: `OAuth ${token}`,
          },
        }
      );
      res.status(200).end();
    } catch (error) {
      console.log(error);
      res.status(400).end();
    }
  }
);

app.get(/\/api\/track\/similar\/id=(.+)\/token=(.+)/, async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.music.yandex.net/tracks/${req.params[0]}/similar`
    );
    console.log(data.result);
    res.send(data.result);
    res.status(200).end();
  } catch (error) {
    console.log(error);
  }
});

app.get(/\/api\/user-playlists\/uid=(.+)\/token=(.+)/, async (req, res) => {
  try {
    const uid = req.params[0];
    const token = req.params[1];
    await initApi({ uid: uid, token: token });
    const result = await api.getUserPlaylists(uid);
    const getFavourites = await api.getPlaylist(3, uid);
    res.send([
      {
        ...getFavourites,
        cover: {
          type: "pic",
          uri: "music.yandex.ru/blocks/playlist-cover/playlist-cover_like.png",
        },
        title: "Мне нравится",
      },
      ...result,
    ]);
  } catch (error) {
    console.log(error);
  }
});

app.post(/\/api\/play-audio\/uid=(.+)\/token=(.+)/, async (req, res) => {
  try {
    //TODO ПОЧИСТИТЬ КОД ЕПТА
    const clientNow = new Date();
    const userId = req.params[0];
    const userToken = req.params[1];
    console.log(userToken);
    const nowToISO = clientNow.toISOString();
    const yandexRequestJson = {
      ...req.body,
      "client-now": nowToISO,
      timestamp: nowToISO,
      uid: userId,
      "from-cache": "False",
    };

    const urlParams = Object.entries(yandexRequestJson)
      .map((e) => e.join("="))
      .join("&");

    console.log(`${urlParams}\n`);

    await axios.post(
      `https://api.music.yandex.net/play-audio?${urlParams}`,
      yandexRequestJson,
      {
        headers: {
          Authorization: `OAuth ${userToken}`,
          "X-Yandex-Music-Client-Now": nowToISO,
          "X-Yandex-Music-Client": "WindowsPhone/4.52",
          "X-Yandex-Music-Device":
            "os=Windows.Desktop; os_version=10.0.22000.978; manufacturer=Gigabyte Technology Co., Ltd.; model=Z370P D3; clid=WindowsPhone; device_id=03003236030060AC0500D30905000874050044A8060001000400AA1F010058040200CA3A0900E8A6; uuid=generated-by-music-f043d1b2-2e20-47ae-b5e8-9973ffeb4fde",
        },
      }
    );
    res.status(200).end();
  } catch (error) {
    res.send(error);
  }
});

app.get(/\/api\/track\/supplement\/id=(.+)\/token=(.+)/, async (req, res) => {
  try {
    const trackId = req.params[0];
    const token = req.params[1];
    const { data } = await axios.get(
      `https://api.music.yandex.net/tracks/${trackId}/supplement`,
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      }
    );
    const trackInfo = await api.getTrack(parseInt(trackId));
    console.log(data);
    res.send(data.result);
  } catch (error) {
    console.log(error);
  }
});

app.get(/\/api\/playlists\/info\/user=(.+)\/kind=(.+)/, async (req, res) => {
  try {
    const result = await wrappedApi.getPlaylist(
      `https://music.yandex.ru/users/${req.params["0"]}/playlists/${req.params["1"]}`
    );
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

app.get(/\/api\/album\/with-tracks\/id=(.+)/, async (req, res) => {
  try {
    const albumId = req.params[0];
    const { data } = await axios.get(
      `https://api.music.yandex.net/albums/${albumId}/with-tracks`
    ); //web-own_albums-album-track-fridge
    res.send(data.result);
  } catch (error) {
    console.log(error);
  }
});

app.get(/\/api\/rotor\/info\/token=(.+)/, async (req, res) => {
  try {
    const token = req.params[0];
    const { data } = await axios.get(
      "https://api.music.yandex.net/rotor/station/user:onyourwave/info",
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      }
    );
    res.send(data.result[0].settings2);
  } catch (error) {
    res.status(400).end();
    console.log(error);
  }
});

app.post(/\/api\/rotor\/feedback\/token=(.+)/, async (req, res) => {
  try {
    const userToken = req.params[0];
    const now = new Date();
    const requestData = { ...req.body, timestamp: now.toISOString() };
    console.log(requestData);
    const feedback = await axios.post(
      `https://api.music.yandex.net/rotor/station/user:onyourwave/feedback`,
      requestData,
      {
        headers: {
          Authorization: `OAuth ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(feedback.data);
    res.status(200).end();
  } catch (error) {
    console.log(error);
  }
});

app.get(
  /\/api\/get-mp3-link\/id=(.+)\/uid=(.+)\/token=(.+)/,
  async (req, res) => {
    try {
      const uid = req.params[1];
      const token = req.params[2];
      await initWrappedApi({ uid: uid, token: token });
      const trackId = req.params[0];
      const trackInfo = await api.getTrack(parseInt(trackId));
      const trackUrl = await wrappedApi.getMp3DownloadUrl(parseInt(trackId));
      res.send({ url: trackUrl, info: trackInfo });
      res.status(200).end();
    } catch (e) {
      console.log(e);
    }
  }
);

app.post(
  /\/api\/tracks\/favorite\/add-multiple\/uid=(.+)\/token=(.+)\/track-ids=(.+)/,
  async (req, res) => {
    try {
      const uid = req.params[0];
      const token = req.params[1];
      const params = new url.URLSearchParams({ "track-ids": req.params[2] });
      console.log(
        await axios.post(
          `https://api.music.yandex.net/users/${uid}/likes/tracks/add-multiple/`,
          params.toString(),
          {
            headers: {
              Authorization: `OAuth ${token}`,
              "content-type": "application/x-www-form-urlencoded",
            },
          }
        )
      );
      res.status(200).end();
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  /\/api\/tracks\/favorite\/remove\/uid=(.+)\/token=(.+)\/track-ids=(.+)/,
  async (req, res) => {
    try {
      const uid = req.params[0];
      const token = req.params[1];
      const params = new url.URLSearchParams({ "track-ids": req.params[2] });
      console.log(
        await axios.post(
          `https://api.music.yandex.net/users/${uid}/likes/tracks/remove/`,
          params.toString(),
          {
            headers: {
              Authorization: `OAuth ${token}`,
              "content-type": "application/x-www-form-urlencoded",
            },
          }
        )
      );
      res.status(200).end();
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(/\/api\/user-albums\/uid=(.+)\/token=(.+)/, async (req, res) => {
  try {
    const uid = req.params[0];
    const token = req.params[1];
    const { data } = await axios.get(
      `https://api.music.yandex.net/users/${uid}/likes/albums?rich=true`,
      { headers: { Authorization: `OAuth ${token}` } }
    );
    const mappedAlbums = data.result.map((e) => {
      if (e.album.metaType == "music") {
        return e.album;
      }
      return;
    });
    console.log(mappedAlbums);
    res.send(mappedAlbums);
  } catch (error) {
    console.log(error);
  }
});

app.get(
  /\/api\/user-albums\/podcasts\/uid=(.+)\/token=(.+)/,
  async (req, res) => {
    try {
      const uid = req.params[0];
      const token = req.params[1];
      const { data } = await axios.get(
        `https://api.music.yandex.net/users/${uid}/likes/albums?rich=true`,
        { headers: { Authorization: `OAuth ${token}` } }
      );
      const filteredAlbums = data.result.filter((e) => {
        return e.album.metaType == "podcast";
      });
      const mappedAlbums = filteredAlbums.map((e) => {
        return e.album;
      });
      console.log(mappedAlbums);
      res.send(mappedAlbums);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(/\/api\/tracks\/favorite\/uid=(.+)\/token=(.+)/, async (req, res) => {
  try {
    const uid = req.params[0];
    const token = req.params[1];
    const { data } = await axios.get(
      `https://api.music.yandex.net/users/${uid}/likes/tracks/`,
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      }
    );
    const trackIds = data.result.library.tracks.map((track) => {
      return track.id;
    });
    res.send(trackIds);
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(PORT);
});
