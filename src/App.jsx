import React from 'react';
import TodoApp from './TodoApp'; // <-- Import your main component

function App() {
  return (
    // You can wrap your component in a div or fragment if needed
    <div className="App"> 
      <TodoApp />
    </div>
  );
}

export default App;