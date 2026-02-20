import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../screens/Home";
import Login from "../screens/Login";
import Roadmap from "../screens/Roadmap";
import Signup from "../screens/Signup";
import JobChat from "../screens/JobChat";
import Profile from "../screens/Profile";
import LandingPage from "../screens/LandingPage";

export default function AppRoute() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/chat" element={<JobChat />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
