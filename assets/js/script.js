var genreAreaEl = document.getElementById("genres-list");
var searchButtonEl = document.getElementById("search");
var moviedisplayEl = document.getElementById("movie-display");
var tooManyGenresModalEl = document.getElementById("too-many-genres");
var genresOKButtonEl = document.getElementById("genres-OK-button");
var pageNo1;
var pageNo2;
var pageNo3;
var pageNo4;
var totalResults;
var countPages = 1;
var genreNos;

var results;
var genres = [];
var tmdbCall = "https://api.themoviedb.org/3/discover/movie?api_key=fdf647e2a6c6b5d7ea2edb2acfe6abf1&language=en-US&vote_count.gte=100&vote_count.lte=1000&language=en&vote_average.gte=7&with_genres=";


// Get genres from tmdb and add them to the DOM as check boxes (styled to look like buttons). 
function loadGenres() {
    fetch("https://api.themoviedb.org/3/genre/movie/list?api_key=fdf647e2a6c6b5d7ea2edb2acfe6abf1&language=en-US")
    .then(function(response){
        return response.json();        
    })
    .then(function(data){
        genres = data.genres;
        let buttonHolderEl;
        for (var i = 0; i < genres.length; i++) {
            let genreItemHolderEl = document.createElement("div");
            if (i%2 == 0) {
                buttonHolderEl = document.createElement("div");
                buttonHolderEl.setAttribute("class", "button-holder");
            }
            genreItemHolderEl.setAttribute("class", "ck-button");
            let genreItemLabelEl = document.createElement("label");
            let genreItemEl = document.createElement("input");
            genreItemEl.setAttribute("type", "checkbox");
            genreItemEl.setAttribute("value", genres[i].id)
            genreItemEl.setAttribute("id", genres[i].id);
            let genreItemTextEl = document.createElement("span");
            genreItemTextEl.textContent = genres[i].name;
            genreItemLabelEl.appendChild(genreItemEl);
            genreItemLabelEl.appendChild(genreItemTextEl);

            genreItemHolderEl.appendChild(genreItemLabelEl);
            if (i%2 == 1 || i == genres.length-1) {
                buttonHolderEl.appendChild(genreItemHolderEl); 
                genreAreaEl.appendChild(buttonHolderEl);
            } else {
                buttonHolderEl.appendChild(genreItemHolderEl);
            }

            searchButtonEl.addEventListener("click", setPageNo);            
        }
    })
}

function resetVariables() {
    countPages = 1;
    pageNo1 = null;
    pageNo2 = null;
    pageNo3 = null;
    pageNo4 = null;
}

//Pick a random movie from the page selected and get the Title, poster, release date, description, and where to watch information
function fetchMovieDetails(pageNo, finalGenre) {
 

    fetch(tmdbCall+finalGenre+"&page="+pageNo)

    .then(function(response){
        return response.json();
    })
    .then(function(data){
        results = data.results;

        let randomMovieNum = Math.floor(Math.random()*results.length);


        let tmdbID = results[randomMovieNum].id;

        var tmdbCodeURL = "https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/idlookup?source_id=movie/"+tmdbID+"&source=tmdb&country=ca";
        fetch(tmdbCodeURL, {
            "method": "GET",
            "headers": {
                "x-rapidapi-key": "2bbe3f6662msh6816e85f5b1dd27p1e0fe8jsncb2c41fb7a72",
                "x-rapidapi-host": "utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com"
            }
        })
        .then(response => {
            return response.json();
        })
        .then(function(utellyData){
            if (countPages ===2 && !pageNo3) {
                console.log("first")
                resetVariables();
                return;
            } else if (countPages ===3 && !pageNo4) {
                console.log("second")
                resetVariables();
                return;
            }  else if (countPages === 4) {
                console.log("third")
                resetVariables();
                return;
            } 
   
            let locationInfo = utellyData.collection.locations;
 
            let includedGenresArray = [];
            let movieObject;
            for(var j = 0; j < results[randomMovieNum].genre_ids.length; j++) {
                for (k = 0; k < genres.length; k++) {
                    if (results[randomMovieNum].genre_ids[j]===genres[k].id){
                        includedGenresArray.push(genres[k].name);
                    }
                }
            }
    
            let includedGenres = includedGenresArray.join(", ");
            includedGenresArray = [];
            for(var j = 0; j < results[randomMovieNum].genre_ids.length; j++) {
                for (k = 0; k < genres.length; k++) {
                    if (results[randomMovieNum].genre_ids[j]===genres[k].id){
                        includedGenresArray.push(genres[k].name);
                    }
                }
            }
            let whereToWatchInfo = [];
            let whereToWatchItem;
            if (locationInfo) {
                for (i = 0; i < locationInfo.length; i++) {
                    whereToWatchItem = {serviceName: locationInfo[i].display_name,
                                        serviceIcon: locationInfo[i].icon,
                                        serviceURL: locationInfo[i].url
                    }
                    whereToWatchInfo.push(whereToWatchItem);
                 }
            } else {
                whereToWatchInfo = ["Sorry we couldn't find a service that streams <em>" + results[randomMovieNum].title + ".</em>"];
            }

            movieObject = {title: results[randomMovieNum].title, 
                            poster: results[randomMovieNum].poster_path,
                            overview: results[randomMovieNum].overview,
                            genres: includedGenres,
                            rating: results[randomMovieNum].vote_average,
                            date: results[randomMovieNum].release_date,
                            whereToWatch: whereToWatchInfo,
                            tmdbId: tmdbID
                            };
                
    
    
            displayMovies(movieObject);
            countPages++;

            if(pageNo2 && countPages === 2) {
                fetchMovieDetails(pageNo2, genreNos);
             
            }
            if(pageNo3 && countPages === 3) {
                fetchMovieDetails(pageNo3, genreNos);
            }
                
            if(pageNo4 && countPages === 4) {
                fetchMovieDetails(pageNo4, genreNos);
  
            }

        })
        .catch(err => {
            console.error(err);
            
        });

    
    })
}


