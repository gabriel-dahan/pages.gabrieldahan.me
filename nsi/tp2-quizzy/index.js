const questions = [
    {
        "statement": "Quelle est la couleur du cheval blanc d'Henri IV ?",
        "type": "select",
        "choices": ["Blanc", "Noir", "Bleu", "Vert"],
        "valid": "Noir"
    },{
        "statement": "Quel module python permet de faire des graphiques ?",
        "type": "explicit",
        "valid": "matplotlib"
    },{
        "statement": "Quelle est la représentation binaire de l'entier 152 ?",
        "type": "explicit",
        "valid": "10011000"
    },{
        "statement": "a=\"(1, 3)\" \n Quel est le type de a ?",
        "type": "select",
        "choices": ["tuple", "list", "dict", "str"],
        "valid": "str"
    },{
        "statement": "On considère le tableau suivant : L = [[1,2,3],[4,5,6],[7,8,9]] Quelle est la valeur de L[1][0] ?",
        "type": "explicit",
        "valid": "4"
    },{
        "statement": "Python : le premier élément d'une liste L est noté :",
        "type": "select",
        "choices": ["L(0)", "L(1)", "L[0]", "L[1]"],
        "valid": "L[0]"
    },{
        "statement": "Comment est représenté le nombre décimal 12 en hexadécimal ?",
        "type": "explicit",
        "valid": "C"
    },{
        "statement": "Dans l'url <strong>https://youtube.com/watch?...</strong> quel est le nom de domaine ?",
        "type": "explicit",
        "valid": "youtube.com"
    },{
        "statement": "Quel tri n'existe pas ?",
        "type": "select",
        "choices": ["Tri fusion", "Tri par selection", "Tri par insertion", "Tri soudure"],
        "valid": "Tri soudure"
    },{
        "statement": "Parmi ces normes binaires, laquelle existe ?",
        "type": "select",
        "choices": ["IEEE752", "IEEE753", "IEEE754", "IEEE755"],
        "valid": "IEEE754"
    }
];

const questionDiv = document.getElementsByClassName("questionDiv")[0];
const validButton = document.getElementById("validate");
const quesCounterElem = document.getElementById("quesCounter");
const scoreCounterElem = document.getElementById("scoreCounter");

var quesCounter = 0;
var scoreCounter = 0;
quesCounterElem.innerText = `Question : ${quesCounter}/${questions.length}`;
scoreCounterElem.innerText = `Score : ${scoreCounter}/${questions.length}`;
var i = 0;

drawQuestion();
validButton.addEventListener("click", function() {
    updateCounters(getAnswer());
    drawQuestion();
});

/* Submit the answer when pressing "Enter" */
function searchKeyPress(e) {
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('validate').click();
        return false;
    }
    return true;
}
/* - - - - - - - - - - - - - - - - - - - - */

function drawQuestion() {
    var question = questions[i];
    questionDiv.innerHTML = `<p>${question["statement"]}</p>`;
    if (quesCounter >= questions.length) {
        return
    }
    else if (question['type'] == "select") {
        var content = "<select class=\"answer\" onkeypress=\"return searchKeyPress(event);\">";
        var choices = [" "].concat(question['choices']);
        choices.forEach(choice => {
            content += `<option value="${choice.toLowerCase()}">${choice}</option>`;
        });
        content += "</select>";
        questionDiv.innerHTML += content;
    }
    else {
        var content = "<input class=\"answer\" type=\"text\" onkeypress=\"return searchKeyPress(event);\">";
        questionDiv.innerHTML += content;
    }
    i++;
};

function updateCounters(isValid) {
    quesCounter += 1;
    if(isValid) {
        scoreCounter += 1
        scoreCounterElem.innerText = `Score : ${scoreCounter}/${questions.length}`
    }
    quesCounterElem.innerText = `Question : ${quesCounter}/${questions.length}`
};

function getAnswer() {
    var answer = document.getElementsByClassName('answer')[0]['value'];
    const currentQuestion = questions[quesCounter];
    return currentQuestion["valid"].toLowerCase() == answer.toLowerCase();
};