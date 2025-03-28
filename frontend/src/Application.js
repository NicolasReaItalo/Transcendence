/**

 */
import Avatar from "./Avatar.js";
import Localization from "./Localization.js";
import Router from "./Router.js";
import LandingView from "./views/LandingView.js";
import TRequest from "./TRequest.js";

class Application {
  /**
   * A placeholder class, I'm not really sure for what
   * it will be used. It's not supposed to be instantiated but instead
   * give access to useful methods and store the JWT token and some infos for the views
   */
  static #token = null;
  static #userInfos = {
    userId: null,
    userName: null,
    nickname: null,
    twofa: null,
  };
  static mainSocket = null;
  static gameSocket = null;
  static lang = this.getLanguageCookie() || "en-us";
  static localization = new Localization(Application.lang);
  static translationsCache = {};
  static activeProfileView = "avatar"; //test to make the view in account mgmt ersistant upon language change
  static navButtonProfile = "nav-avatar";
  static tournamentPanelStatus = 0;
  static joinedTournament = "";
  //Placeholder to store timeouts to clear them nicely in onDestroy()
  static timeoutId = null;

  constructor() {
    throw new Error("Application class must not be instantiated.");
  }

  static resetApplication(){
    Application.#token = null;
    Application.#userInfos = {
      userId: null,
      userName: null,
      nickname: null,
      twofa: null,
    };
    Application.mainSocket = null;
    Application.gameSocket = null;
    Application.lang = this.getLanguageCookie() || "en-us";
    Application.localization = new Localization(Application.lang);
    Application.translationsCache = {};
    Application.activeProfileView = "avatar"; //test to make the view in account mgmt ersistant upon language change
    Application.navButtonProfile = "nav-avatar";
    Application.tournamentPanelStatus = 0;
    Application.joinedTournament = "";
    //Placeholder to store timeouts to clear them nicely in onDestroy()
    Application.timeoutId = null;
  }

  static setToken(newtoken) {
    if (
      !Object.hasOwn(newtoken, "access") ||
      !Object.hasOwn(newtoken, "refresh")
    )
      throw `invalid token: ${newtoken}`;
    try {
      const access = Application.#_parseToken(newtoken.access);
      if (access.header.typ !== "JWT")
        throw new Error("Application.setToken : token is not JWT");
      Application.#_parseToken(newtoken.refresh);
      Application.#token = newtoken;
    } catch (error) {
      throw new Error(`Failed to parse and store the token: ${error}`);
    }
  }

  static setAccessToken(newAccesstoken) {
    Application.#token.access = newAccesstoken;
  }

  static deleteAccessToken() {
    Application.#token = null;
  }

  static deleteRefreshToken() {
    Application.#token = null;
  }

  static getAccessToken() {
    if (Application.#token !== null) return Application.#token.access;
    return null;
  }

  static getRefreshToken() {
    if (Application.#token !== null) return Application.#token.refresh;
    return null;
  }

  static setUserInfosFromToken() {
    if (Application.#token !== null) {
      try {
        const token = Application.#_parseToken(Application.#token.access);
        Application.#userInfos.userId = token.payload.user_id;
        Application.#userInfos.userName = token.payload.username;
        Application.#userInfos.nickname = token.payload.nickname;
        Application.#userInfos.twofa = token.payload.twofa;
        Application.#userInfos.lang = token.payload.lang;
      } catch (error) {
        console.log(`Application: Error during userInfos setting : ${error}`);
      }
    }
  }

  static setUserInfos(infos) {
    Application.#userInfos.userId = infos.id;
    Application.#userInfos.userName = infos.username;
    Application.#userInfos.nickname = infos.nickname;
    Application.#userInfos.lang = infos.lang;
  }

  static setTwofa(value) {
    Application.#userInfos.twofa = value;
  }

  static getUserInfos() {
    return Application.#userInfos;
  }

  static #_parseToken(token) {
    let HeaderBase64Url = token.split(".")[0];
    let PayloadBase64Url = token.split(".")[1];
    let HeaderBase64 = HeaderBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    let PayloadBase64 = PayloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    let jsonPayload = decodeURIComponent(
      window
        .atob(PayloadBase64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    let jsonHeader = decodeURIComponent(
      window
        .atob(HeaderBase64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return {
      header: JSON.parse(jsonHeader),
      payload: JSON.parse(jsonPayload),
    };
  }
  //Check if the access token stored in the Application class has not expired.
  // return Bool
  static checkAccessTokenValidity() {
    if (Application.#token.access === null) return false;
    try {
      const access = Application.#_parseToken(Application.#token.access);
      if (access.payload.exp <= Math.floor(Date.now() / 1000)) return false;
      return true;
    } catch (error) {
      return false;
    }
  }
  //try to refresh the JWT token. Throw an Error() if the refreshing did not succeed
  static async refreshToken() {
    const refresh = Application.getRefreshToken();
    if (refresh === null) throw new Error("No refresh token");

    const response = await fetch("/api/users/refresh/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: Application.getRefreshToken() }),
    });

    if (!response.ok) {
      throw new Error("The server refused to refresh the token");
    }

    const json = await response.json();
    if (!json.access) {
      throw new Error(`Invalid refresh token: ${JSON.stringify(json)}`);
    }
    Application.setAccessToken(json.access);
  }

  static openWebSocket(url) {
    if (Application.#token === null) {
      // Correct the check
      console.log(`Application: Error opening WebSocket: user not identified`);
      return null;
    }
    if (!url) {
      console.log("WebSocket URL must be provided.");
      return null;
    }
    const fullpath = `${url}?token=${Application.getAccessToken()}`; // Fix token retrieval
    Application.mainSocket = new WebSocket(fullpath);

    // Add event listeners for debugging
    Application.mainSocket.onopen = () => {
      // console.log("WebSocket connection opened:", fullpath);
    };
    Application.mainSocket.onerror = (error) => {
      console.log("WebSocket error:", error);
    };
    Application.mainSocket.onclose = () => {
      // console.log("WebSocket connection closed.");
    };
    return Application.mainSocket;
  }

  static openGameSocket(url) {
    if (Application.#token === null) {
      // Correct the check
      console.log(`Application: Error opening WebSocket: user not identified`);
      return null;
    }
    if (!url) {
      console.log("WebSocket URL must be provided.");
      return null;
    }
    const fullpath = `${url}?token=${Application.getAccessToken()}`; // Fix token retrieval
    Application.gameSocket = new WebSocket(fullpath);

    // Add event listeners for debugging
    Application.gameSocket.onopen = () => {
      // console.log("gameSocket connection opened:", fullpath);
    };
    Application.gameSocket.onerror = (error) => {
      console.log("gameSocket error:", error);
    };
    Application.gameSocket.onclose = () => {
      // console.log("gameSocket connection closed.");
    };
    return Application.gameSocket;
  }

  static toggleLangSelectorHide() {
    const langSelect = document.querySelector("#language-selector-container");
    langSelect.classList.add("d-none");
  }

  static toggleLangSelectorShow() {
    const langSelect = document.querySelector("#language-selector-container");
    const langSelectId = document.querySelector("#lang-select");
    langSelectId.value = Application.lang; //Added these lines to update the lang selector button in case the language was changed by the system
    langSelect.classList.remove("d-none");
  }

  static async toggleSideBar() {
    const sideBar = document.querySelector("#sidebar");
    const avatarImg = document.querySelector("#side-img");
    const userId = Application.getUserInfos().userId;
    // document.querySelector("#side-username").textContent =
    //   Application.getUserInfos().userName;
    avatarImg.setAttribute("data-avatar", userId);
    await Avatar.refreshAvatars();
    sideBar.classList.remove("d-none");
  }

  static hideSideBar() {
    const sideBar = document.querySelector("#sidebar");
    sideBar.classList.add("d-none");
  }

  static toggleChat() {
    const chatBox = document.querySelector("#chat-btn");
    chatBox.classList.remove("d-none");
  }

  //NEW AV - setting a cookie to store the language and make it persistant

  static setLanguageCookie(lang) {
    document.cookie = `language=${lang}; path=/; max-age=${30 * 24 * 60 * 60}`; //30 days duration
  }

  static getLanguageCookie() {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === "language") {
        // console.log("Le cookie = ", value);
        return value;
      }
    }
    return null;
  }

  //ENDOFNEW

  static async retrieveDBLang() {
    const lang = await Application.getUserInfos().lang;
    if (lang === "null") return Application.lang;
    else if (lang && Application.lang !== lang) {
      Application.lang = lang;
      this.localization.lang = lang;
    }
    // console.log("The language retrieved in DB is = ", lang);
    // console.log("Application language =", Application.lang);
    return lang;
  }

  static async setLanguage(lang) {
    Application.lang = lang;
    if (lang !== this.localization.lang) {
      this.localization.lang = lang;
      if (location.pathname !== "/landing") {
        await this.updateLanguageInDatabase();
      }
      this.setLanguageCookie(lang);
    }
    await this.localization.loadTranslations();
    await Application.applyTranslations();
  }

  static async updateLanguageInDatabase() {
    try {
      const lang = Application.lang;
      const newLang = await TRequest.request("POST", "/api/users/lang/", {
        lang: lang,
      });
      // console.log("Language has been updated:");
    } catch (error) {
      console.log(`Error updating language ${error}`);
    }
  }

  static async applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");

    elements.forEach(async (el) => {
      const translationKey = el.getAttribute("data-i18n");
      const translation = await Application.localization.t(translationKey);

      if (translation) {
        if (el.hasAttribute("placeholder")) {
          el.setAttribute("placeholder", translation);
        } else {
          el.textContent = translation;
        }
      }
    });
  }

  static async listenForLanguageChange(event) {
    const selectedLanguage = event.target.value;
    // console.log("Language change detected :", selectedLanguage);
    await Application.setLanguage(selectedLanguage);
    Router.reroute(location.pathname);
  }
}

export default Application;
