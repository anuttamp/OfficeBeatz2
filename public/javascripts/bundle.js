(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
testRequire = require('./testRequire.js');

$(document).ready(function () {
    // Initializes Materialize components.
    $('.tabs').tabs();
    $('.collapsible').collapsible();

    testRequire();

    let TIME_INTERVAL = localStorage.getItem("TIME_INTERVAL") || 2700000; // Defaults to 45 minutes if not previously set.
    let activeInterval = false;
    let audioElement = $('#audioSource')[0]; // jQuery syntax to grab the first child of the audio object.
    let volumeControl = $('.volSlider');
    let tempVol = 50;
    let genreList;
    let genres = []
    let genrePreferences = [];
    let decadePreferences = [];
    let songTitle="All Star";
    let songArtist="Smashmouth";

    try {
        genrePreferences = JSON.parse(localStorage.getItem("GENRE_PREFERENCES"));
    } catch (error) {

    }

    try {
        decadePreferences = JSON.parse(localStorage.getItem("DECADE_PREFERENCES"));
    } catch (error) {

    }

    getGenres().then((result) => {
        genreList = result;
        console.log(genreList.counts);
        for (let key in genreList.counts) {
            genres.push(key);
        }
        //This iterates through the genre stuff, add in making checkboxes out of this later~
        for (let i = 0; i < genres.length; i++) {
            console.log(genres[i] + ": " + genreList.counts[genres[i]]);
        }
        findNextSongWithPreferences(genrePreferences, decadePreferences)
    });

    // Updates entries requiring TIME_INTERVAL
    determineRadioButton(TIME_INTERVAL);
    determineCheckboxes(genrePreferences);
    determineDecadeInputs(decadePreferences);
    updateInterval(TIME_INTERVAL);
    updateGenreDisplay(genrePreferences);
    updateDecadeDisplay(decadePreferences);
    allSelectedOrNot();

    $('#play').click(function () {
        // Updates autoplay after an action has taken place.
        audioElement.autoplay = true;

        if(audioElement.paused) {
            audioElement.play();
        } else {
            audioElement.pause();
        }

        // If the interval is already determined, do not set another one.
        if (!activeInterval) {
            timeout();
        }

        checkIcon();
    });

    // Makes an API request for a new song every TIME_INTERVAL milliseconds.
    let timeout = () => {
        activeInterval = true;
        setTimeout(function () {
            loopPlayer(audioElement);
        }, TIME_INTERVAL);
    }

    // Makes an AJAX request for a new song and then replaces current song with the response.
    function loopPlayer(audioElement) {
        findNextSongWithPreferences(genrePreferences, decadePreferences);
        // Delay to prevent overlap while changing audio source.
        setTimeout(function () {
            audioElement.play();
        }, 1500);
        timeout();
    }

    $('#mute').click(function () {
        if (audioElement.volume != 0) {
            volumeControl.val(0);
            audioElement.volume = 0;
        } else {
            audioElement.volume = tempVol / 100;
            volumeControl.val(tempVol);
        }

        checkVolIcon();
    });

    //Updates volume when slider is changed.
    $('#vol-control').on("input change", function () {
        tempVol = this.value;
        audioElement.volume = this.value / 100;

        checkVolIcon();
    });

    function checkIcon () {
        if(audioElement.paused) {
            $("#play").html(function () {
                let currentIcon = "<i class='material-icons'>play_arrow</i>";
                return currentIcon;
            });
        }

        if(!audioElement.paused) {
            $("#play").html(function () {
                let currentIcon = "<i class='material-icons'>pause</i>";
                return currentIcon;
            });
        }
    }

    function checkVolIcon () {
        let volIcon;
        if (audioElement.volume == 0) {
            volIcon = "<i class='material-icons'>volume_off</i>";
        } else {
            volIcon = "<i class='material-icons'>volume_up</i>";
        }

        $("#mute").html(function () {
            return volIcon;
        });
    }

    //Loads up a new song if a song is already playing, otherwise does nothing.
    $('#skip').click(function () {
        if (!audioElement.paused) {
            findNextSongWithPreferences(genrePreferences, decadePreferences);
            audioElement.play();
        }
    });

    // Submits and updates interval between songs.
    $("#advancedSettingsForm").submit(function (event) {
        event.preventDefault();
        intervalHander();
        submitGenres();
        submitYears();
    });

    // Updates interval display in option bar.
    function updateInterval(interval) {
        if (interval < 3600 || interval > 7200000) {
            return null;
        }
        $("#intervalDisplay").html(function () {
            let spannedInterval = "<span id='spannedInterval'>" + (((interval) / 1000) / 60) + "</span>";
            return "Current Interval: " + spannedInterval + " minutes.";
        });
    }
    /**
     * Updates the UI with the current genre preferences.
     * @param {*} genrePreferences
     * @returns a list of the current genre preferences to be displayed
     */
    function updateGenreDisplay(genrePreferences) {
        $("#genreDisplay").html(function () {
            if (!genrePreferences) {
                let spannedGenre = "<span id='spannedGenre'> Reggae, Pop, R&B, Rock, Latin, Hip-Hop, Blues, Pop Rock, Rap, Miscellaneous </span>";
                return "Current Genres: " + spannedGenre + ".";
            }
            if (genrePreferences.length > 0) {
                let parsedGenres = []

                for (let i = 0; i < genrePreferences.length; i++) {
                    if (genrePreferences[i] == 'Blues Rock') {
                        parsedGenres.push("Blues");
                    } else if (genrePreferences[i] == 'Rock/Pop') {
                        parsedGenres.push("Pop Rock");
                    } else if (genrePreferences[i] == 'undefined' || genrePreferences[i] == 'Other') {
                        if (parsedGenres.includes("Miscellaneous")) {
                            // Avoids adding Misc tag twice.
                        } else {
                            parsedGenres.push("Miscellaneous");
                        }
                    } else {
                        parsedGenres.push(genrePreferences[i]);
                    }
                }
                let spannedGenre = "<span id='spannedGenre'>" + parsedGenres.join(", ") + "</span>";
                return "Current Genres: " + spannedGenre + ".";
            } else {
                let spannedGenre = "<span id='spannedGenre'> Unfiltered </span>";
                return "Current Genres: " + spannedGenre + ".";
            }
        });
    }
    /**
     * Updates the UI with the current year preferences.
     * @param {*} decadePreferences
     * @returns a range with the current year preferences
     */
    function updateDecadeDisplay(decadePreferences) {
        $("#decadeDisplay").html(function () {
            if (!decadePreferences) {
                let spannedDecades = "<span id='spannedDecades'> 1940 </span> - <span id='spannedDecades'> 2019 </span>";
                return "Current Timespan: " + spannedDecades + ".";
            }
            if (decadePreferences.length > 0) {
                let spannedDecades = "<span id='spannedDecades'>" + decadePreferences[0] + "</span>" + " - " + "<span id='spannedDecades'>" + decadePreferences[1] + "</span>";
                return "Current Timespan: " + spannedDecades + ".";
            } else {
                let spannedDecades = "<span id='spannedDecades'> 1940 </span> - <span id='spannedDecades'> 2019 </span>";
                return "Current Timespan: " + spannedDecades + ".";
            }
        });
    }

    // Selects the proper option depending on what the current time interval is.
    function determineRadioButton(TIME_INTERVAL) {
        if (TIME_INTERVAL == 900000) {
            $("#shortInterval").prop("checked", true);
        } else if (TIME_INTERVAL == 1800000) {
            $("#mediumInterval").prop("checked", true);
        } else if (TIME_INTERVAL == 2700000) {
            $("#longInterval").prop("checked", true);
        } else {
            $("#customInterval").prop("checked", true);
            $("#customIntervalValue").val((((TIME_INTERVAL) / 1000) / 60));
        }
    }
    /**
     * Creates the genre checkboxes for advanced settings.
     * Unfortunately hardcoded, so if a new genre was added you'd need to add it here.
     * @param {*} genrePreferences
     */
    function determineCheckboxes(genrePreferences) {
        if (genrePreferences) {
            if (genrePreferences.indexOf('Reggae') > -1) {
                $('#reggaeBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Pop') > -1) {
                $('#popBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('R&B') > -1) {
                $('#rAndBBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Rock') > -1) {
                $('#rockBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Latin') > -1) {
                $('#latinBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Hip-Hop') > -1) {
                $('#hipHopBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Blues Rock') > -1) {
                $('#bluesBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Rock/Pop') > -1) {
                $('#rockPopBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('undefined') > -1) {
                $('#otherBox').prop('checked', true);
            }
            if (genrePreferences.indexOf('Rap') > -1) {
                $('#rapBox').prop('checked', true);
            }
        } else {
            $('#reggaeBox').prop('checked', true);
            $('#popBox').prop('checked', true);
            $('#rAndBBox').prop('checked', true);
            $('#rockBox').prop('checked', true);
            $('#latinBox').prop('checked', true);
            $('#hipHopBox').prop('checked', true);
            $('#bluesBox').prop('checked', true);
            $('#rockPopBox').prop('checked', true);
            $('#otherBox').prop('checked', true);
            $('#rapBox').prop('checked', true);
        }
    }

    function determineDecadeInputs(decadePreferences) {
        if (decadePreferences) {
            $("#startingDecade").val(decadePreferences[0])
            $("#endingDecade").val(decadePreferences[1])
        }
    }
    /**
     * Creates the genre preferences based on id3 information from getGenres().
     */
    function getGenres() {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: '/api/genres',
                data: null,
                type: "POST",
                success: function (responseData) {
                    console.log(responseData)
                }, error: console.error
            }).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                console.log(error);
                reject(error);
            });
        });
    }
    /**
     * Creates the genre preferences based on id3 information from getGenres().
     */
    function submitGenres() {
        let genres = [];
        for (var key in genreList.counts) {
            genres.push(key);
        }

        genrePreferences = [];
        genrePreferences = populateGenres(genrePreferences);
    }
    /**
     * Creates the decade preferences and checks how many songs are available.
     * If fewer than five, throws an error.
     */
    function submitYears() {
        decadePreferences = [];
        decadePreferences = populateDecades(decadePreferences);

        if (makeSongList(genrePreferences, decadePreferences).length < 5) {
            $("#formFeedback").html(function () {
                let errorMessage = "<span id='errorMessage'> Error! </span>"
                return errorMessage + "Fewer than five songs available, please broaden your preferences."
            });
            feedbackAnimation();
        } else {
            updateGenreDisplay(genrePreferences);
            localStorage.setItem("GENRE_PREFERENCES", JSON.stringify(genrePreferences));
            updateDecadeDisplay(decadePreferences);
            localStorage.setItem("DECADE_PREFERENCES", JSON.stringify(decadePreferences));
            findNextSongWithPreferences(genrePreferences, decadePreferences);

            $("#formFeedback").html(function () {
                let successMessage = "<span id='successMessage'> Success! </span>"
                return successMessage + "Settings successfully updated!"
            });
            feedbackAnimation();
        }
    }

    /**
     * Makes a post request to get the next song based on preferences.
     * It works even if the preferences are null.
     * @param {*} genreArray
     * @param {*} decadeArray
     */
    function findNextSongWithPreferences(genreArray, decadeArray) {
        let songList=[];
        //if there are no preferences, makes a dummy array to get makeSongList to function
        if (genreArray == null && decadeArray == null) {
            tempArray=[1940,2019];
            songList=makeSongList(genreArray, tempArray);
        } else {
            //run through the whole JSON file and get the list of songs that match those genres, and randomize through the list
            songList = makeSongList(genreArray, decadeArray);
        }
        let name = '';
        index = parseInt(Math.random() * songList.length);
        name = songList[index].filename;
        songTitle = songList[index].title+" ";
        songArtist = songList[index].artist;
        updateSongDisplay(songTitle, songArtist);
        console.log(name);

        // post request to /api/song in the headers make a tag called song, put name there
        $.ajax({
            url: '/api/song',
            data: null,
            headers: {
                'song': name
            },
            type: "POST",
            success: function (responseData) {
                console.log(responseData)
                audioElement.src = responseData;
            }, error: console.error
        });
    }

    /** Returns a list of songs with the given genre and decade preferences.
     *  Also used to get a count of how many songs pass the filter for sanity checks.
     *  Do not call this function if both are null, but it's fine if one or the other is null.
     *  @param {*} genreArray
     *  @param {*} decadeArray
     *  @returns an array containing all songs that pass the filter
     * */
    function makeSongList(genreArray, decadeArray) {
        let songList = [];

        if (genreArray != null && decadeArray != null) {
            for (key in genreList.songs) {
                if (genreArray.includes(genreList.songs[key].genre) && decadeArray[0] <= genreList.songs[key].year && genreList.songs[key].year <= decadeArray[1]) {
                    songList.push(genreList.songs[key]);
                }
            }
        } else if (decadeArray == null) {
            for (key in genreList.songs) {
                if (genreArray.includes(genreList.songs[key].genre)) {
                    songList.push(genreList.songs[key]);
                }
            }
        } else {
            for (key in genreList.songs) {
                if (decadeArray[0] <= genreList.songs[key].year && genreList.songs[key].year <= decadeArray[1]) {
                    songList.push(genreList.songs[key]);
                }
            }
        }
        return songList;
    }

    function populateGenres(genrePreferences) {
        let unfiltered = true;

        if ($('#reggaeBox').is(':checked')) {
            genrePreferences.push(genres[0]);
            unfiltered = false;
        }
        if ($('#popBox').is(':checked')) {
            genrePreferences.push(genres[1]);
            unfiltered = false;
        }
        if ($('#rAndBBox').is(':checked')) {
            genrePreferences.push(genres[3]);
            unfiltered = false;
        }
        if ($('#rockBox').is(':checked')) {
            genrePreferences.push(genres[4]);
            unfiltered = false;
        }
        if ($('#latinBox').is(':checked')) {
            genrePreferences.push(genres[5]);
            unfiltered = false;
        }
        if ($('#hipHopBox').is(':checked')) {
            genrePreferences.push(genres[6]);
            unfiltered = false;
        }
        if ($('#bluesBox').is(':checked')) {
            genrePreferences.push(genres[7]);
            unfiltered = false;
        }
        if ($('#rockPopBox').is(':checked')) {
            genrePreferences.push(genres[8]);
            unfiltered = false;
        }
        if ($('#rapBox').is(':checked')) {
            genrePreferences.push(genres[9]);
            unfiltered = false;
        }
        if ($('#otherBox').is(':checked')) {
            genrePreferences.push(genres[2]);
            genrePreferences.push(genres[10]);
            unfiltered = false;
        }

        if (unfiltered) {
            for(let i = 0; i < genres.length; i++) {
                genrePreferences.push(genres[i]);
            }
        }

        return genrePreferences;
    }

    function populateDecades(decadePreferences) {
        let startingDecade = parseInt($('#startingDecade').val()) || 1940;
        let endingDecade = parseInt($('#endingDecade').val()) || 2019;

        decadePreferences.push(startingDecade);
        decadePreferences.push(endingDecade);

        return decadePreferences;
    }

    function intervalHander() {
        let radioCheck = $('input[name=intervalGroup]:checked', '#advancedSettingsForm').val();
        if (radioCheck == 'custom') {
            let customValue = $('#customIntervalValue').val();
            if (customValue < 1 || customValue > 120) {
                event.preventDefault();
                console.error("Custom intervals must be between 1 and 120 minutes.");
            } else {
                TIME_INTERVAL = customValue * 60 * 1000;
                localStorage.setItem("TIME_INTERVAL", TIME_INTERVAL);
                updateInterval(TIME_INTERVAL);
            }
        } else {
            TIME_INTERVAL = radioCheck * 60 * 1000;
            localStorage.setItem("TIME_INTERVAL", TIME_INTERVAL);
            updateInterval(TIME_INTERVAL);
        }
    }

    $("#selectBox").change(function () {
        if (this.checked) {
            $(".genreGroup").each(function () {
                this.checked = true;
            });
        } else {
            $(".genreGroup").each(function () {
                this.checked = false;
            });
        }
    });

    $(".genreGroup").click(function () {
        if ($(this).is(":checked")) {
            allSelectedOrNot();
        }
        else {
            $("#selectBox").prop("checked", false);
        }
    });

    function allSelectedOrNot() {
        var isAllChecked = 0;

        $(".genreGroup").each(function () {
            if (!this.checked)
                isAllChecked = 1;
        });

        if (isAllChecked == 0) {
            $("#selectBox").prop("checked", true);
        }
    }

    function feedbackAnimation () {
        $("#formFeedback").fadeIn(1000);
        setTimeout(function () {
            $("#formFeedback").fadeOut(1000);
        }, 5000)
    }

    function updateSongDisplay(title, artist) {
        $("#titleID").html(function () {
            return title;
        });

        $("#artistID").html(function () {
            return artist;
        });
    }
});

},{"./testRequire.js":2}],2:[function(require,module,exports){
module.exports = function() {
    console.log('require worked!');
}

},{}]},{},[1]);
