(function () {
  const get = (target) => {
    return document.querySelector(target);
  };
  const API_URL = `http://localhost:3000/todos`;
  const $todoList = get(".todo_list");
  const $form = get(".todo_form");
  const $pagination = get(".pagination");
  const $todoInput = get(".todo_input");

  const limit = 5;
  let currentPage = 1;
  const pageCount = 5;
  let totalCount = 53;

  const pagination = () => {
    let totalPage = Math.ceil(totalCount / limit);
    let pageGroup = Math.ceil(currentPage / pageCount);
    let lastNum = pageGroup * pageCount;
    if (lastNum > totalPage) {
      lastNum = totalPage;
    }
    // 첫번째 숫자는 마지막 숫자에서 전체 카운트 - 1
    let firstNum = lastNum - (pageCount - 1);

    const next = lastNum + 1;
    const prev = firstNum - 1;

    let html = "";
    if (prev > 0) {
      html += "<button class='prev' data-fn='prev'>이전</button> ";
    }

    for (let i = firstNum; i <= lastNum; i += 1) {
      html += `<button class="pageNumber" id="page_${i}">${i}</button>`;
    }

    if (lastNum < totalPage) {
      html += `<button class='next' data-fn='next'>다음</button>`;
    }

    $pagination.innerHTML = html;

    const $currentPageNum = get(`.pageNumber#page_${currentPage}`);
    $currentPageNum.style.color = "#9dc0e8";

    const $currentPageNums = document.querySelectorAll(".pagination button");
    $currentPageNums.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.fn === "prev") {
          currentPage = prev;
        } else if (button.dataset.fn === "next") {
          currentPage = next;
        } else {
          currentPage = button.innerText;
        }
        pagination();
        getTodos();
      });
    });
  };

  const createTodoElement = (item) => {
    const { id, content, completed } = item;
    const $todoItem = document.createElement("div");
    const isChecked = completed ? "checked" : "";
    $todoItem.classList.add("item");
    $todoItem.dataset.id = id;
    $todoItem.innerHTML = `
            <div class="content">
              <input
                type="checkbox"
                class='todo_checkbox'
                ${isChecked}
              />
              <label>${content}</label>
              <input type="text" value="${content}" />
            </div>
            <div class="item_buttons content_buttons">
              <button class="todo_edit_button">
                <i class="far fa-edit"></i>
              </button>
              <button class="todo_remove_button">
                <i class="far fa-trash-alt"></i>
              </button>
            </div>
            <div class="item_buttons edit_buttons">
              <button class="todo_edit_confirm_button">
                <i class="fas fa-check"></i>
              </button>
              <button class="todo_edit_cancel_button">
                <i class="fas fa-times"></i>
              </button>
            </div>
      `;
    return $todoItem;
  };
  // todos item 넣기
  const renderAllTodos = (todos) => {
    $todoList.innerHTML = "";
    todos.forEach((item) => {
      const todosEl = createTodoElement(item);
      $todoList.appendChild(todosEl);
    });
  };
  // json-server에서 db데이터 가져오기
  const getTodos = () => {
    fetch(`${API_URL}?_page=${currentPage}&_limit=${limit}`)
      .then((response) => response.json())
      .then((todos) => {
        renderAllTodos(todos);
      })
      .catch((error) => console.error(error.message));
  };

  // todos 추가
  const addTodo = (e) => {
    // 새로고침이 안되게
    e.preventDefault();
    // todo 데이터 input입력값
    const todo = {
      content: $todoInput.value,
      completed: false,
    };

    // 입력값 보내기
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(todo),
    }).then(getTodos);

    // 검색 후 value 초기화 및 focus
    $todoInput.value = "";
    $todoInput.focus();
  };

  // todos check 확인
  const toggleTodo = (e) => {
    if (e.target.className !== "todo_checkbox") return;
    // closest = click위치에 가까운 item요소를 반환
    const $item = e.target.closest(".item");
    const id = $item.dataset.id;
    const completed = e.target.checked;
    // 찾은 item의 id값과 completed값을 확인하여 변경
    fetch(`${API_URL}/${id}`, {
      // completed만 변경을 하기 때문에 put이 아닌 patch 사용
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
    })
      .then(getTodos)
      .catch((error) => console.error(error));
  };
  // edit 수정 버튼 활성화 및 닫기
  const changeEditMode = (e) => {
    const $item = e.target.closest(".item");
    const $label = $item.querySelector("label");
    const $editInput = $item.querySelector('input[type="text"]');
    const $contentButtons = $item.querySelector(".content_buttons");
    const $editButtons = $item.querySelector(".edit_buttons");
    const value = $editInput.value;
    if (e.target.className === "todo_edit_button") {
      $label.style.display = "none";
      $editInput.style.display = "block";
      $contentButtons.style.display = "none";
      $editButtons.style.display = "block";
      // 수정시 focus
      $editInput.focus();
      $editInput.value = "";
      $editInput.value = value;
    }

    if (e.target.className === "todo_edit_cancel_button") {
      $label.style.display = "block";
      $editInput.style.display = "none";
      $contentButtons.style.display = "block";
      $editButtons.style.display = "none";
      // 수정 취소시 원래 value로
      $editInput.value = $label.innerText;
    }
  };
  // 수정버튼 완료 후 반영
  const editTodo = (e) => {
    if (e.target.className !== "todo_edit_confirm_button") return;
    const $item = e.target.closest(".item");
    const id = $item.dataset.id;
    const $editInput = $item.querySelector('input[type="text"]');
    const content = $editInput.value;

    fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    })
      .then(getTodos)
      .catch((error) => console.error(error));
  };

  const removeTodo = (e) => {
    if (e.target.className !== "todo_remove_button") return;
    const $item = e.target.closest(".item");
    const id = $item.dataset.id;

    fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    })
      .then(getTodos)
      .catch((error) => console.error(error));
  };

  const init = () => {
    // html이 전부 실행되었을 때
    window.addEventListener("DOMContentLoaded", () => {
      getTodos();
      pagination();
    });

    $form.addEventListener("submit", addTodo);
    $todoList.addEventListener("click", toggleTodo);
    $todoList.addEventListener("click", changeEditMode);
    $todoList.addEventListener("click", editTodo);
    $todoList.addEventListener("click", removeTodo);
  };
  init();
})();
