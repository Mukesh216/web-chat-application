
import { BrowserRouter as Router } from "react-router-dom"
import { Route, Routes } from "react-router"

import Home from "./components/Home"
import Landing from "./components/Landing"




function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default App
