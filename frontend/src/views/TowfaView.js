import Application from "../Application.js";
import AbstractView from "./AbstractView.js";
import Router from "../Router.js";
import TRequest from "../TRequest.js";
import Alert from "../Alert.js";

class TwofaView extends AbstractView {
    constructor(params) {
        super(params);
        this._setTitle("DefaultView");
        this.domText = {};
        this.messages = {};
        this.init();
    }

    async init() {
        await this.loadMessages();
        this.onStart();
    }
    
    async loadMessages() {
        Application.localization.loadTranslations()
        await Application.setLanguage(Application.lang);
        console.log("OK");
        this.domText.scanQR = await Application.localization.t("twofa.scanQR");
        this.domText.confirmActivation = await Application.localization.t("twofa.enterActivation");
        this.domText.twofaField = await Application.localization.t("twofa.field");
        this.messages.wentWrong = await Application.localization.t("twofa.errors.unexpected");
        this.messages.twofaSuccess = await Application.localization.t("twofa.success");
        this.messages.twofaInvalid = await Application.localization.t("twofa.invalid");
    }
    
    listenForLanguageChange() {
        const languageSelector = document.getElementById("language-selector-container");
        if (languageSelector) {
            this.addEventListener(languageSelector, "change", async (event) => {
                const selectedLanguage = event.target.value;
                console.log("Changement de langue détecté :", selectedLanguage);
    
                await Application.setLanguage(selectedLanguage);
                await this.loadMessages();
                await Application.applyTranslations();
    
                Router.reroute("/profile");
    
                // this._setHtml();
            });
        }
    }

    onStart() {
        this._setTitle("Profile");
        if (Application.getAccessToken() === null) {
            setTimeout(() => {
                Router.reroute("/landing");
            }, 50);
            return;
        }

        // Make the request to the API to get the PNG image
        TRequest.request("GET", `/api/users/totp/create/`)
            .then((response) => {
                this.imageBlob = response;
                this._setHtml();
            })
            .catch((error) => {
                Alert.errorMessage(this.messages.wentWrong, error.message);
            });
        this.listenForLanguageChange();

    }

    _setHtml() {
        const container = document.querySelector("#view-container");

        if (container) {
            // Create a blob URL from the binary PNG data
            const imageUrl = URL.createObjectURL(this.imageBlob);

            container.innerHTML = `
                <h1 class="text-white display-4">${this.domText.scanQR}</h1>
                <div class="row p-2 mb-0">
                    <div class="col-3 mx-1">
						
                        <img src="${imageUrl}" alt="QR Code" class="img-fluid">
                    </div>
                </div>    
<<<<<<< HEAD
                <h1 class="text-white display-4">${this.domText.confirmActivation}</h1>
                <div class="row p-2 mb-0">
                    <div class="col-3 mx-1">
                        <input type="text" id="twofa" class="form-control" placeholder="${this.domText.twofaField}">
=======
                <h1 class="text-white display-4">give your 2Fa code to confirm the activation</h1>
                <div class="row p-2 mb-0">
                    <div class="col-3 mx-1">
                        <input type="text" id="twofa" class="form-control" placeholder="2Fa code">
>>>>>>> b0e99fafb394e907ae552a14b670019ae31b6898
                    </div>
            `;
        container.querySelector("#twofa").addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const twofaCode = container.querySelector("#twofa").value;
                TRequest.request("POST", `/api/users/enable_twofa/`, { "twofa": twofaCode })
                    .then((response) => {
<<<<<<< HEAD
                        Alert.successMessage(this.messages.twofaSuccess);
                        Router.reroute("/profile");
                    })
                    .catch((error) => {
                        Alert.errorMessage(this.messages.twofaInvalid, error.message);
=======
                        Alert.successMessage("2FA code verified successfully");
                        Router.reroute("/profile");
                    })
                    .catch((error) => {
                        Alert.errorMessage("Invalid 2FA code", error.message);
>>>>>>> b0e99fafb394e907ae552a14b670019ae31b6898
                    });
                }
            });
        }
    }
}


export default TwofaView;
