(function() {

    const   searchSubmit = document.querySelector("#searchBar");
    const   searchContainer = document.querySelector("#searchValue");
    const   bookList = document.querySelector("#bookList");
    const   loadedLimit = 30; // limit search queries
    const   recognition = new webkitSpeechRecognition() || new SpeechRecognition(); // voice recognition

    let     timeOfSubmit = null;
    let     intervalID;
    let     searchValue = searchContainer.value;
    let     userLang = window.navigator.language;

// time difference function with display
    function diffTimer() {

        const rtf1 = new Intl.RelativeTimeFormat(userLang, { style: 'long' });

        if (!timeOfSubmit) { // when first search query
            return;
        } 

        clearInterval(intervalID); // clear previous interval

        let timeDiff;
        const timerContainer = document.querySelector(".timer-container");
        const timerDisplay = document.querySelector("#timerDisplay");

        function updateTimer(value) {
            timerContainer.classList.add("visible");
            timerDisplay.innerHTML = value;
        }

        function interval() {
            dateNow = Date.now()
            timeDiff = dateNow - timeOfSubmit

            updateTimer(
                simpleTime(timeDiff)
            );
        }

        function simpleTime(duration) {
            const   milliseconds = parseInt((duration % 1000) / 100),
                    seconds = Math.floor((duration / 1000) % 60),
                    minutes = Math.floor((duration / (1000 * 60)) % 60),
                    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
            let     simpleTime;

            if (hours) {
                simpleTime = rtf1.format(-hours, 'hours')
            } else if (minutes) {
                simpleTime = rtf1.format(-minutes, 'minutes')
            } else {
                simpleTime = rtf1.format(-seconds, 'seconds');
            }

            return simpleTime;
        }

        intervalID = setInterval( interval, 1000);

        return intervalID
    }

// click events
    searchContainer.addEventListener('change', (event) => {
        searchValue = event.srcElement.value;
    });

    searchSubmit.addEventListener('submit', (event) => {
        submitForm(event);
    });
    
    document.querySelector("#voiceRec").addEventListener('click', (event) => {
        startDictation(event);
    });

// async functions

    async function submitForm(event) {
        event.preventDefault();

        console.log(`searching for: ${searchValue}`)
        const loader = document.querySelector(".loading");
        const timer = document.querySelector(".timer-container");
        const url = `https://openlibrary.org/search.json?q=${searchValue}`

        try {
            visiToggle(loader);

            let data = await getData(url);
            clearList();
            diffTimer();
            timeOfSubmit = Date.now();

            if (data.numFound > 0) {
                visiToggle(loader);
                renderObjects(data, loadedLimit)
            } else {
                visiToggle(loader);
                renderObjects();
            }

        } catch(error) {
            console.log(dateOfSubmit);
            console.log(`error = ${error}`);
        }
    };

    async function getData(url) {
        const response = await fetch(url);
        dataObject = await response.json();

        return dataObject
    };

    async function renderObjects(data, limit) {
        if (data) {
            const limitedData = Array.from(data.docs)
                .filter(
                    (element, index) => ( index < limit )
                )

            const max = limitedData.length;
            console.log(`max is: ${max}`);

            const renderedData = limitedData.forEach( (book, key) => {
                const node = document.createElement('li');

                const title = document.createElement('h2');
                title.innerHTML = book.title;

                const subtitle = document.createElement('p');
                subtitle.innerHTML = book.author_name;

                const image = document.createElement("img");
                image.setAttribute("loading", "lazy");
                image.setAttribute("src-lazy", getImageUrl(book) );
                lazyLoad(image);

                node.appendChild(image);
                node.appendChild(title);
                node.appendChild(subtitle);

                bookList.appendChild(node);

                if (key === max - 1) {
                    catchLast(image)
                }
            })

            return renderedData

        } else {
            const node = document.createElement('h2');
            node.innerHTML = `No results found`;
            node.classList.add("warning");
            bookList.appendChild(node);
        }

        function getImageUrl(element) {
            return ( element.cover_i ? `http://covers.openlibrary.org/b/id/${element.cover_i}-M.jpg` : `./img/placeholder2.png` )
        }
    };

// image lazy loading 
    function lazyLoad(target) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('src-lazy');

                    img.setAttribute('src', src);
                    observer.disconnect();
                }
            });
        });
        obs.observe(target);
    }

// helper functions

    function clearList() {
        bookList.innerHTML = "";
    }

    function visiToggle(element) {
        element.classList.toggle("visible");
    }

    function setText(string) {
        const text = document.querySelector(".recognition");
        text.innerHTML = string;
    }

// voice recognition function
    function startDictation(event) {
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.lang = userLang;

        recognition.start();

        recognition.onstart = function() { 
            setText("Voice recognition activated. Try speaking into the microphone.");
        }

        recognition.onspeechend = function() {
            setText("No speech was detected. Try again.");
        }

        recognition.onerror = function(event) {
            if(event.error == 'no-speech') {
                recognition.stop();
                setText("No speech was detected. Try again.");  
            };
        }

        recognition.onresult = function(event) {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;

            recognition.stop();

            setText(`voice transcription: ${transcript}`);
            searchValue = transcript;
            searchContainer.value = transcript;

            submitForm(event);
        }
    }

// window visibility detection

    (function visibilityHandle() {
        let hidden = false;

        function handleVisibilityChange() {
            if (document.hidden) {
                hidden = true;
                console.log(`document is hidden: ${hidden}`)
            } else {
                hidden = false;
                console.log(`document is hidden: ${hidden}`)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
    })();

})();