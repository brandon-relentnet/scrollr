import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root_iframe")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
