var NUMBER_OF_ROUNDS = 10
var is_hard_mode = false
var rounds_played = 0
var correct_rounds = 0
var current_pair = null
var loading = true;

var GOOGLE_MAPS_API_KEY = 'AIzaSyB9WhPHJ-ezQV7Ko5KWbESQVm7XMTkx9mI'
var DATA_URL = (
    'https://data.muni.org/resource/3i5d-tacp.json?'
    + '$select=styledesc,numhalfbaths,totallivingarea,bedrooms,numfullbaths,currenttotalvalue,parceladdress,location'
    + '&$where=currenttotalvalue%3E200000&appraisalyear=2018' //&$limit=50'
)
/*  Dog data as an array of objects:
    [{"name": "FIDO", "count": "30"}, {"name": ...]
    The input script transforms the 'name' parameter to lowercase
    and parses the 'count' parameter to an integrer
*/

// use static data if available (like in dev), otherwise fetch new data
if (dogs) {
    ready()
}
else {
    var dogs = []
    getDogData()
}

function ready(){
    var htmlElement = document.querySelector("html");
    htmlElement.className = ""
    loading = false
}

function getDogData(){
    httpRequest = new XMLHttpRequest();
    if (!httpRequest) {
      alert("I'm sorry - I can't load the dog data");
      return false;
    }
    httpRequest.onreadystatechange = incoming;
    httpRequest.open('GET', DATA_URL);
    httpRequest.send();
  }

  function incoming() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        dogs = JSON.parse(httpRequest.responseText);
        dogs.forEach(function(dog){
            dog.count = parseInt(dog.count)
            dog.name = dog.name.toLowerCase()
        })
        ready()
      } else {
        alert("I'm sorry - the was an error loading the dog data");
      }
    }
  }


// Grabs 2 dogs from the (global) dog list
// You can tune the difficulty by passing in the maximim and minimum difference
// in popularity count. Both are nullable.
function getTwoCompetitors(minimum_value_diff, maximum_value_diff) {
    // make a local, filtered copy of the data
    var filtered_dogs = dogs.filter(function (dog) {
        if (!dog.bedrooms) return false

        return true
    })

    var dog1 = filtered_dogs[Math.floor(Math.random() * filtered_dogs.length)]

    var other_dogs = filtered_dogs.filter(function(dog) {
        // check for minimum difference
        if (!isNaN(parseInt(minimum_value_diff))) {
            if (Math.abs(dog.currenttotalvalue - dog1.currenttotalvalue) < parseInt(minimum_value_diff)) {
                return false
            }
        }

        // check for maximum difference
        if (!isNaN(parseInt(maximum_value_diff))) {
            if (Math.abs(dog.currenttotalvalue - dog1.currenttotalvalue) > parseInt(maximum_value_diff)) {
                return false
            }
        }

        // make sure they don't have the same value
        if (dog.currenttotalvalue === dog1.currenttotalvalue) return false

        return true
    })
    var dog2 = other_dogs[Math.floor(Math.random() * other_dogs.length)]

    /* Dog1 is almost guarateened to be the lowest score because
       the distribution strongly favors picking a very low-numbered name
       so let's randomize the order a bit
    */
    return Math.random() < 0.5 ? [ dog1, dog2 ] : [ dog2, dog1 ]
}

// Set mode and begin the game
function chooseMode(_is_hard_mode) {
    is_hard_mode = _is_hard_mode

    var count_div = document.querySelector('#round');

    (function addBone(n){
        var s = document.createElement('span');
        s.className = "bone"
        count_div.appendChild(s)
        if(n<NUMBER_OF_ROUNDS) setTimeout(function() {
            addBone(++n);
        }, 50)
    })(1)

    playARound()
}


// Gets new dog choices and displays them
function playARound() {
    document.body.className = 'play'

    if (is_hard_mode) {
        current_pair = getTwoCompetitors(null, 5000) // hard mode
    }
    else {
        current_pair = getTwoCompetitors(5000, null) // easy mode
    }

    document.querySelector('#roundNumber').innerText = rounds_played + 1 + ' / ' + NUMBER_OF_ROUNDS

    var house_facts = ['styledesc', 'bedrooms', 'totallivingarea', 'numfullbaths', 'numhalfbaths']
    current_pair.forEach(function(competitor, index) {
        document.querySelector('#competitor' + index + ' iframe').src = (
            'https://www.google.com/maps/embed/v1/search?key='
            + GOOGLE_MAPS_API_KEY
            + '&q=' + competitor.parceladdress.replace(/ /, '+') + '+anchorage+ak'
            + '&maptype=satellite'
        )
        house_facts.forEach(function(item) {
            document.querySelector('#competitor' + index + ' div.' + item + ' span').innerText = competitor[item]
        })
    })
}


// Displays results of a choice
function displayResults(is_correct) {
    document.body.className = 'results'

    document.querySelector('#gameNav #result').innerText = (is_correct ? 'Correct' : 'Wrong')
    document.querySelector('#gameNav #result').className = is_correct ? 'correct' : 'wrong'

    var count_div = document.querySelectorAll('#round span')[rounds_played].className += is_correct ? " correct" : " wrong"
    var result_divs = document.querySelectorAll('#counts div')
    result_divs[0].innerHTML = current_pair[0].name + '<br>$' + parseInt(current_pair[0].currenttotalvalue).toLocaleString()

    result_divs[1].innerHTML = current_pair[1].name + '<br>$' + parseInt(current_pair[1].currenttotalvalue).toLocaleString()
}


// Displays final results
function displayFinalResults() {
    document.body.className = 'final_results'

    document.querySelector('#final_results h2').innerText = 'You got ' + correct_rounds + ' out of ' + NUMBER_OF_ROUNDS + ' correct'

    var social_text = "I just scored " + correct_rounds + " out of " + NUMBER_OF_ROUNDS + " on the Anchorage Dog Name Game! Try it here: http://codeforanchorage.org/dog-name-game/"
    document.querySelector('#twitter-link').href = "https://twitter.com/home?status=" + encodeURIComponent(social_text)

    // initialize()
}


// Onclick handler for choosing a dog
function nameChosen(name) {
    var popular_dog = current_pair.slice().sort(function(a, b) {
        return parseInt(a.currenttotalvalue) - parseInt(b.currenttotalvalue)
    })[1] // prevent sorting original array
    var is_correct = name.toLowerCase() === popular_dog.name

    displayResults(is_correct)

    rounds_played++
    if (is_correct) correct_rounds++

    return false // onclick event response
}


// Onclick handler for next button
function nextButton() {
    if (rounds_played === NUMBER_OF_ROUNDS) {
        displayFinalResults()
    }
    else {
        playARound()
    }
}


// initialize the game
function initialize() {
    rounds_played = 0
    correct_rounds = 0
    current_pair = null
    var bones = document.querySelectorAll('#round span')
    Array.prototype.forEach.call( bones, function( node ) {
        node.parentNode.removeChild( node );
    });
    document.body.className = 'choose_mode'
}


initialize()
