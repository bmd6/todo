document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.getElementsByClassName('launcherButton');
    const addButton = document.getElementById('addButton');
    const modal = document.getElementById('modal');
    const closeButton = document.getElementsByClassName('close')[0];
    const saveButton = document.getElementById('saveButton');

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            launchTarget(target);
        });
    }

    addButton.addEventListener('click', function() {
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    saveButton.addEventListener('click', function() {
        const buttonText = document.getElementById('buttonText').value;
        const targetType = document.getElementById('targetType').value;
        const targetValue = document.getElementById('targetValue').value;
    
        if (buttonText && targetValue) {
            const newButton = {
                text: buttonText,
                target: getTargetPrefix(targetType) + targetValue
            };
    
            fetch('/save-button', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newButton)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload(); // Refresh the page to display the new button
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    
            modal.style.display = 'none';
            document.getElementById('buttonText').value = '';
            document.getElementById('targetValue').value = '';
        }
    });
    

    function getTargetPrefix(targetType) {
        switch (targetType) {
            case 'url':
                return '';
            case 'program':
                return 'program:';
            case 'directory':
                return 'file:';
            default:
                return '';
        }
    }

    function launchTarget(target) {
        fetch('/launch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ target: target })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to launch target:', target);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    fetchTodoList();

    function fetchTodoList() {
        fetch('/todo-list')
            .then(response => response.json())
            .then(data => {
                renderTodoList(data.todoList);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function renderTodoList(todoList) {
        const todoTableBody = document.querySelector('#todoTable tbody');
        todoTableBody.innerHTML = '';
    
        // Sort the to-do list based on completion status and date
        todoList.sort((a, b) => {
            if (a.status === 'Complete' && b.status !== 'Complete') {
                return 1;
            } else if (a.status !== 'Complete' && b.status === 'Complete') {
                return -1;
            } else if (a.status === 'Complete' && b.status === 'Complete') {
                return new Date(b.completedOn) - new Date(a.completedOn);
            } else {
                return 0;
            }
        });
    
        todoList.forEach(todo => {
            const row = document.createElement('tr');
            row.classList.add(todo.status === 'Complete' ? 'completed' : '');
            row.innerHTML = `
                <td><input type="text" value="${todo.task}"></td>
                <td>
                    <select>
                        <option value="Low" ${todo.priority === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${todo.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${todo.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Fire" ${todo.priority === 'Fire' ? 'selected' : ''}>Fire</option>
                    </select>
                </td>
                <td><input type="date" value="${todo.ecd}"></td>
                <td><input type="text" value="${todo.poc}"></td>
                <td>
                    <select>
                        <option value="Not Started" ${todo.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="In-Progress" ${todo.status === 'In-Progress' ? 'selected' : ''}>In-Progress</option>
                        <option value="Complete" ${todo.status === 'Complete' ? 'selected' : ''}>Complete</option>
                    </select>
                </td>
                <td>${todo.completedOn || ''}</td>
            `;
            todoTableBody.appendChild(row);
        });
    

        // Add empty rows if the number of rows is less than 3
        const emptyRowsCount = 3 - todoList.length;
        for (let i = 0; i < emptyRowsCount; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text"></td>
                <td>
                    <select>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Fire">Fire</option>
                    </select>
                </td>
                <td><input type="date"></td>
                <td><input type="text"></td>
                <td>
                    <select>
                        <option value="Not Started">Not Started</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Complete">Complete</option>
                    </select>
                </td>
            `;
            todoTableBody.appendChild(row);
        }

        // Add event listener to the last row to save the to-do list
        const lastRow = todoTableBody.lastElementChild;
        const inputs = lastRow.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', saveTodoList);
        });
    }

    function saveTodoList() {
        const todoTableBody = document.querySelector('#todoTable tbody');
        const rows = todoTableBody.getElementsByTagName('tr');
        const todoList = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const task = row.querySelector('input[type="text"]').value;
            const priority = row.querySelector('select').value;
            const ecd = row.querySelector('input[type="date"]').value;
            const poc = row.querySelectorAll('input[type="text"]')[1].value;
            const status = row.querySelectorAll('select')[1].value;
            const completedOn = status === 'Complete' ? new Date().toISOString().split('T')[0] : '';
    
            if (task || priority || ecd || poc || status) {
                todoList.push({ task, priority, ecd, poc, status, completedOn });
            }
        }

        fetch('/save-todo-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ todoList })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchTodoList();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});