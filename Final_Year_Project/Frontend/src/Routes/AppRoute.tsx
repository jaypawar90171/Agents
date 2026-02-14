import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../screens/Home";
import Roadmap from "../screens/Roadmap";

export default function AppRoute() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
    </BrowserRouter>
  )
}
