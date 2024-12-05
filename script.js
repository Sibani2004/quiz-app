// Elements
const registerScreen = document.getElementById('registration-screen');
const loginScreen = document.getElementById('login-screen');
const categoryScreen = document.getElementById('category-screen');
const startScreen = document.getElementById('start-screen');
const displayContainer = document.getElementById('display-container');
const scoreContainer = document.getElementById('score-container');
const startButton = document.getElementById('start-button');
const nextButton = document.getElementById('next-button');
const restartButton = document.getElementById('restart');
const timerElement = document.getElementById('time-left');
const questionTitle = document.getElementById('question-title');
const optionsContainer = document.querySelector('.options');
const userScoreDisplay = document.getElementById('user-score');
const usernameDisplay = document.getElementById('user-name');
const categoryButtons = document.querySelectorAll('.category-button');
const questionCountDisplay = document.getElementById('question-count');

let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;
let currentQuestionIndex = 0;
let score = 0; // Track the user's score
let timer;
let timeLeft = 10;
let questions = [];
let selectedCategory = "";
let selectedOptions = []; // Track all selected options
let skippedQuestions = []; // Track skipped questions
let answerLocked = false; // Prevent answer change after timer ends

// Register New User
document.getElementById('register-button').addEventListener('click', () => {
    const registerUsername = document.getElementById('reg-username').value;
    const registerPassword = document.getElementById('reg-password').value;
    const registerEmail = document.getElementById('reg-email').value;

    if (registerUsername && registerPassword && registerEmail) {
        const userExists = users.some(user => user.username === registerUsername);

        if (userExists) {
            alert("Username already taken, please choose another one.");
        } else {
            users.push({ username: registerUsername, password: registerPassword, email: registerEmail });
            localStorage.setItem('users', JSON.stringify(users));
            alert("Registration successful! Please log in.");
            showLoginScreen();
        }
    } else {
        alert("Please fill in all fields.");
    }
});

// Go to Login Screen from Register
document.getElementById('go-to-login').addEventListener('click', showLoginScreen);

// Go to Register Screen from Login
document.getElementById('go-to-register').addEventListener('click', showRegisterScreen);

function showLoginScreen() {
    registerScreen.classList.add('hide');
    loginScreen.classList.remove('hide');
}

function showRegisterScreen() {
    loginScreen.classList.add('hide');
    registerScreen.classList.remove('hide');
}

// Function to shuffle and select random questions
function getRandomQuestions(pool, count) {
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Login User
document.getElementById('login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        const user = users.find(user => user.username === username && user.password === password);

        if (user) {
            currentUser = user;
            usernameDisplay.textContent = currentUser.username;
            loginScreen.classList.add('hide');
            categoryScreen.classList.remove('hide');
        } else {
            alert("Incorrect username or password.");
        }
    } else {
        alert("Please enter both username and password.");
    }
});

// Category selection
categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        selectedCategory = e.target.dataset.category;
        categoryScreen.classList.add('hide');
        startScreen.classList.remove('hide');
    });
});

// Starting quiz
startButton.addEventListener('click', () => {
    // Select 30 random questions from the chosen category
    const categoryQuestions = questionBank[selectedCategory];
    questions = getRandomQuestions(categoryQuestions, Math.min(30, categoryQuestions.length));
    
    // Proceed with the quiz
    startScreen.classList.add('hide');
    displayContainer.classList.remove('hide');
    displayQuestion();
    startTimer();
});

function displayQuestion() {
    resetState();
    if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        questionTitle.innerText = currentQuestion.question;

        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option');
            button.innerText = option;
            button.addEventListener('click', () => selectAnswer(button));
            optionsContainer.appendChild(button);
        });

        // Update the question count display
        questionCountDisplay.innerText = `${currentQuestionIndex + 1} of ${questions.length} questions`;

        // Always show the Next button
        nextButton.classList.remove('hide');
    } else {
        endQuiz(); // Show final score after the quiz ends
    }
}

