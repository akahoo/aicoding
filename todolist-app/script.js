// Todolist 应用主逻辑
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.form = document.getElementById('todo-form');
        this.input = document.getElementById('todo-input');
        this.list = document.getElementById('todo-list');
        
        this.init();
    }
    
    init() {
        // 绑定表单提交事件
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });
        
        // 渲染初始待办事项
        this.render();
    }
    
    addTodo() {
        const text = this.input.value.trim();
        if (text) {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.todos.push(todo);
            this.saveToLocalStorage();
            this.render();
            this.input.value = ''; // 清空输入框
            this.input.focus(); // 重新聚焦到输入框
        }
    }
    
    toggleComplete(id) {
        this.todos = this.todos.map(todo => 
            todo.id === id ? {...todo, completed: !todo.completed} : todo
        );
        this.saveToLocalStorage();
        this.render();
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveToLocalStorage();
        this.render();
    }
    
    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    render() {
        if (this.todos.length === 0) {
            this.list.innerHTML = '<li class="empty-state">暂无待办事项，添加一个新的吧！</li>';
            return;
        }
        
        this.list.innerHTML = '';
        this.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="todo-text">${todo.text}</div>
                <div class="todo-actions">
                    <button class="action-btn complete-btn" onclick="app.toggleComplete(${todo.id})">
                        ${todo.completed ? '撤销' : '完成'}
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteTodo(${todo.id})">
                        删除
                    </button>
                </div>
            `;
            this.list.appendChild(li);
        });
    }
}

// 初始化应用
const app = new TodoApp();