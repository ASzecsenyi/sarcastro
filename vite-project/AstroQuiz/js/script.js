document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('toggle-audio');
    const questionElement = document.getElementById('question');
    const answerButtonsContainer = document.getElementById('answer-buttons');
    let recognition;
    let audioMode = false;
    let currentQuestionIndex = 0;
    let score = 0; // Initialize score

    const questions = [
        {
            question: 'Which of the following is satellite of Earth',
            answers: ['Moon', 'Sun', 'Saturn', 'Jupiter'],
            correctAnswerIndex: 0
        },
        {
            question: 'Which city is the capital of France',
            answers: ['Berlin', 'London', 'Paris', 'Rome'],
            correctAnswerIndex: 2
        },
        {
            question: 'Process by which stars generate energy?',
            answers: ['Chemical reaction', 'Nuclear fission', 'Radioactive decay', 'Nuclear fusion'],
            correctAnswerIndex: 3
        },
        {
            question: 'What is the closest galaxy to the Milky Way?',
            answers: ['Andromeda', 'Triangulum', 'Centaurus A', 'Magellanic Clouds'],
            correctAnswerIndex: 0
        },
        {
            question: 'What is remnant of a massive star after a supernova explosion?',
            answers: ['Neutron star', 'Black hole', 'White dwarf', 'Pulsar'],
            correctAnswerIndex: 1
        },
        {
            question: 'What is the force that holds galaxies together?',
            answers: ['Gravitational force', 'Electromagnetic force', 'Strong nuclear force', 'Weak nuclear force'],
            correctAnswerIndex: 0
        },
        {
            question: 'The theory that describes the origin and evolution of the universe?',
            answers: ['Big Bang theory', 'Steady state theory', 'String theory', 'Multiverse theory'],
            correctAnswerIndex: 0
        },
        {
            question: 'What is the primary element formed in the cores of stars through nuclear fusion?',
            answers: ['Helium', 'Oxygen', 'Carbon', 'Hydrogen'],
            correctAnswerIndex: 3
        },
        {
            question: 'What type of celestial object is composed mainly of frozen gases and dust?',
            answers: ['Comet', 'Asteroid', 'Meteoroid', 'Planet'],
            correctAnswerIndex: 0
        },
        {
            question: 'What is the phenomenon where light bends as it passes through a gravitational field?',
            answers: ['Gravitational lensing', 'Doppler effect', 'Redshift', 'Blueshift'],
            correctAnswerIndex: 0
        },
        {
            question: 'What is the name of the region surrounding a black hole from which no light can escape?',
            answers: ['Event horizon', 'Singularity', 'Quasar', 'Photon sphere'],
            correctAnswerIndex: 0
        },
        {
            question: 'What is the term for a star that has exhausted its nuclear fuel and collapsed to a very small size?',
            answers: ['White dwarf', 'Red giant', 'Neutron star', 'Supergiant'],
            correctAnswerIndex: 2
        }
        // Add more questions as needed
    ];

    function wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }

    function loadQuestion() {
        const currentQuestion = questions[currentQuestionIndex];
        questionElement.textContent = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;

        answerButtonsContainer.innerHTML = ''; // Clear previous answer buttons

        currentQuestion.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.textContent = answer;
            button.classList.add('btn');
            button.dataset.correct = index === currentQuestion.correctAnswerIndex ? 'true' : 'false';
            button.addEventListener('click', selectAnswer);
            answerButtonsContainer.appendChild(button);
        });
    }

    function selectAnswer(event) {
        const selectedButton = event.target;
        const isCorrect = selectedButton.dataset.correct === 'true';

        if (isCorrect) {
            score++; // Increase score for correct answer

            if (!audioMode)
                alert('Correct answer! Your score: ' + score);
        } else {
            if (!audioMode)
                alert('Incorrect answer! Your score remains: ' + score);
        }

        // Move to the next question
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion(); // Load the next question
            if (audioMode) {
                activateAudioMode(); // If audio mode is active, read out the next question
            }
        } else {
            if (!audioMode)
                alert('Quiz completed! Your final score: ' + score);
            else
                speak('Quiz completed! Your final score: ' + score)
            // Optionally, reset the quiz or perform other actions
        }
    }

    function toggleAudioMode() {
        audioMode = !audioMode;
        if (audioMode) {
            activateAudioMode();
        } else {
            deactivateAudioMode();
        }
    }

    async function activateAudioMode() {
        //speak('Audio mode activated')
        speak(questions[currentQuestionIndex].question);
        await wait(5000);
        //questions[currentQuestionIndex].answers.forEach(answer => speak(answer));
        questions[currentQuestionIndex].answers.forEach((answer, index) => {
            speak(`Option ${index + 1}: ${answer}`);
        });
        await wait(20000);

        speak('Choose the correct option number');

        await wait(2000);
        recognition.start(); // Start speech recognition after the delay
    }



    function deactivateAudioMode() {
        //speak('Audio mode deactivated')
        const speechSynthesis = window.speechSynthesis;
        if (speechSynthesis) {
            speechSynthesis.cancel(); // Stop any ongoing speech synthesis
        }
        recognition.stop(); // Stop speech recognition
    }


    function speak(text) {
        const speechSynthesis = window.speechSynthesis;
        if (speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        }
    }

    async function startSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();

            recognition.onstart = function () {
                console.log('Voice recognition activated. Speak into the microphone.');
            };

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript.toLowerCase().trim();
                console.log('User said:', transcript);

                if (audioMode) {
                    let regex = /[.,\s]/g;
                    let spokenAnswer = transcript.toLowerCase().trim().replace(regex, '');

                    answerButtonsContainer.querySelectorAll('.btn').forEach((button, index) => {
                        if (spokenAnswer == index + 1) {
                            const isCorrect = button.dataset.correct == 'true';
                            if (isCorrect) {
                                speak('Correct answer!');
                            } else {
                                speak('Incorrect answer!');
                            }
                            button.click(); // Simulate click on the button
                        }
                    });
                }
            };

            recognition.onerror = function (event) {
                console.error('Speech recognition error:', event.error);
            };
        } else {
            console.error('Speech recognition not supported.');
        }
    }

    toggleButton.addEventListener('click', toggleAudioMode);

    loadQuestion(); // Load the first question when the page loads
    startSpeechRecognition(); // Start speech recognition

});