function resetState() {
    selectedOption = null; // Reset the selected option
    answerLocked = false; // Allow selecting answers before the timer ends
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

function selectAnswer(option) {
    if (!answerLocked) { // Allow selecting an option only if the answer is not locked
        selectedOptions[currentQuestionIndex] = option.innerText; // Store selected answer for the current question
        // Remove highlight from previously selected option
        Array.from(optionsContainer.children).forEach(button => {
            button.classList.remove('selected'); // Clear selection for all options
        });
        option.classList.add('selected'); // Highlight the selected option

        // Immediately evaluate the answer if the selected option is clicked
        evaluateImmediateAnswer(option);
    }
}

function evaluateImmediateAnswer(option) {
    const correctAnswer = questions[currentQuestionIndex].answer;

    // Do not increment the score for incorrect answers
    if (option.innerText === correctAnswer) {
        score++; // Increment the score for a correct answer
    }
}

function evaluateAnswer() {
    const correctAnswer = questions[currentQuestionIndex].answer;
    answerLocked = true; // Lock the answer after the timer runs out

    // Check if an answer was selected
    const userAnswer = selectedOptions[currentQuestionIndex];
    const isSkipped = !userAnswer; // Skip answer is when there is no selected answer

    // Remove the blue highlight from all options first
    Array.from(optionsContainer.children).forEach(button => {
        button.classList.remove('selected');  // Remove selected highlight (blue)
    });

    // Apply the appropriate styles based on user answer
    if (userAnswer) {
        Array.from(optionsContainer.children).forEach(button => {
            if (button.innerText === userAnswer) {
                if (userAnswer === correctAnswer) {
                    button.classList.add('correct'); // Apply correct styling (green)
                    score++; // Increment the score for a correct answer
                } else {
                    button.classList.add('incorrect'); // Apply incorrect styling (red)
                }
            }
        });
    }

    // Highlight the correct answer even if the user chose incorrectly or skipped
    Array.from(optionsContainer.children).forEach(button => {
        if (button.innerText === correctAnswer) {
            button.classList.add('correct');
        }
    });

    // Highlight skipped questions with yellow
    if (isSkipped) {
        Array.from(optionsContainer.children).forEach(button => {
            button.classList.add('skipped'); // Apply skipped styling (yellow)
        });
    }

    nextButton.classList.remove('hide'); // Show the Next button after evaluation
}

function startTimer() {
    timeLeft = 10;
    timerElement.innerText = `${timeLeft}s`;

    timer = setInterval(() => {
        timeLeft--;
        timerElement.innerText = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            evaluateAnswer(); // Evaluate the answer only after time is up
        }
    }, 1000);
}

// Next button clicked: move to the next question
nextButton.addEventListener('click', () => {
    // Skip questions that are not answered
    if (!selectedOptions[currentQuestionIndex]) {
        skippedQuestions.push(currentQuestionIndex); // Mark the question as skipped
    }
    currentQuestionIndex++;
    clearInterval(timer); // Reset the timer before moving to the next question
    displayQuestion();    // Display the next question
    startTimer();         // Restart the timer
});

function endQuiz() {
    displayContainer.classList.add('hide');
    scoreContainer.classList.remove('hide');
    userScoreDisplay.innerText = `You scored ${score} out of ${questions.length}`;
    // Call this function after the quiz ends and results are being displayed
    updateResultCounts();
    displayResults(); // Call the function to display results
}

function showResults() {
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    questions.forEach((question, index) => {
        const userAnswer = selectedOptions[index] || 'Not answered';
        if (userAnswer === 'Not answered') {
            skippedCount++;
        } else if (userAnswer === question.answer) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    });
    // Call this function after the quiz ends and results are being displayed
    updateResultCounts();
    // Update counts in the result boxes
    document.getElementById('correct-count').innerText = `${correctCount}`;
    document.getElementById('incorrect-count').innerText = `${incorrectCount}`;
    document.getElementById('skipped-count').innerText = `${skippedCount}`;
}

function showCategory(category) {
    const detailedView = document.getElementById('detailed-view');
    const detailedTitle = document.getElementById('detailed-view-title');
    const detailedContent = document.getElementById('detailed-view-content');

    // Set title based on category
    if (category === 'correct') {
        detailedTitle.innerText = 'Correct Answers';
    } else if (category === 'incorrect') {
        detailedTitle.innerText = 'Incorrect Answers';
    } else if (category === 'skipped') {
        detailedTitle.innerText = 'Skipped Questions';
    }

    // Clear previous content
    detailedContent.innerHTML = '';

    // Populate questions dynamically based on the selected category
    questions.forEach((question, index) => {
        const userAnswer = selectedOptions[index] || 'Not answered';
        const isCorrect = userAnswer === question.answer;
        const isSkipped = userAnswer === 'Not answered';

        // Check if the current question belongs to the selected category
        if (
            (category === 'correct' && isCorrect) ||
            (category === 'incorrect' && !isCorrect && !isSkipped) ||
            (category === 'skipped' && isSkipped)
        ) {
            const questionDiv = document.createElement('div');
            let cssClass = '';

            // Assign appropriate CSS class and background color
            if (isCorrect) {
                cssClass = 'correct-question'; // Light green background
            } else if (isSkipped) {
                cssClass = 'skipped-question'; // Light yellow background
            } else {
                cssClass = 'incorrect-question'; // Light red background
            }

            questionDiv.classList.add(cssClass);

            // Use the original question number (index + 1)
            questionDiv.innerHTML = `
                <strong>Question ${index + 1}: ${question.question}<br></strong> 
                Your answer: ${userAnswer}<br>
                Correct answer: ${question.answer}
            `;

            detailedContent.appendChild(questionDiv);
        }
    });

    // Show detailed view
    detailedView.style.display = 'block';
}

