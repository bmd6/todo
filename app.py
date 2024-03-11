import json
from flask import Flask, render_template, request, jsonify
import webbrowser
import os
import subprocess

app = Flask(__name__)

# Update the path to the desired web browser executable
browser_path = 'C:/Program Files/Mozilla Firefox/firefox.exe'

@app.route('/')
def index():
    with open('buttons.json', 'r') as file:
        buttons = json.load(file)
    return render_template('index.html', buttons=buttons)

@app.route('/launch', methods=['POST'])
def launch():
    target = request.json['target']
    
    if target.startswith('http'):
        webbrowser.register('chrome', None, webbrowser.BackgroundBrowser(browser_path))
        webbrowser.get('chrome').open_new(target)
    elif target.startswith('program:'):
        program = target[8:]  # Remove the 'program:' prefix
        subprocess.Popen(program)
    elif target.startswith('file:'):
        path = target[5:]  # Remove the 'file:' prefix
        if os.path.isdir(path):
            subprocess.Popen(f'explorer "{path}"')
        else:
            os.startfile(path)
    else:
        try:
            subprocess.Popen(target)
        except FileNotFoundError:
            os.startfile(target)
    
    return jsonify({'success': True})

@app.route('/save-button', methods=['POST'])
def save_button():
    button_data = request.json
    with open('buttons.json', 'r') as file:
        buttons = json.load(file)
    buttons.append(button_data)
    with open('buttons.json', 'w') as file:
        json.dump(buttons, file)
    return jsonify({'success': True})

@app.route('/todo-list')
def get_todo_list():
    with open('todo.json', 'r') as file:
        todo_list = json.load(file)
    return jsonify({'todoList': todo_list})

@app.route('/save-todo-list', methods=['POST'])
def save_todo_list():
    todo_list = request.json['todoList']
    for todo in todo_list:
        if 'completedOn' not in todo:
            todo['completedOn'] = ''
    with open('todo.json', 'w') as file:
        json.dump(todo_list, file)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)