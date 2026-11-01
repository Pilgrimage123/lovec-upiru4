import React from "react";
import { createRoot } from "react-dom/client";
import { Home } from "./routes/index";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<Home />);
}
