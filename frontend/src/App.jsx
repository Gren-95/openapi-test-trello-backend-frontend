import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BoardList from './components/BoardList'
import BoardDetail from './components/BoardDetail'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<BoardList />} />
          <Route path="/boards/:boardId" element={<BoardDetail />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
