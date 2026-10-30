import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const url = window.location.hash + window.location.search;
const isAuthResponse = /[?#&]state=/.test(url) && /[?#&](code|error)=/.test(url);

if (isAuthResponse) {
  // Coming back from the Microsoft sign-in page: hand the response to MSAL and return to the app.
  import("@azure/msal-browser/redirect-bridge").then(({ broadcastResponseToMainFrame }) =>
    broadcastResponseToMainFrame().catch((e) => {
      console.error(e);
      window.location.replace(import.meta.env.BASE_URL);
    })
  );
} else {
  import("./App.jsx").then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  });
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  }
}
