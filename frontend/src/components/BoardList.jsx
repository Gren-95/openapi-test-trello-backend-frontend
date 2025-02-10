import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EditableText from './EditableText';

function BoardList() {
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/boards');
      const data = await response.json();
      setBoards(data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/v1/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newBoardName }),
      });
      const data = await response.json();
      setBoards([...boards, data]);
      setNewBoardName('');
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const deleteBoard = async (e, boardId) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    
    if (!confirm('Are you sure you want to delete this board?')) return;
    
    try {
      await fetch(`http://localhost:3000/api/v1/boards/${boardId}`, {
        method: 'DELETE',
      });
      setBoards(boards.filter(board => board.id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const updateBoardName = async (boardId, newName) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/boards/${boardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });
      const updatedBoard = await response.json();
      setBoards(boards.map(board => 
        board.id === boardId ? updatedBoard : board
      ));
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };

  return (
    <div className="container">
      <h1>Trello Clone</h1>
      
      <form onSubmit={createBoard} className="create-board-form">
        <input
          type="text"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder="Enter board name"
          required
        />
        <button type="submit">Create Board</button>
      </form>

      <div className="board-list">
        {boards.map((board) => (
          <Link to={`/boards/${board.id}`} key={board.id} className="board-card">
            <div className="board-card-header">
              <EditableText
                initialValue={board.name}
                onSave={(newName) => updateBoardName(board.id, newName)}
                className="board-title"
                tag="h3"
              />
              <button
                className="delete-btn"
                onClick={(e) => deleteBoard(e, board.id)}
              >
                ×
              </button>
            </div>
            <p>Created: {new Date(board.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BoardList;