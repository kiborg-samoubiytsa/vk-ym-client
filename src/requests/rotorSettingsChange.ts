import axios from "axios";
import { RotorSettings2 } from "../types/types";

/* moodEnergy: "all" | "sad" | "calm" | "fun" | "active";
language: "russian" | "not-russian" | "any"; 
diversity: "default" | "favorite" | "discover" | "popular";
*/

export const rotorSettingsChange = async (
  settings: RotorSettings2,
  station: any
) => {
  //TODO сделать интерфейс для station
  const userData = JSON.parse(localStorage.getItem("user-data") || "");
  await axios.post(
    `http://localhost:3002/api/rotor/station=${station}/settings/uid=${userData.uid}/token=${userData.token}`,
    settings
  );
};
