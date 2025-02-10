import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditableText from './EditableText';

function BoardDetail() {
  const { boardId } = useParams();
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState({});
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState({});

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/boards/${boardId}/lists`);
        const data = await response.json();
        if (isSubscribed) {
          console.log('Setting lists:', data);
          setLists(data);
        }
      } catch (error) {
        console.error('Error fetching lists:', error);
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [boardId]);

  useEffect(() => {
    lists.forEach(list => {
      fetchCards(list.id);
    });
  }, [lists]);

  const fetchLists = async () => {
    try {
      console.log('Fetching lists for board:', boardId);
      const response = await fetch(`http://localhost:3000/api/v1/boards/${boardId}/lists`);
      const data = await response.json();
      console.log('Received lists:', data);
      setLists(data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchCards = async (listId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/lists/${listId}/cards`);
      const data = await response.json();
      setCards(prev => ({ ...prev, [listId]: data }));
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const createList = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/v1/boards/${boardId}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newListTitle }),
      });
      const data = await response.json();
      console.log('Created new list:', data);
      setLists([...lists, data]);
      setNewListTitle('');
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const createCard = async (listId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/lists/${listId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: newCardTitles[listId] || '',
          description: ''
        }),
      });
      const data = await response.json();
      setCards(prev => ({
        ...prev,
        [listId]: [...(prev[listId] || []), data]
      }));
      setNewCardTitles(prev => ({ ...prev, [listId]: '' }));
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const deleteList = async (listId) => {
    if (!confirm('Are you sure you want to delete this list and all its cards?')) return;
    
    try {
      await fetch(`http://localhost:3000/api/v1/lists/${listId}`, {
        method: 'DELETE',
      });
      setLists(lists.filter(list => list.id !== listId));
      const newCards = { ...cards };
      delete newCards[listId];
      setCards(newCards);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const deleteCard = async (listId, cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    try {
      await fetch(`http://localhost:3000/api/v1/cards/${cardId}`, {
        method: 'DELETE',
      });
      setCards(prev => ({
        ...prev,
        [listId]: prev[listId].filter(card => card.id !== cardId)
      }));
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceList = cards[source.droppableId] || [];
    const destList = destination.droppableId === source.droppableId 
      ? sourceList 
      : (cards[destination.droppableId] || []);
    
    const [movedCard] = sourceList.filter(card => card.id === draggableId);
    
    // Create new array copies
    const newSourceList = Array.from(sourceList);
    const newDestList = destination.droppableId === source.droppableId 
      ? newSourceList 
      : Array.from(destList);

    // Remove from source list
    newSourceList.splice(source.index, 1);

    // Add to destination list
    newDestList.splice(destination.index, 0, {
      ...movedCard,
      listId: destination.droppableId
    });

    // Update state
    setCards(prev => ({
      ...prev,
      [source.droppableId]: newSourceList,
      [destination.droppableId]: destination.droppableId === source.droppableId 
        ? newSourceList 
        : newDestList
    }));

    // Update the card's listId in the backend
    try {
      await fetch(`http://localhost:3000/api/v1/cards/${draggableId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId: destination.droppableId,
          position: destination.index
        }),
      });
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  const handleCardSubmit = (e, listId) => {
    e.preventDefault();
    if (newCardTitles[listId]?.trim()) {
      createCard(listId);
    }
  };

  const updateListTitle = async (listId, newTitle) => {
    try {
      console.log('Attempting to update list:', { listId, newTitle });
      
      // Find the current list to get its boardId
      const currentList = lists.find(l => l.id === listId);
      if (!currentList) {
        throw new Error(`List with ID ${listId} not found in current state`);
      }

      const response = await fetch(`http://localhost:3000/api/v1/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          boardId: currentList.boardId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update list: ${response.status}`);
      }
      
      const updatedList = await response.json();
      console.log('Successfully updated list:', updatedList);
      
      setLists(lists.map(list => 
        list.id === listId ? updatedList : list
      ));
    } catch (error) {
      console.error('Error updating list:', error);
      alert('Failed to update list: ' + error.message);
    }
  };

  const updateCardTitle = async (listId, cardId, newTitle) => {
    try {
      const currentCard = cards[listId]?.find(c => c.id === cardId);
      if (!currentCard) {
        throw new Error(`Card with ID ${cardId} not found in list ${listId}`);
      }

      const response = await fetch(`http://localhost:3000/api/v1/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          description: currentCard.description,
          listId: currentCard.listId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update card: ${response.status}`);
      }

      const updatedCard = await response.json();
      setCards(prev => ({
        ...prev,
        [listId]: prev[listId].map(card =>
          card.id === cardId ? updatedCard : card
        )
      }));
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update card: ' + error.message);
    }
  };

  return (
    <div className="board-detail">
      <div className="board-header">
        <Link to="/" className="back-button">
          ← Back to Boards
        </Link>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="lists-container">
          {lists.map(list => {
            if (!list || !list.id) {
              console.error('Invalid list object:', list);
              return null;
            }
            
            return (
              <div key={list.id} className="list">
                <div className="list-header">
                  <EditableText
                    initialValue={list.title}
                    onSave={(newTitle) => updateListTitle(list.id, newTitle)}
                    className="list-title"
                    tag="h3"
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deleteList(list.id)}
                  >
                    ×
                  </button>
                </div>
                <Droppable droppableId={list.id}>
                  {(provided) => (
                    <div 
                      className="cards"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {cards[list.id]?.map((card, index) => (
                        <Draggable 
                          key={card.id} 
                          draggableId={card.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                            >
                              <div className="card-header">
                                <EditableText
                                  initialValue={card.title}
                                  onSave={(newTitle) => updateCardTitle(list.id, card.id, newTitle)}
                                  className="card-title"
                                  tag="h4"
                                />
                                <button
                                  className="delete-btn"
                                  onClick={() => deleteCard(list.id, card.id)}
                                >
                                  ×
                                </button>
                              </div>
                              {card.description && <p>{card.description}</p>}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <div className="add-card">
                  <form onSubmit={(e) => handleCardSubmit(e, list.id)}>
                    <input
                      type="text"
                      value={newCardTitles[list.id] || ''}
                      onChange={(e) => setNewCardTitles(prev => ({ 
                        ...prev, 
                        [list.id]: e.target.value 
                      }))}
                      placeholder="Enter card title"
                    />
                    <button type="submit">Add Card</button>
                  </form>
                </div>
              </div>
            );
          })}
          
          <div className="add-list">
            <form onSubmit={createList}>
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title"
                required
              />
              <button type="submit">Add List</button>
            </form>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

export default BoardDetail; 