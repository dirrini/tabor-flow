import React from "react";

import ReactDOM from "react-dom/client";

import { ApolloProvider } from "@apollo/client/react";

import { apolloClient }
  from "./lib/apollo";

import App from "./App";
import { I18nProvider } from "./lib/i18n";

// @ts-ignore
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <I18nProvider><ApolloProvider
      client={apolloClient}
    >
      <App />
    </ApolloProvider></I18nProvider>
  </React.StrictMode>
);
