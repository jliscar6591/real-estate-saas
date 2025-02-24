import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")!).render(

  <React.StrictMode>
    <div style={{display: 'flex', height: '100%', width: '100%'}}>
      <App />
    </div>
  </React.StrictMode>
);
