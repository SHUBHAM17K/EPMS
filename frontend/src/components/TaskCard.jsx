import React from 'react';

const TaskCard = ({ task, onMarkDone, onDelete, isUpdating, isDeleting }) => {
  // Utility to format task timestamps
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`task-card ${task.status === 'done' ? 'task-card-done' : ''}`} id={`task-${task._id}`}>
      <div className="task-card-content">
        <h3 className="task-title">{task.title}</h3>
        <span className="task-date">Created {formatDate(task.createdAt)}</span>
      </div>
      <div className="task-card-actions">
        {task.status === 'pending' && (
          <button
            className="btn btn-sm btn-success"
            id={`btn-done-${task._id}`}
            onClick={() => onMarkDone(task._id)}
            disabled={isUpdating || isDeleting}
          >
            {isUpdating ? '...' : 'Mark as Done'}
          </button>
        )}
        <button
          className="btn btn-sm btn-danger"
          id={`btn-delete-${task._id}`}
          onClick={() => onDelete(task._id)}
          disabled={isUpdating || isDeleting}
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
