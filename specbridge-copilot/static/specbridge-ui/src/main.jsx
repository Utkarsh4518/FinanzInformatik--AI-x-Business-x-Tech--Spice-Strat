import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { getForgeContext } from "./lib/forge";
import "./styles.css";

async function bootstrap() {
  const context = await getForgeContext();
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App context={context} />
    </React.StrictMode>
  );
}

bootstrap();
