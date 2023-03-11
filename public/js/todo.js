class ToDoList {
    constructor() {
        this.tasks = {};

        $.get({
            url: '/tasks/get',
            data: {},
            contentType: 'application/json; charset=utf-8'
        }, function(data, status) {
            if(!data.err) {
                for(let taskId in data.todo) {
                    let task = data.todo[taskId];
                    window.toDoList.tasks[task.task_id] = new Task(task);
                }
            } else {
                console.log("Error creating session.");
            }
        })
    }
    newTask(taskId, task_name) {
        window.toDoList.tasks[taskId] = new Task({
            task_id: taskId,
            task_name: task_name,
            completed: false
        })
    }

    setTaskCompleted(taskId) {
        this.tasks[taskId].setCompleted($(`[data-task=${taskId}] input`).is(":checked"));
    }
    setTaskName(taskId, task_name) {
        this.tasks[taskId].setTaskName(task_name);
    }
    deleteTask(taskId) {
        this.tasks[taskId].delete();
    }
}

window.toDoList = new ToDoList();

class Task {
    constructor(data) {
        this.taskId = data.task_id;
        this.taskName = data.task_name;
        this.completed = data.completed;

        $('#tasks').append(`<div data-task="${this.taskId}" class="bg-gray-300 text-black text-xl font-semibold px-12 py-6 mt-4 flex flex-wrap w-full items-center justify-between">
        <div class="flex flex-wrap items-center">
        <input id="Task" name="Task" type="checkbox"  onclick="window.toDoList.setTaskCompleted('${this.taskId}')" class="mx-1 h-8 w-8" ${this.completed ? "checked" : ""}>${this.taskName}
      </div>
        <button class="text-black" onclick="window.toDoList.deleteTask('${this.taskId}')">Delete</button>
      </div>`);
    }
    setCompleted(completed) {
        this.completed = completed;

        $.post({
            url: '/tasks/update',
            data: JSON.stringify({
                task_id: this.taskId,
                completed: this.completed
            }),
            contentType: 'application/json; charset=utf-8'
        }, function(data, status) {
            if(!data.err) {
                for(let taskId in data.todo) {
                    let task = data.todo[taskId];
                    window.toDoList.tasks[task.task_id] = new Task(task);
                }
                console.log(window.toDoList.tasks);
            } else {
                console.log("Error creating session.");
            }
        })
    }
    setTaskName(task_name) {

    }
    delete() {
        if(confirm("Are you sure you want to delete this task?")) {
            $.ajax({
                url: `/tasks/${this.taskId}`,
                //data: {},
                type: 'DELETE',
                contentType: 'application/json; charset=utf-8'
            }, function(data, status) {
            });
            $(`div[data-task=${this.taskId}]`).remove();
        }
    }
}

$(document).ready(function() {
    $('#addTask').click(function() {
        Swal.fire({
            title: 'Create a new task',
            input: 'text',
            inputAttributes: {
              autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Add Task',
            showLoaderOnConfirm: true,
            preConfirm: (task) => {
              return fetch("/tasks/create", {
                  method: "POST",
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      task_name: task
                  })
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(response.statusText)
                  }
                  return response.json()
                })
                .catch(error => {
                  Swal.showValidationMessage(
                    `Unable to add new task. ${error}`
                  )
                })
            },
            allowOutsideClick: () => !Swal.isLoading()
          }).then((result) => {
            if (result.isConfirmed) {
                window.toDoList.newTask(result.value.taskId, result.value.taskName);
            }
          })
    });
});