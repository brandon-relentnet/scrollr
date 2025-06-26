import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { initializeProxyStore } from "@/entrypoints/store/proxyStore.js";
import { Provider } from "react-redux";
import "./style.css";

initializeProxyStore().then((store: any) => {
  ReactDOM.createRoot(document.getElementById("root_iframe")!).render(
    <Provider store={store as any}>
      <App />
    </Provider>
  );
});