function updateResultCounts() {
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    // Calculate counts based on selected options
    questions.forEach((question, index) => {
        const userAnswer = selectedOptions[index] || 'Not answered';
        const isCorrect = userAnswer === question.answer;
        const isSkipped = userAnswer === 'Not answered';

        if (isCorrect) {
            correctCount++;
        } else if (isSkipped) {
            skippedCount++;
        } else {
            incorrectCount++;
        }
    });

    // Update the count elements in the result boxes
    document.getElementById('correct-count').innerText = correctCount;
    document.getElementById('incorrect-count').innerText = incorrectCount;
    document.getElementById('skipped-count').innerText = skippedCount;
}

function hideDetailedView() {
    document.getElementById('detailed-view').style.display = 'none';
}


// Restart button clicked: Reset everything and start again
restartButton.addEventListener('click', () => {
    // Reset the score and current question index
    score = 0;
    currentQuestionIndex = 0;

    // Clear the timer
    clearInterval(timer);

    // Reset user-selected options and skipped questions
    selectedOptions = [];
    skippedQuestions = [];

    // Hide the score container and show the category screen
    scoreContainer.classList.add('hide');
    categoryScreen.classList.remove('hide');
});



// Sample question bank for testing purposes
const questionBank = {
    general: [
        { question: "What is the capital of France?", options: ["Paris", "London", "Rome", "Berlin"], answer: "Paris" },
        { question: "Which country is known as the Land of the Rising Sun?", options: ["China", "Japan", "South Korea", "Thailand"], answer: "Japan" },
        { question: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], answer: "Mount Everest" },
        { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
        { question: "Which animal is known as the King of the Jungle?", options: ["Tiger", "Lion", "Elephant", "Giraffe"], answer: "Lion" },
        { question: "Which country hosted the 2016 Summer Olympics?", options: ["USA", "Brazil", "China", "Japan"], answer: "Brazil" },
        { question: "What is the smallest country in the world?", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], answer: "Vatican City" },
        { question: "Which river is the longest in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: "Nile" },
        { question: "Who painted the Mona Lisa?", options: ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso", "Claude Monet"], answer: "Leonardo da Vinci" },
        { question: "What is the capital of Italy?", options: ["Milan", "Rome", "Naples", "Venice"], answer: "Rome" },
        { question: "Which country is famous for the Eiffel Tower?", options: ["Italy", "Germany", "France", "Spain"], answer: "France" },
        { question: "Which fruit is the primary ingredient in guacamole?", options: ["Tomato", "Lime", "Avocado", "Onion"], answer: "Avocado" },
        { question: "Which is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Rhino"], answer: "Blue Whale" },
        { question: "Which continent is known as the Dark Continent?", options: ["Asia", "Europe", "Africa", "Australia"], answer: "Africa" },
        { question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: "Diamond" },
        { question: "Which is the longest bone in the human body?", options: ["Femur", "Humerus", "Tibia", "Radius"], answer: "Femur" },
        { question: "What is the national flower of Japan?", options: ["Cherry Blossom", "Lotus", "Rose", "Lily"], answer: "Cherry Blossom" },
        { question: "Which element has the chemical symbol O?", options: ["Oxygen", "Gold", "Osmium", "Silver"], answer: "Oxygen" },
        { question: "Which planet is closest to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], answer: "Mercury" },
        { question: "Which is the smallest planet in our solar system?", options: ["Venus", "Mars", "Pluto", "Mercury"], answer: "Mercury" },
        { question: "Who invented the telephone?", options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Albert Einstein"], answer: "Alexander Graham Bell" },
        { question: "What is the capital of Germany?", options: ["Berlin", "Munich", "Frankfurt", "Hamburg"], answer: "Berlin" },
        { question: "In which year did World War II end?", options: ["1945", "1939", "1918", "1965"], answer: "1945" },
        { question: "Which bird is a universal symbol of peace?", options: ["Dove", "Eagle", "Parrot", "Peacock"], answer: "Dove" },
        { question: "Which country gifted the Statue of Liberty to the USA?", options: ["Italy", "Germany", "France", "Spain"], answer: "France" },
        { question: "Which city is known as the Big Apple?", options: ["Los Angeles", "Chicago", "New York", "Miami"], answer: "New York" },
        { question: "What is the hottest planet in our solar system?", options: ["Mercury", "Venus", "Mars", "Jupiter"], answer: "Venus" },
        { question: "Which planet has the most moons?", options: ["Saturn", "Mars", "Earth", "Jupiter"], answer: "Jupiter" },
        { question: "Which country is known for inventing pizza?", options: ["Greece", "Spain", "Italy", "Mexico"], answer: "Italy" },
        { question: "Which country is home to the kangaroo?", options: ["India", "South Africa", "Australia", "Brazil"], answer: "Australia" },
        { question: "What is the largest ocean on Earth?", options: ["Pacific", "Atlantic", "Indian", "Arctic"], answer: "Pacific" }, // Easy
        { question: "What is the capital of Italy?", options: ["Rome", "Paris", "Madrid", "Berlin"], answer: "Rome" }, // Easy
        { question: "Which planet is known as the 'Red Planet'?", options: ["Mercury", "Mars", "Jupiter", "Saturn"], answer: "Mars" }, // Medium
        { question: "Which country is famous for inventing paper?", options: ["Egypt", "China", "India", "Greece"], answer: "China" }, // Medium
        { question: "What is the smallest country by population?", options: ["Maldives", "Vatican City", "Monaco", "San Marino"], answer: "Vatican City" }, // Medium
        { question: "Which language has the most native speakers worldwide?", options: ["English", "Mandarin Chinese", "Hindi", "Spanish"], answer: "Mandarin Chinese" }, // Medium
        { question: "Which element is represented by 'Fe' on the periodic table?", options: ["Iron", "Fluorine", "Francium", "Fermium"], answer: "Iron" }, // Hard
        { question: "What is the most widely consumed drink in the world after water?", options: ["Tea", "Coffee", "Beer", "Milk"], answer: "Tea" }, // Hard
        { question: "Which two countries share the longest international border?", options: ["USA & Canada", "Russia & China", "India & China", "Brazil & Argentina"], answer: "USA & Canada" }, // Hard
        { question: "What is the national currency of Japan?", options: ["Yuan", "Yen", "Won", "Baht"], answer: "Yen" }, // Easy
        { question: "Which planet has the highest number of moons?", options: ["Jupiter", "Saturn", "Mars", "Uranus"], answer: "Saturn" }, // Medium
        { question: "Who was the first woman to win a Nobel Prize?", options: ["Marie Curie", "Mother Teresa", "Jane Goodall", "Rosalind Franklin"], answer: "Marie Curie" }, // Medium
        { question: "Which country is home to the Amazon Rainforest?", options: ["Brazil", "Colombia", "Peru", "Venezuela"], answer: "Brazil" }, // Medium
        { question: "What is the second-highest mountain in the world?", options: ["Mount Everest", "K2", "Kangchenjunga", "Makalu"], answer: "K2" }, // Hard
        { question: "What is the hottest planet in our solar system?", options: ["Venus", "Mars", "Mercury", "Jupiter"], answer: "Venus" }, // Hard
        { question: "Which country has won the most FIFA World Cups?", options: ["Brazil", "Germany", "Italy", "Argentina"], answer: "Brazil" }, // Easy
        { question: "What is the largest freshwater lake in the world by surface area?", options: ["Lake Superior", "Lake Victoria", "Lake Baikal", "Caspian Sea"], answer: "Lake Superior" }, // Hard
        { question: "What is the chemical symbol for gold?", options: ["Ag", "Au", "Pt", "Pb"], answer: "Au" }, // Easy
        { question: "Which bird is often associated with delivering babies in folklore?", options: ["Pelican", "Stork", "Dove", "Swan"], answer: "Stork" }, // Medium
        { question: "Which country is known as the Land of the Rising Sun?", options: ["China", "Japan", "Korea", "Thailand"], answer: "Japan" }, // Easy
    ],
    history: [
        { question: "Who was the first President of the USA?", options: ["George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams"], answer: "George Washington" },
        { question: "Which civilization built the pyramids?", options: ["Romans", "Greeks", "Egyptians", "Mayans"], answer: "Egyptians" },
        { question: "Who discovered America?", options: ["Christopher Columbus", "Leif Erikson", "Amerigo Vespucci", "Vasco da Gama"], answer: "Christopher Columbus" },
        { question: "Which empire was ruled by Julius Caesar?", options: ["Greek", "Roman", "Persian", "Mongol"], answer: "Roman" },
        { question: "Who was the first man to walk on the moon?", options: ["Buzz Aldrin", "Yuri Gagarin", "John Glenn", "Neil Armstrong"], answer: "Neil Armstrong" },
        { question: "In which year did World War I start?", options: ["1914", "1918", "1939", "1945"], answer: "1914" },
        { question: "Which country was Adolf Hitler born in?", options: ["Germany", "Austria", "Poland", "Hungary"], answer: "Austria" },
        { question: "Who was the British Prime Minister during most of World War II?", options: ["Neville Chamberlain", "Winston Churchill", "Clement Attlee", "Harold Macmillan"], answer: "Winston Churchill" },
        { question: "What year did the Berlin Wall fall?", options: ["1987", "1989", "1991", "1993"], answer: "1989" },
        { question: "What was the name of the ship that brought the Pilgrims to America?", options: ["Santa Maria", "Mayflower", "Endeavour", "Pinta"], answer: "Mayflower" },
        { question: "Who was the first emperor of China?", options: ["Emperor Taizong", "Qin Shi Huang", "Emperor Wu", "Kublai Khan"], answer: "Qin Shi Huang" },
        { question: "Which English king had six wives?", options: ["Henry VII", "Henry VIII", "Richard III", "Edward IV"], answer: "Henry VIII" },
        { question: "Who was the first female Prime Minister of the UK?", options: ["Theresa May", "Margaret Thatcher", "Harriet Harman", "Mary Robinson"], answer: "Margaret Thatcher" },
        { question: "What year did India gain independence from Britain?", options: ["1947", "1950", "1935", "1965"], answer: "1947" },
        { question: "Who was the president of the Confederate States during the American Civil War?", options: ["Abraham Lincoln", "Jefferson Davis", "Ulysses S. Grant", "Robert E. Lee"], answer: "Jefferson Davis" },
        { question: "Who was the second President of the United States?", options: ["Thomas Jefferson", "John Adams", "James Madison", "James Monroe"], answer: "John Adams" },
        { question: "In which year did the Russian Revolution take place?", options: ["1905", "1917", "1920", "1930"], answer: "1917" },
        { question: "Which country launched the first satellite, Sputnik?", options: ["USA", "China", "Germany", "Soviet Union"], answer: "Soviet Union" },
        { question: "Who was the first woman to fly solo across the Atlantic?", options: ["Amelia Earhart", "Bessie Coleman", "Jacqueline Cochran", "Harriet Quimby"], answer: "Amelia Earhart" },
        { question: "What was the last battle of the Napoleonic Wars?", options: ["Battle of Waterloo", "Battle of Trafalgar", "Battle of Austerlitz", "Battle of Leipzig"], answer: "Battle of Waterloo" },
        { question: "What year did the US declare independence?", options: ["1775", "1776", "1783", "1787"], answer: "1776" },
        { question: "Who was the longest-reigning monarch of the UK before Queen Elizabeth II?", options: ["Queen Victoria", "King George III", "King Edward VII", "Queen Anne"], answer: "Queen Victoria" },
        { question: "Which treaty ended World War I?", options: ["Treaty of Versailles", "Treaty of Paris", "Treaty of Brest-Litovsk", "Treaty of Ghent"], answer: "Treaty of Versailles" },
        { question: "Who was known as the Maid of Orléans?", options: ["Marie Antoinette", "Joan of Arc", "Catherine de' Medici", "Eleanor of Aquitaine"], answer: "Joan of Arc" },
        { question: "What was the first permanent English settlement in America?", options: ["Plymouth", "Roanoke", "Jamestown", "New Amsterdam"], answer: "Jamestown" },
        { question: "Who discovered penicillin?", options: ["Marie Curie", "Alexander Fleming", "Joseph Lister", "Robert Koch"], answer: "Alexander Fleming" },
        { question: "Which French emperor was exiled to Elba?", options: ["Charlemagne", "Louis XIV", "Napoleon Bonaparte", "Louis XVI"], answer: "Napoleon Bonaparte" },
        { question: "Who was the famous nurse during the Crimean War?", options: ["Florence Nightingale", "Clara Barton", "Edith Cavell", "Elizabeth Blackwell"], answer: "Florence Nightingale" },
        { question: "Which war was fought between the North and South regions in the United States?", options: ["War of 1812", "American Civil War", "Spanish-American War", "Mexican-American War"], answer: "American Civil War" },
        { question: "Who signed the Emancipation Proclamation?", options: ["Abraham Lincoln", "George Washington", "Thomas Jefferson", "Theodore Roosevelt"], answer: "Abraham Lincoln" },
        { question: "Who was the first President of the United States?", options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"], answer: "George Washington" }, // Easy
        { question: "Who was known as the 'Iron Lady'?", options: ["Margaret Thatcher", "Indira Gandhi", "Angela Merkel", "Hillary Clinton"], answer: "Margaret Thatcher" }, // Medium
        { question: "Which empire built Machu Picchu?", options: ["Aztec", "Maya", "Inca", "Toltec"], answer: "Inca" }, // Medium
        { question: "What was the name of the first artificial satellite?", options: ["Explorer", "Sputnik", "Apollo", "Vanguard"], answer: "Sputnik" }, // Medium
        { question: "Who was the first female Prime Minister of India?", options: ["Indira Gandhi", "Sarojini Naidu", "Pratibha Patil", "Sonia Gandhi"], answer: "Indira Gandhi" }, // Easy
        { question: "In which year did the Berlin Wall fall?", options: ["1987", "1989", "1991", "1993"], answer: "1989" }, // Medium
        { question: "Which war was the longest in history?", options: ["Hundred Years' War", "Vietnam War", "World War II", "Napoleonic Wars"], answer: "Hundred Years' War" }, // Hard
        { question: "Who was the ruler of the Aztec Empire at the time of Spanish conquest?", options: ["Montezuma II", "Atahualpa", "Pachacuti", "Hernán Cortés"], answer: "Montezuma II" }, // Hard
        { question: "What year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], answer: "1912" }, // Easy
        { question: "What was the original name of Istanbul?", options: ["Byzantium", "Constantinople", "Ankara", "Ephesus"], answer: "Constantinople" }, // Medium
        { question: "Who led the Soviet Union during World War II?", options: ["Vladimir Lenin", "Joseph Stalin", "Mikhail Gorbachev", "Leon Trotsky"], answer: "Joseph Stalin" }, // Medium
        { question: "What was the main language of the Roman Empire?", options: ["Greek", "Latin", "Romanian", "Italian"], answer: "Latin" }, // Medium
        { question: "In what year did India gain independence?", options: ["1947", "1950", "1945", "1939"], answer: "1947" }, // Easy
        { question: "What city was the center of the Renaissance?", options: ["Rome", "Florence", "Paris", "Venice"], answer: "Florence" }, // Medium
        { question: "Who discovered America in 1492?", options: ["Christopher Columbus", "Vasco da Gama", "Ferdinand Magellan", "John Cabot"], answer: "Christopher Columbus" }, // Easy
        { question: "What was the name of the treaty that ended World War I?", options: ["Treaty of Paris", "Treaty of Versailles", "Treaty of Rome", "Treaty of Vienna"], answer: "Treaty of Versailles" }, // Medium
        { question: "What was the capital of the Byzantine Empire?", options: ["Rome", "Athens", "Constantinople", "Carthage"], answer: "Constantinople" }, // Medium
        { question: "Who was the first Emperor of China?", options: ["Qin Shi Huang", "Han Wu", "Tang Taizong", "Sun Yat-sen"], answer: "Qin Shi Huang" }, // Hard
        { question: "What year did the French Revolution begin?", options: ["1789", "1776", "1793", "1804"], answer: "1789" }, // Hard
        { question: "What year did World War I start?", options: ["1914", "1915", "1916", "1917"], answer: "1914" }, // Easy
    ],
    math: [
        { question: "If you have three apples and you take away two, how many do you have?", options: ["One", "Two", "Three", "None"], answer: "Two" },
        { question: "What is half of 2 + 2?", options: ["2", "3", "4", "1"], answer: "2" },
        { question: "What is the value of π (pi) to two decimal places?", options: ["3.14", "3.15", "3.13", "3.16"], answer: "3.14" },
        { question: "What is the next prime number after 7?", options: ["8", "9", "11", "10"], answer: "11" },
        { question: "If a triangle has sides of length 3, 4, and 5, what type of triangle is it?", options: ["Acute", "Obtuse", "Right", "Equilateral"], answer: "Right" },
        { question: "What is the sum of the angles in a triangle?", options: ["90", "180", "270", "360"], answer: "180" },
        { question: "What is 7 times 8?", options: ["54", "56", "48", "64"], answer: "56" },
        { question: "If a car travels 60 miles in 1 hour, how far will it travel in 4 hours?", options: ["120 miles", "240 miles", "180 miles", "300 miles"], answer: "240 miles" },
        { question: "What is the value of 2^3?", options: ["4", "6", "8", "10"], answer: "8" },
        { question: "If you have a rectangle with a length of 5 and a width of 10, what is the area?", options: ["50", "15", "30", "60"], answer: "50" },
        { question: "How many zeroes are in one million?", options: ["5", "6", "7", "4"], answer: "6" },
        { question: "What is the formula for the area of a circle?", options: ["πr^2", "2πr", "πd", "πr"], answer: "πr^2" },
        { question: "What is the value of x in the equation 2x + 3 = 11?", options: ["3", "4", "5", "6"], answer: "4" },
        { question: "What is 15% of 200?", options: ["30", "25", "20", "35"], answer: "30" },
        { question: "What is the value of the expression 5 + (2 × 3)?", options: ["11", "15", "10", "9"], answer: "11" },
        { question: "If I am a prime number between 10 and 20, what number am I?", options: ["11", "13", "17", "19"], answer: "11" },
        { question: "What is the value of x in the equation x/2 = 8?", options: ["16", "4", "10", "2"], answer: "16" },
        { question: "How many faces does a cube have?", options: ["6", "8", "4", "5"], answer: "6" },
        { question: "What is the product of 9 and 9?", options: ["81", "72", "99", "90"], answer: "81" },
        { question: "If a pizza is cut into 8 equal slices and you eat 3, how many slices are left?", options: ["4", "3", "5", "2"], answer: "5" },
        { question: "What is the next number in the sequence 2, 4, 6, 8, ...?", options: ["10", "12", "14", "16"], answer: "10" },
        { question: "If I have 3 pens and you give me 2 more, how many do I have?", options: ["3", "5", "4", "2"], answer: "5" },
        { question: "If x = 3, what is 2x + 1?", options: ["7", "8", "6", "5"], answer: "7" },
        { question: "What is the least common multiple of 4 and 6?", options: ["12", "24", "30", "18"], answer: "12" },
        { question: "How many degrees are in a straight angle?", options: ["90", "180", "270", "360"], answer: "180" },
        { question: "What is the value of 10 cubed?", options: ["100", "1000", "10000", "1000"], answer: "1000" },
        { question: "What is the greatest common factor of 18 and 24?", options: ["6", "12", "18", "3"], answer: "6" },
        { question: "If you have 100 rupees and spend 25%, how much do you have left?", options: ["75", "80", "85", "70"], answer: "75" },
        { question: "How many degrees are in a complete circle?", options: ["360", "180", "270", "90"], answer: "360" },
        { question: "If a rectangle has a length of 8 and a width of 4, what is the perimeter?", options: ["24", "20", "32", "30"], answer: "24" },
        { question: "What is the square root of 64?", options: ["6", "8", "10", "12"], answer: "8" }, // Easy
        { question: "What is the value of π (pi) up to two decimal places?", options: ["3.14", "3.15", "3.13", "3.12"], answer: "3.14" }, // Easy
        { question: "How many sides does a decagon have?", options: ["8", "10", "12", "14"], answer: "10" }, // Medium
        { question: "What is the smallest prime number?", options: ["1", "2", "3", "5"], answer: "2" }, // Easy
        { question: "Solve for x: 2x + 5 = 15", options: ["2", "5", "7", "10"], answer: "5" }, // Medium
        { question: "What is 25% of 240?", options: ["40", "50", "60", "70"], answer: "60" }, // Medium
        { question: "What is the sum of angles in a triangle?", options: ["90°", "180°", "360°", "270°"], answer: "180°" }, // Easy
        { question: "If a = 5 and b = 3, what is a² - b²?", options: ["10", "16", "25", "34"], answer: "16" }, // Medium
        { question: "What is the derivative of x²?", options: ["x", "2x", "x²", "x³"], answer: "2x" }, // Hard
        { question: "What is the factorial of 5?", options: ["120", "60", "20", "24"], answer: "120" }, // Medium
        { question: "What is the slope of the line y = 3x + 2?", options: ["2", "3", "1", "0"], answer: "3" }, // Medium
        { question: "Convert 0.75 to a fraction.", options: ["1/3", "1/2", "3/4", "4/5"], answer: "3/4" }, // Easy
        { question: "Solve: 8 ÷ 2(2 + 2)", options: ["1", "16", "8", "4"], answer: "16" }, // Hard
        { question: "What is the Pythagorean theorem?", options: ["a² + b² = c²", "a² - b² = c²", "a² = b² + c²", "None of the above"], answer: "a² + b² = c²" }, // Easy
        { question: "What is the cube root of 27?", options: ["9", "3", "6", "4"], answer: "3" }, // Easy
        { question: "What is the sum of the first 10 natural numbers?", options: ["45", "50", "55", "60"], answer: "55" }, // Medium
        { question: "Solve for x: 5x - 2 = 18", options: ["4", "5", "6", "7"], answer: "4" }, // Medium
        { question: "What is the circumference of a circle with radius 7?", options: ["44", "22", "66", "88"], answer: "44" }, // Medium
        { question: "How many degrees are in one-third of a right angle?", options: ["20°", "30°", "45°", "60°"], answer: "30°" }, // Easy
        { question: "Solve: 15 + 6 × 2 - 8 ÷ 4", options: ["32", "28", "26", "30"], answer: "26" }, // Easy
    ],
    science: [
        { question: "What planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
        { question: "What is the chemical symbol for water?", options: ["O2", "CO2", "H2O", "HO"], answer: "H2O" },
        { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"], answer: "Carbon Dioxide" },
        { question: "What is the hardest natural substance?", options: ["Iron", "Diamond", "Gold", "Silver"], answer: "Diamond" },
        { question: "What planet is closest to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], answer: "Mercury" },
        { question: "Which element has the chemical symbol O?", options: ["Oxygen", "Gold", "Osmium", "Silver"], answer: "Oxygen" },
        { question: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], answer: "Nitrogen" },
        { question: "What is the boiling point of water?", options: ["50°C", "75°C", "100°C", "120°C"], answer: "100°C" },
        { question: "What planet is known as the Blue Planet?", options: ["Mars", "Earth", "Jupiter", "Neptune"], answer: "Earth" },
        { question: "What is the center of an atom called?", options: ["Electron", "Proton", "Nucleus", "Neutron"], answer: "Nucleus" },
        { question: "Which gas is essential for humans to breathe?", options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Helium"], answer: "Oxygen" },
        { question: "What force pulls objects toward the Earth?", options: ["Magnetism", "Friction", "Gravity", "Inertia"], answer: "Gravity" },
        { question: "What type of animal is a whale?", options: ["Fish", "Reptile", "Mammal", "Bird"], answer: "Mammal" },
        { question: "What is the speed of light?", options: ["300,000 km/s", "200,000 km/s", "400,000 km/s", "500,000 km/s"], answer: "300,000 km/s" },
        { question: "What planet is known for its rings?", options: ["Earth", "Mars", "Saturn", "Venus"], answer: "Saturn" },
        { question: "What is the smallest particle of an element?", options: ["Molecule", "Atom", "Neutron", "Proton"], answer: "Atom" },
        { question: "What do you call the change from liquid to gas?", options: ["Freezing", "Condensation", "Evaporation", "Sublimation"], answer: "Evaporation" },
        { question: "What is the main gas in the Sun?", options: ["Oxygen", "Hydrogen", "Helium", "Carbon Dioxide"], answer: "Hydrogen" },
        { question: "What planet is known as the Morning Star?", options: ["Mars", "Jupiter", "Venus", "Mercury"], answer: "Venus" },
        { question: "What do bees collect from flowers?", options: ["Water", "Nectar", "Oxygen", "Pollen"], answer: "Nectar" },
        { question: "What is the process by which plants make their own food?", options: ["Respiration", "Fermentation", "Photosynthesis", "Digestion"], answer: "Photosynthesis" },
        { question: "Which planet is the largest in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], answer: "Jupiter" },
        { question: "What is the freezing point of water?", options: ["-10°C", "0°C", "10°C", "100°C"], answer: "0°C" },
        { question: "What is the chemical symbol for gold?", options: ["Au", "Ag", "Pb", "Fe"], answer: "Au" },
        { question: "What is the human body's primary source of energy?", options: ["Carbohydrates", "Proteins", "Fats", "Vitamins"], answer: "Carbohydrates" },
        { question: "What is the closest planet to Earth?", options: ["Mars", "Venus", "Mercury", "Jupiter"], answer: "Venus" },
        { question: "What is the most common element in the universe?", options: ["Hydrogen", "Oxygen", "Carbon", "Helium"], answer: "Hydrogen" },
        { question: "What is the largest organ in the human body?", options: ["Liver", "Skin", "Heart", "Brain"], answer: "Skin" },
        { question: "What is the primary gas in the Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: "Nitrogen" },
        { question: "What is the scientific name for water?", options: ["H2O", "O2", "CO2", "HO"], answer: "H2O" },
        { question: "What is the chemical formula for water?", options: ["H2O", "CO2", "O2", "NaCl"], answer: "H2O" }, // Easy
        { question: "Which gas do plants absorb for photosynthesis?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], answer: "Carbon Dioxide" }, // Easy
        { question: "Who developed the theory of relativity?", options: ["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Galileo Galilei"], answer: "Albert Einstein" }, // Medium
        { question: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], answer: "Nitrogen" }, // Medium
        { question: "What is the powerhouse of the cell?", options: ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"], answer: "Mitochondria" }, // Easy
        { question: "What is the primary source of energy for the Earth?", options: ["Wind", "Solar", "Fossil Fuels", "Hydro"], answer: "Solar" }, // Easy
        { question: "What is the atomic number of Carbon?", options: ["12", "6", "8", "14"], answer: "6" }, // Medium
        { question: "What is the SI unit of force?", options: ["Pascal", "Newton", "Joule", "Watt"], answer: "Newton" }, // Easy
        { question: "What organ in the human body is responsible for pumping blood?", options: ["Liver", "Heart", "Kidney", "Brain"], answer: "Heart" }, // Easy
        { question: "Which particle is negatively charged?", options: ["Proton", "Electron", "Neutron", "Photon"], answer: "Electron" }, // Easy
        { question: "What planet is known as the Gas Giant?", options: ["Mars", "Saturn", "Jupiter", "Venus"], answer: "Jupiter" }, // Medium
        { question: "What is the pH level of pure water?", options: ["5", "6", "7", "8"], answer: "7" }, // Medium
        { question: "What is the process by which plants make food?", options: ["Respiration", "Photosynthesis", "Transpiration", "Fermentation"], answer: "Photosynthesis" }, // Easy
        { question: "What is the smallest unit of matter?", options: ["Atom", "Molecule", "Cell", "Proton"], answer: "Atom" }, // Easy
        { question: "What is the main gas found in the Sun?", options: ["Hydrogen", "Oxygen", "Helium", "Carbon"], answer: "Hydrogen" }, // Medium
        { question: "What is the largest bone in the human body?", options: ["Femur", "Tibia", "Humerus", "Skull"], answer: "Femur" }, // Medium
        { question: "Which organ in the human body filters blood?", options: ["Heart", "Lungs", "Liver", "Kidney"], answer: "Kidney" }, // Medium
        { question: "What is the function of white blood cells?", options: ["Carry oxygen", "Fight infections", "Clot blood", "Digest food"], answer: "Fight infections" }, // Medium
        { question: "What is the scientific name for the process of boiling?", options: ["Condensation", "Vaporization", "Evaporation", "Fusion"], answer: "Vaporization" }, // Hard
        { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], answer: "300,000 km/s" }, // Medium
    ],
};