function setPageNo(){
    genreNos = collectGenres();
    fetch(tmdbCall+genreNos)
    .then(function(response){
        return response.json();
    })
    .then(function(data){
        if (data.results.length === 0) {
            tooManyGenresModalEl.setAttribute("class", "is-active modal");
            genresOKButtonEl.addEventListener("click", function() {
                tooManyGenresModalEl.setAttribute("class", "modal");
            })
        } else {         
            moviedisplayEl.textContent = "";
            totalResults = data.total_results;
            pageNo1 = Math.ceil(Math.random() * data.total_pages);    
            if (totalResults >= 2) {
                pageNo2 = Math.ceil(Math.random() * data.total_pages); 
            }
            if (totalResults >= 3) {
                pageNo3 = Math.ceil(Math.random() * data.total_pages);
            }    
            if (totalResults >= 4) {
                pageNo4 = Math.ceil(Math.random() * data.total_pages); 
            }   
            fetchMovieDetails(pageNo1, genreNos);

        }
    })
        
}

function collectGenres() {
    let theGenres = []
    for (var i = 0; i < genres.length; i++) {
        let genreCheck = document.getElementById(genres[i].id);
        if (genreCheck.checked) {
            theGenres.push(genres[i].id);
            genreCheck.checked = false;
        }
    }
    return theGenres.toString();
}


function displayMovies(movieObject) {
        
        // create variables from array
        let title = movieObject.title;
        let poster = movieObject.poster;
        let overview = movieObject.overview;
        let genres = movieObject.genres;
        let date = movieObject.date.substring(0, 4);
        let posterURL = "./assets/images/noPoster.png"
        if (poster) {
            posterURL="https://image.tmdb.org/t/p/w500"+poster;      
        }
        //let tmdbId = movieObject.tmdbId;


        // create card elements
        let cardEl = document.createElement("div");
        cardEl.setAttribute("class", "card is-child has-background-grey-dark hover has-text-white is-horizontal p-5 mb-5");


        //add poster image
        let cardImageEl = document.createElement("div");
        cardImageEl.setAttribute("class", "card-image is-3");
        let figureEl = document.createElement("figure")
        figureEl.setAttribute("class", "image");
        let posterEl = document.createElement("img");
        posterEl.setAttribute("src", posterURL);
        posterEl.setAttribute("alt", "Poster " + title);
        figureEl.appendChild(posterEl);
        cardImageEl.appendChild(figureEl);
        cardEl.appendChild(cardImageEl);

        // add text content
        let cardContentEl = document.createElement("div");
        cardContentEl.setAttribute("class", "card-content is-9");
        let mediaContentEl = document.createElement("div");
        mediaContentEl.setAttribute("class", "media-content");
        let titleEl = document.createElement("h3");
        titleEl.setAttribute("class", "title is-2 has-text-weight-bold has-text-white");
        titleEl.innerHTML = title + " <span class='date has-text-weight-light has-text-white'>"+date+"</span>";
        mediaContentEl.appendChild(titleEl);

        let subtitleEl = document.createElement("h4");
        subtitleEl.setAttribute("class", "subtitle is-5 has-text-white");
        subtitleEl.textContent = genres;
        mediaContentEl.appendChild(subtitleEl);
        cardContentEl.appendChild(mediaContentEl);

        let contentEl = document.createElement("div");
        contentEl.setAttribute("class", "content has-text-grey-light");
        contentEl.textContent = overview;
        cardContentEl.appendChild(contentEl);


        let whereToWatchEl = document.createElement("div");
        let whereToWatchTitleEl = document.createElement("h4");
        whereToWatchTitleEl.setAttribute("class", "subtitle is-5 has-text-white");
        whereToWatchTitleEl.textContent = "Where to watch:";
        whereToWatchEl.appendChild(whereToWatchTitleEl);
        let iconHolder = document.createElement("div");
        iconHolder.setAttribute("class", "icon-holder");
        let whereToWatchIconEl;
        if (typeof movieObject.whereToWatch[0] === "object") {
            for (j = 0; j < movieObject.whereToWatch.length; j++) {
                whereToWatchIconEl = document.createElement("div");
                let watchID = movieObject.whereToWatch[j].serviceName;
                watchID = watchID.replace(/\s+/g, '-').toLowerCase();
                whereToWatchIconEl.setAttribute("id", watchID);
                whereToWatchIconEl.setAttribute("class", "p-3 has-background-white");
                whereToWatchIconEl.innerHTML= "<a href='"+movieObject.whereToWatch[j].serviceURL+"' target='_blank'><img src='" + movieObject.whereToWatch[j].serviceIcon + "' alt='" + movieObject.whereToWatch[j].serviceName + "' /></a>";
                iconHolder.appendChild(whereToWatchIconEl);
            }                
        } else {
            let whereToWatchNoOptionsEl = document.createElement("div");
            whereToWatchNoOptionsEl.innerHTML = movieObject.whereToWatch[0];
            iconHolder.appendChild(whereToWatchNoOptionsEl);
        }
        whereToWatchEl.appendChild(iconHolder);
        cardContentEl.appendChild(whereToWatchEl);






        cardEl.appendChild(cardContentEl);
        moviedisplayEl.appendChild(cardEl);

}

loadGenres();
