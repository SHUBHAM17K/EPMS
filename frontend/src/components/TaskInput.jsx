import React, { useState } from 'react';

const TaskInput = ({ onAddTask, isAdding }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim());
    setTitle('');
  };

  return (
    <form className="task-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="task-input-field"
        placeholder="Type a new task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isAdding}
        maxLength={100}
        required
      />
      <button 
        type="submit" 
        className="btn btn-primary btn-add" 
        disabled={isAdding || !title.trim()}
        id="btn-add-task"
      >
        {isAdding ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  );
};

export default TaskInput;
