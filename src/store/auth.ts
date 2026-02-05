import { defineStore } from "pinia";

const TOKEN_KEY = "abyss_eye_token";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || "",
    username: localStorage.getItem("abyss_eye_username") || ""
  }),
  getters: {
    isAuthed: (s) => !!s.token
  },
  actions: {
    setAuth(token: string, username: string) {
      this.token = token;
      this.username = username;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem("abyss_eye_username", username);
    },
    logout() {
      this.token = "";
      this.username = "";
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("abyss_eye_username");
    }
  }
});
