import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";

const PUBLISHABLE_KEY =
  "pk_test_Z3VpZGluZy1jb2x0LTQ4LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Provider>
        <App />
      </Provider>
    </ClerkProvider>
  </StrictMode>,
);
