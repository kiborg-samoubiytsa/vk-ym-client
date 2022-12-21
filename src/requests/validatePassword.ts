import axios from "axios";

export const validatePassword = async (
  username: string | undefined,
  password: string | undefined
) => {
  try {
    if (username && password) {
      const { data } = await axios.get(
        `http://localhost:3002/api/validate-password/username=${username}/password=${password}`
      );
      return data;
    }
  } catch (error) {
    return false;
  }
};
