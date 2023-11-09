var xhttp = new XMLHttpRequest();
xhttp.open("POST", "/random.php", true);
xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

// Define the data you want to send
var data = {
    key1: "value1",
    key2: "value2"
};

// Convert the data to JSON
var jsonData = JSON.stringify(data);

xhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
        // Handle the response from the server
        var response = this.responseText;
        // Do something with the response data
        console.log(response);
    }
};

xhttp.send(jsonData);

const pronouns = {
    subject: ['I', 'You', 'He', 'She', 'They'],
    object: ['me', 'you', 'him', 'her', 'them']
};

const verbs = ['love', 'hate', 'enjoy', 'dislike', 'prefer'];

const nounPhrases = {
    determiners: ['The', 'A', 'An', 'My', 'Your'],
    nouns: ['cat', 'dog', 'pizza', 'coding', 'music']
};

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomSentence() {
    const subjectPronoun = getRandomElement(pronouns.subject);
    const objectPronoun = getRandomElement(pronouns.object);
    const verb = getRandomElement(verbs);
    const determiner = getRandomElement(nounPhrases.determiners);
    const noun = getRandomElement(nounPhrases.nouns);

    const subjectPhrase = `${subjectPronoun} ${verb} ${determiner} ${noun}`;
    const objectPhrase = `${objectPronoun} ${verb} ${determiner} ${noun}`;

    return `Subject: ${subjectPhrase}<br>Object: ${objectPhrase}`;
}

// Example of generating and displaying the sentence
const randomSentence = generateRandomSentence();
document.getElementById('random-sentence').innerHTML = randomSentence;
