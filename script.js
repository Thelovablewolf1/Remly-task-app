document.addEventListener('DOMContentLoaded', function () {
    // Safe DOM selections
    const todoInput = document.getElementById('todoInput');
    const addBtn = document.getElementById('addBtn');
    const todoList = document.getElementById('todoList');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const itemsLeftSpan = document.getElementById('itemsLeft');
    const progressFill = document.getElementById('progressFill');
    const searchInput = document.getElementById('searchInput');
    const emptyState = document.getElementById('emptyState');
    const notification = document.getElementById('notification');
    const themeOptions = document.querySelectorAll('.theme-option');
    const inputWrapper = document.querySelector('.input-wrapper');

    if (!todoInput || !addBtn || !todoList || !clearCompletedBtn || !itemsLeftSpan || !progressFill || !searchInput || !emptyState || !notification || !inputWrapper) {
        console.error('One or more required DOM elements are missing. Please check your HTML IDs and classes.');
        return;
    }

    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let currentTheme = localStorage.getItem('theme') || 'default';
    let searchQuery = '';

    // Initialize
    renderTodos();
    updateStats();
    applyTheme(currentTheme);
    setActiveThemeOption();

    // Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addTodo();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTodos();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    searchInput.addEventListener('input', function () {
        searchQuery = this.value.toLowerCase();
        renderTodos();
    });

    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            const theme = this.dataset.theme;
            applyTheme(theme);
            localStorage.setItem('theme', theme);
            setActiveThemeOption();
        });
    });

    // Functions
    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            const newTodo = {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            todos.unshift(newTodo);
            saveTodos();
            todoInput.value = '';
            renderTodos();
            updateStats();
            showNotification('Task added successfully!');
            todoInput.focus();
        }
    }

    function renderTodos() {
        todoList.innerHTML = '';
        const filteredTodos = filterTodos();

        emptyState.classList.toggle('show', filteredTodos.length === 0);

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item';
            li.dataset.id = todo.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                toggleTodoComplete(todo.id);
                if (checkbox.checked) {
                    li.classList.add('completed-animation');
                    setTimeout(() => {
                        li.classList.remove('completed-animation');
                    }, 500);
                }
            });

            const span = document.createElement('span');
            span.className = 'todo-text';
            if (todo.completed) span.classList.add('completed');
            span.textContent = todo.text;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'todo-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTodo(todo.id);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTodo(todo.id);
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(actionsDiv);
            todoList.appendChild(li);

            // Animate the item
            setTimeout(() => {
                li.style.opacity = '1';
                li.style.transform = 'translateY(0)';
            }, 10);
        });
    }

    function filterTodos() {
        let filtered = todos.filter(todo => todo.text.toLowerCase().includes(searchQuery));

        if (currentFilter === 'active') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        }

        return filtered;
    }

    function toggleTodoComplete(id) {
        todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
        saveTodos();
        renderTodos();
        updateStats();

        const todo = todos.find(t => t.id === id);
        const message = todo.completed ? 'Task completed!' : 'Task marked active';
        showNotification(message);
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
        updateStats();
        showNotification('Task deleted');
    }

    function editTodo(id) {
        const todo = todos.find(t => t.id === id);
        const li = document.querySelector(`.todo-item[data-id="${id}"]`);
        const textSpan = li.querySelector('.todo-text');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'edit-input';

        textSpan.replaceWith(input);
        input.focus();

        function saveEdit() {
            const newText = input.value.trim();
            if (newText && newText !== todo.text) {
                todo.text = newText;
                saveTodos();
                showNotification('Task updated');
            }

            textSpan.textContent = newText || todo.text;
            input.replaceWith(textSpan);

            input.removeEventListener('blur', saveEdit);
            input.removeEventListener('keypress', handleKeyPress);
        }

        function handleKeyPress(e) {
            if (e.key === 'Enter') {
                saveEdit();
            }
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', handleKeyPress);
    }

    function clearCompleted() {
        if (!todos.some(todo => todo.completed)) {
            showNotification('No completed tasks to clear');
            return;
        }

        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
        updateStats();
        showNotification('Completed tasks cleared');
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const active = total - completed;

        itemsLeftSpan.textContent = `${active} ${active === 1 ? 'task' : 'tasks'} remaining`;

        const progress = total ? (completed / total) * 100 : 0;
        progressFill.style.width = `${progress}%`;
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function applyTheme(theme) {
        document.body.className = theme;
        currentTheme = theme;
    }

    function setActiveThemeOption() {
        themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === currentTheme);
        });
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Fancy input animation
    todoInput.addEventListener('focus', () => {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
        inputWrapper.style.boxShadow = `0 0 0 2px ${accent}`;
    });

    todoInput.addEventListener('blur', () => {
        inputWrapper.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    });
});