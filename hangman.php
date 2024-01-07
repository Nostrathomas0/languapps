<?php
// Hangman Game Logic
$words = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];
$wordToGuess = "";
$guessedLetters = [];

function startGame() {
    global $words, $wordToGuess, $guessedLetters;
    $wordToGuess = $words[array_rand($words)];
    $guessedLetters = [];
    displayWord();
}

function displayWord() {
    global $wordToGuess, $guessedLetters;
    $wordDisplay = "";
    foreach (str_split($wordToGuess) as $letter) {
        if (in_array($letter, $guessedLetters)) {
            $wordDisplay .= $letter . " ";
        } else {
            $wordDisplay .= "_ ";
        }
    }
    echo $wordDisplay;
}

function makeGuess($guess) {
    global $wordToGuess, $guessedLetters;
    $guess = strtolower($guess);
    if (strlen($guess) === 1 && preg_match('/[a-z]/', $guess) && !in_array($guess, $guessedLetters)) {
        $guessedLetters[] = $guess;
        displayWord();
        checkGameOver();
    }
}

function checkGameOver() {
    global $wordToGuess, $guessedLetters;
    if (array_diff(str_split($wordToGuess), $guessedLetters) === []) {
        echo "Congratulations! You guessed the word: $wordToGuess";
        startGame();
    }
}

if (isset($_POST['action'])) {
    $action = $_POST['action'];

    if ($action === 'start') {
        startGame();
    } elseif ($action === 'guess' && isset($_POST['letter'])) {
        $letter = $_POST['letter'];
        makeGuess($letter);
    }
}
?>
<!DOCTYPE HTML>
<html>
<head>
    <title>Hangman Game</title>
</head>
<body>
    <h1>Hangman Game</h1>
    <div id="word-display"></div>
    <input type="text" id="guess-input" placeholder="Enter a letter">
    <button onclick="makeGuess()">Guess</button>
    <button onclick="startGame()">Start New Game</button>
</body>
</html>
