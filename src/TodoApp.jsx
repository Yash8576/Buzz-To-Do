// src/TodoApp.jsx

import React, { useState, useEffect } from "react";
import './TodoApp.css';
import Login from './Login';
import Signup from './Signup';
import { auth, db } from './firebase'; 
import { 
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    updateDoc, 
    query, 
    orderBy, 
    onSnapshot,
    deleteField
} from 'firebase/firestore';

function TodoApp() {
    const fabulousSentence = "Plan Your Day, Live Your Dream.";
    const [user, setUser] = useState(null); 
    const [isLoginView, setIsLoginView] = useState(true);
    const [todos, setTodos] = useState([]); 
    const [newTodo, setNewTodo] = useState("");
    
    // --- VIEW STATES ---
    const [viewFilter, setViewFilter] = useState('active'); 
    const [showDeleted, setShowDeleted] = useState(false); 

    // --- AUTHENTICATION & REAL-TIME LISTENER ---
    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser ? currentUser.email : null); 
        });
        return () => unsubscribeAuth();
    }, []);

    // Listen for Real-Time Task Changes
    useEffect(() => {
        if (user) {
            const tasksQuery = query(
                collection(db, 'users', user, 'tasks'),
                orderBy('timestamp', 'desc')
            );

            const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
                const tasksArray = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTodos(tasksArray); 
            });

            return () => unsubscribeTasks();
        } else {
            setTodos([]);
        }
    }, [user]);

    // --- FILTERING LOGIC ---

    const filteredTodos = todos.filter(todo => {
        if (todo.status === 'deleted') {
            return false;
        }
        if (viewFilter === 'active') {
            // Active view shows: active, started, stuck
            return !todo.completed; 
        }
        if (viewFilter === 'completed') {
            // Completed view shows: done
            return todo.completed; 
        }
        return false;
    });

    const deletedTodos = todos.filter(todo => todo.status === 'deleted');

    // --- HANDLERS ---
    
    const toggleAuthView = () => {
        setIsLoginView((prev) => !prev);
    };

    const handleAuthSuccess = () => {
        setIsLoginView(true);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // --- FIREBASE TODO LOGIC ---
    
    const addTodo = async (e) => {
        e.preventDefault(); 
        if (!user) return alert("Please log in to add tasks.");
        if (newTodo.trim() === "") return; 

        const taskId = Date.now().toString();
        const newTask = {
            id: taskId,
            text: newTodo.trim(),
            completed: false,
            status: 'active', 
            taskStatus: 'started', // <-- NEW DEFAULT: Starts as 'started'
            timestamp: Date.now(),
        };

        try {
            const taskDocRef = doc(db, 'users', user, 'tasks', taskId);
            await setDoc(taskDocRef, newTask); 
            setNewTodo("");
        } catch (error) {
            console.error("Error adding document:", error);
        }
    };

    // NEW: Function to handle status change via dropdown
    const updateTaskStatus = async (id, newStatus) => {
        if (!user) return;

        // Determine new 'completed' status based on 'newStatus'
        const isCompleted = (newStatus === 'done');

        try {
            const taskDocRef = doc(db, 'users', user, 'tasks', id);
            
            await updateDoc(taskDocRef, { 
                taskStatus: newStatus, 
                completed: isCompleted,
                status: 'active'
            });

            // Update view filter for better UX
            if (isCompleted) {
                setViewFilter('completed');
            } else {
                setViewFilter('active');
            }

        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const moveTaskToDeleted = async (id, isCompleted, currentTaskStatus) => {
        if (!user) return;
        try {
            const taskDocRef = doc(db, 'users', user, 'tasks', id);
            
            await updateDoc(taskDocRef, { 
                status: 'deleted', 
                deletedDate: Date.now(),
                sourceCompleted: isCompleted, 
                sourceTaskStatus: currentTaskStatus, 
            });
            
        } catch (error) {
            console.error("Error moving to deleted:", error);
        }
    };
    
    const restoreTask = async (id, sourceCompleted, sourceTaskStatus) => {
        if (!user) return;
        try {
            const taskDocRef = doc(db, 'users', user, 'tasks', id);

            const restoreView = sourceCompleted ? 'completed' : 'active';
            
            await updateDoc(taskDocRef, { 
                status: 'active',
                deletedDate: null,
                completed: sourceCompleted, 
                taskStatus: sourceTaskStatus, // Restore specific status
                
                sourceCompleted: deleteField(),
                sourceTaskStatus: deleteField(),
            });
            
            setViewFilter(restoreView); 
            setShowDeleted(false);
        } catch (error) {
            console.error("Error restoring task:", error);
        }
    };

    const permanentlyDeleteTask = async (id) => {
        if (!user) return;
        try {
            const taskDocRef = doc(db, 'users', user, 'tasks', id);
            await deleteDoc(taskDocRef);
        } catch (error) {
            console.error("Error permanently deleting task:", error);
        }
    };

    return (
        <div className="todo-container">
            <h1 className="header-text">{fabulousSentence}</h1>

            {user ? (
                // --- A. LOGGED IN VIEW ---
                <>
                    <div className="auth-status logged-in">
                        <p>Welcome back, **{user}**!</p>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                    
                    {/* ADD NEW TODO FORM */}
                    <form className="add-todo-form" onSubmit={addTodo}>
                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                        />
                        <button type="submit">Add Task</button>
                    </form>

                    {/* VIEW FILTERS */}
                    <div className="view-filters" style={{marginBottom: '20px', textAlign: 'center'}}>
                        <button 
                            onClick={() => { setViewFilter('active'); setShowDeleted(false); }} 
                            style={{fontWeight: (viewFilter === 'active' && !showDeleted) ? 'bold' : 'normal', marginRight: '10px'}}
                        >
                            Active ({todos.filter(t => !t.completed && t.status !== 'deleted').length})
                        </button>
                        <button 
                            onClick={() => { setViewFilter('completed'); setShowDeleted(false); }}
                            style={{fontWeight: (viewFilter === 'completed' && !showDeleted) ? 'bold' : 'normal', marginRight: '10px'}}
                        >
                            Done ({todos.filter(t => t.completed && t.status !== 'deleted').length})
                        </button>
                        <button 
                            onClick={() => setShowDeleted(prev => !prev)}
                            style={{fontWeight: showDeleted ? 'bold' : 'normal', color: showDeleted ? '#e74c3c' : 'inherit'}}
                        >
                            Deleted ({deletedTodos.length})
                        </button>
                    </div>

                    {/* Conditional Rendering for Deleted View */}
                    {showDeleted ? (
                        <div className="deleted-list todo-list">
                            <h2>Recently Deleted</h2>
                            {deletedTodos.length === 0 ? (
                                <p className="no-tasks">No recently deleted tasks.</p>
                            ) : (
                                deletedTodos.map((todo) => (
                                    <div key={todo.id} className="todo-item">
                                        <span className={'deleted-text'} style={{flexGrow: 1, color: '#95a5a6'}}>
                                            {todo.text}
                                            <i style={{fontSize: '0.8em', marginLeft: '10px'}} >(Was: {todo.sourceTaskStatus || 'active'})</i>
                                        </span>
                                        <button 
                                            className="restore-btn" 
                                            onClick={() => restoreTask(todo.id, todo.sourceCompleted, todo.sourceTaskStatus || 'active')}
                                            style={{backgroundColor: '#27ae60', marginRight: '10px'}}
                                        >
                                            Restore
                                        </button>
                                        <button 
                                            className="delete-btn" 
                                            onClick={() => permanentlyDeleteTask(todo.id)}
                                        >
                                            Delete Permanently
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // --- DISPLAY FILTERED TO-DO LIST (Active/Completed View) ---
                        <div className="todo-list" >
                            <h2>{viewFilter === 'active' ? 'Workflow Tasks' : 'Completed Tasks'}:</h2>
                            {filteredTodos.length === 0 ? ( 
                                <p className="no-tasks">
                                    {viewFilter === 'active' ? 'Nothing active! Great job!' : 'No completed tasks yet.'}
                                </p>
                            ) : (
                                filteredTodos.map((todo) => (
                                    <div key={todo.id} className="todo-item">
                                        
                                        {/* --- NEW STATUS PICKER (Replaces Checkbox) --- */}
                                        <div style={{ marginRight: '10px' }}>
                                            <select
                                                value={todo.taskStatus} 
                                                onChange={(e) => updateTaskStatus(todo.id, e.target.value)} 
                                                // Apply custom class for CSS coloring
                                                className={`status-picker status-${todo.taskStatus}`}
                                            >
                                                <option value="started">Started 🟠</option>
                                                <option value="stuck">Stuck 🔴</option>
                                                <option value="done">Done ✅</option>
                                            </select>
                                        </div>
                                        
                                        {/* Task Text */}
                                        <span 
                                            className={todo.completed ? 'completed' : ''}
                                            style={{flexGrow: 1, color: todo.taskStatus === 'stuck' ? '#c0392b' : 'inherit'}}
                                        >
                                            {todo.text}
                                        </span>
                                        
                                        {/* Delete Button (Moves to Deleted List) */}
                                        <button 
                                            className="delete-btn" 
                                            onClick={() => moveTaskToDeleted(todo.id, todo.completed, todo.taskStatus)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                // --- B. LOGGED OUT VIEW ---
                <div className="auth-view-wrapper">
                    <p className="auth-prompt">Please **Login** or **Sign Up** to manage your tasks.</p>
                    {isLoginView ? (
                        <Login 
                            switchToSignup={toggleAuthView}
                            onAuthSuccess={handleAuthSuccess}
                        />
                    ) : (
                        <Signup 
                            switchToLogin={toggleAuthView}
                            onAuthSuccess={handleAuthSuccess}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default TodoApp;