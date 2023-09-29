import React from "react";
import { Route, Link, Router } from "wouter"; // Import wouter components and hooks
import SpotifyLoginModal from "./components/SpotifyLoginModal";

import Home from "./Home";
const App = () => {
  return (
    <Router>
      <Route path="/" component={SpotifyLoginModal} />
      <Route path="/Home" component={Home} />
    </Router>
  );
};

export default App;
