var results;

var resultsToShowSlider = document.getElementById("resultsToShowSlider");
var resultsToShowText = document.getElementById("resultsToShowText");

var resultsToPrint = 50;
var resultsToGraph = resultsToShowSlider.value*10;
var yearToShow = 0;

var chartType = "";
var charts = [];
var chartsDrawn = false;

Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary');;
Chart.defaults.global.defaultFontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font');
Chart.defaults.global.defaultFontSize = 24;

window.addEventListener("resize", onPageResize);

function redrawGraphs()
{
	for(chart of charts)
	{
		chart.destroy();
	}

	if(chartsDrawn)
		showSlides(slideIndex);
}

function onPageResize()
{
	let prevChartType = chartType;
	// Should bar charts be stacked
        chartType = (window.innerWidth > window.innerHeight) ? "bar" : "horizontalBar";

	// Only redraw if dimensions change drastically (phone rotated etc) this prevents issues on mobile
	if(prevChartType != chartType)
		redrawGraphs();
}

async function fetchAsync (url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}


function readSingleFile(e)
{
	var file = e.target.files[0];
	if (!file)
	{
		return;
	}

	// Hide Instructions
	let inst = document.getElementById("instructions");
        inst.style.display = "none";
	inst = document.getElementById("instructionsPt2");
	inst.style.display = "none";

	let sliders = document.getElementById("sliderDiv");
	sliders.style.display = "flex";

	// Should bar charts be stacked
	chartType = (window.innerWidth > window.innerHeight) ? "bar" : "horizontalBar";

	var reader = new FileReader();
	reader.onload = function(e) {
		let contents = e.target.result;
		let Obj = JSON.parse(contents);
		results = analyseData(Obj);
//		displayContents(results, resultsToPrint);
//		drawGraphs();
		showSlides(1);

		let yearSliderText = document.getElementById('yearToShowText');
		let yearSlider = document.getElementById('yearToShowSlider');
		yearSlider.max = Array.from(results.get("years").keys())[0];
		yearSlider.min = Array.from(results.get("years").keys())[Array.from(results.get("years").keys()).length-1] - 1; // 1st option will be 'All'
		yearSlider.value = yearSlider.min;
		yearSliderText.innerText = 'All';

		var element = document.getElementById('sliderDiv');
		element.scrollIntoView();
		chartsDrawn = true;
  	};

  	reader.readAsText(file);
}

function displayContents(results, n)
{
	// Years
	let yearsStr = "";
	for(const [key, value] of results.get("years"))
	{
		yearsStr += key + "\t-\t" + value + "\n";
	}

//	var element = document.getElementById('yearResults');
//	element.textContent = yearsStr;

	// Artists
	let artistsStr = "";
	let x = 0;
        for(const [key, value] of results.get("artists"))
        {
		if(x>n)
			break;

                artistsStr += key + "\t-\t" + value + "\n";
		x++;
        }

//        var element = document.getElementById('artistsResults');
//        element.textContent = artistsStr;

	// Songs
	let songsStr = "";
	x = 0;
        for(const [key, value] of results.get("songs"))
        {
		if(x>n)
                        break;
                songsStr += key + "\t-\t" + value + "\n";
		x++;
        }

//        var element = document.getElementById('songsResults');
//        element.textContent = songsStr;


	// Searches
	let searchesStr = "";
	x = 0;
        for(const [key, value] of results.get("searches"))
        {
                if(x>n)
                        break;

		searchesStr += key + "\t-\t" + value + "\n";
		x++;
        }

//        var element = document.getElementById('searchesResults');
//        element.textContent = searchesStr;


}

function analyseData(data)
{
	let years = new Map();

	// Totals
	let yearTotals = new Map();
	let artists = new Map();
	let songs = new Map();
	let searches = new Map();
	let noDesc = 0;


	for(var entry of data)
	{
		if(entry.header != 'YouTube Music')
			continue;

		// Years
		var year = entry.time.substr(0, 4);
		if(!years.has(year))
		{
			years.set(year, new Map());
			years.get(year).set("artists", new Map());
			years.get(year).set("songs", new Map());
			years.get(year).set("searches", new Map());
		}

		if(yearTotals.has(year))
                        yearTotals.set(year, yearTotals.get(year) + 1);
                else
                        yearTotals.set(year, 1);



		// Artists
		try
		{
			let artistName = entry['subtitles'][0]['name'].split(" - ")[0]

			if(years.get(year).get("artists").has(artistName))
                                years.get(year).get("artists").set(artistName, years.get(year).get("artists").get(artistName) + 1);
                        else
                                years.get(year).get("artists").set(artistName, 1);


			if(artists.has(artistName))
				artists.set(artistName, artists.get(artistName) + 1);
			else
				artists.set(artistName, 1);


		 } catch(error) {noDesc++}

		// Songs
		try
		{
			if(entry['title'][0] != 'W')
				throw 'yeety feety';

			let songName = entry['title'].split("Watched ")[1];


			if(years.get(year).get("songs").has(songName))
                                years.get(year).get("songs").set(songName, years.get(year).get("songs").get(songName) + 1);
                        else
                                years.get(year).get("songs").set(songName, 1);


			if(songs.has(songName))
				songs.set(songName, songs.get(songName) + 1);
			else
				songs.set(songName, 1);
		}catch(e){}



		// Searches
		try
		{
			if(entry['title'][0] != 'S')
				throw 'yeet';

			let searchName = entry['title'].split("Searched for ")[1];


			if(years.get(year).get("searches").has(searchName))
                                years.get(year).get("searches").set(searchName, years.get(year).get("searches").get(searchName) + 1);
                        else
                                years.get(year).get("searches").set(searchName, 1);


			if(searches.has(searchName))
				searches.set(searchName, searches.get(searchName) + 1);
			else
				searches.set(searchName, 1);
		}catch(e){}

	}


	for([key, value] of years)
	{
		for([key2, value2] of value)
		{
			years.get(key).set(key2, new Map([...value2.entries()].sort((a, b) => b[1] - a[1])));
		}
	}


	const yearsSorted = yearTotals;
	const artistsSorted = new Map([...artists.entries()].sort((a, b) => b[1] - a[1]));
	const songsSorted = new Map([...songs.entries()].sort((a, b) => b[1] - a[1]));
	const searchesSorted = new Map([...searches.entries()].sort((a, b) => b[1] - a[1]));

/*	return [yearsSorted, artistsSorted, songsSorted, searchesSorted]; */

	let map = new Map();

	map.set("years", years);
	map.set("yearTotals", yearsSorted);
	map.set("artists", artistsSorted);
	map.set("songs", songsSorted);
	map.set("searches", searchesSorted);

	return map;
}

var uploads = document.getElementsByClassName('upload');
for(let i=0;i<uploads.length;i++)
{uploads[i].addEventListener('change', readSingleFile, false);}


function graphYears(results, n)
{
	// Years
        var canvas = document.getElementById('yearsChart');
	var ctx = document.getElementById('yearsChart').getContext('2d');
	var dataSets = [];
	var labels = [];

	/*
		Chart Js requires that we have data for each entry even if not present in each bar
		This means that for entries we don't want displayed we must input a '0' (zero)


		Therefore we will get top 10 artists for each year and iterate through these
		If the artist is not in the top ten for the current year the inputted data value will be zero

	*/

	let topArtists = [];
	let topArtistsN = 10;
	let yearN = 1;

	for(let [key, value] of results.get("years"))
	{
		let z = Array.from(results.get("years").get(key).get("artists").keys());
		let i = 0;
		while(topArtists.length < yearN * topArtistsN)
		{
			if(!topArtists.includes(z[i]))
				topArtists.push(z[i]);

			i++;
		}

		yearN++;
	}

	let yearTopArtistTotalListens = new Map();

	for( let [yearKey, yearVal] of results.get("years").entries())
		yearTopArtistTotalListens.set(yearKey, 0);


	for(let i=0;i<topArtists.length;i++)
	{
		let artistName = topArtists[i];

		let data = [];
		for( let [yearKey, yearVal] of results.get("years").entries())
		{

			let yearTopArtists = Array.from(results.get("years").get(yearKey).get("artists").keys()).slice(0, topArtistsN);

			yearTopArtistTotalListens.set(yearKey, yearTopArtistTotalListens.get(yearKey)+results.get("years").get(yearKey).get("artists").get(artistName));

			if(yearTopArtists.includes(artistName))
			{
				data.push({x: artistName, y: results.get("years").get(yearKey).get("artists").get(artistName)});
			}
			else
			{
				data.push({x: artistName, y: 0});
			}


		}

                	dataSets.push({
                        	data: data,
				backgroundColor: 'rgb(' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ')',
				label: artistName
                	});

	}

	let otherData = [];

	for( let [yearKey, yearVal] of results.get("years").entries())
		otherData.push({x: yearKey, y: results.get("yearTotals").get(yearKey) - yearTopArtistTotalListens.get(yearKey)});


	dataSets.push({
		data: otherData,
		backgroundColor: 'rgb(' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ')',
                label: "Other"
	});



        var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: "bar", //chartType,

	plugins: [sortedStackedBarPlugin],

        // The data for our dataset
        data:
        {
                labels: Array.from(results.get("years").keys()),
                datasets: dataSets
        },

        // Configuration options go here
        options: {
			responsive: true,
			maintainAspectRatio: false,
//			legend: {display: false},
			scales: {
				xAxes: [{
					stacked: true,
					ticks: {
							beginAtZero: true,
						},
					gridLines: {
          						color: "white",
        					},
				}],
				yAxes: [{
					stacked: true,
                	                gridLines: {
                        	                        color: "white",
                                	        },
	                        }]
			}
                }
        });

	charts.push(chart);
}


function graphArtists(results, n)
{
	let labels, data;
	// Artists
	if(yearToShowSlider.value != yearToShowSlider.min)
	{
		labels = [ ...results.get("years").get(yearToShowSlider.value).get("artists").keys() ].slice(0, n);
		data = [ ...results.get("years").get(yearToShowSlider.value).get("artists").values() ].slice(0, n);
	}
	else
	{
		labels = [ ...results.get("artists").keys() ].slice(0, n);
		data = [ ...results.get("artists").values() ].slice(0, n);
	}


        var ctx = document.getElementById('artistsChart').getContext('2d');
        var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: chartType,


        // The data for our dataset
        data:
        {
                labels: labels,
                datasets: [{
                        label: 'Top artist listens',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: data,
                        }]
        },

        // Configuration options go here
        options: {
                        title: {
					display: true,
					text: "Artists"
				},
			responsive: true,
                        maintainAspectRatio: false,
			scales: {
                                xAxes: [{
					ticks: {
	                                               suggestedMin: data[resultsToGraph-1]-1,
						},
                                        gridLines: {
                                                        color: "white",
                                                },
                                }],
                                yAxes: [{
					ticks: {
	                                               suggestedMin: data[resultsToGraph-1]-1,
						},
                                        gridLines: {
                                                        color: "white",
                                                },
                                }]
                        }
                }
        });


	charts.push(chart);

}


function graphSongs(results, n)
{
	// Songs
	let labels, data;

	if(yearToShowSlider.value != yearToShowSlider.min)
	{
		labels = [ ...results.get("years").get(yearToShowSlider.value).get("songs").keys() ].slice(0, n);
		data = [ ...results.get("years").get(yearToShowSlider.value).get("songs").values() ].slice(0, n);
	}
	else
	{
		labels = [ ...results.get("songs").keys() ].slice(0, n);
		data = [ ...results.get("songs").values() ].slice(0, n);
	}

        var ctx = document.getElementById('songsChart').getContext('2d');
        var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: chartType,

        // The data for our dataset
        data:
        {
                labels: labels,
                datasets: [{
                        label: 'Top song listens',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: data
                        }]
        },

        // Configuration options go here
        options: {
			maintainAspectRatio: false,
			scales: {
                                xAxes: [{
                                        ticks: {
	                                               suggestedMin: data[resultsToGraph-1]-1,
                                                },
					gridLines: {
                                                        color: "white",
                                                },
                                }],
                                yAxes: [{
					ticks: {
	                                               suggestedMin: data[resultsToGraph-1]-1,
						},
                                        gridLines: {
                                                        color: "white",
                                                },
                                }]
                        }
                }
        });

	charts.push(chart);

}



function graphSearches(results, n)
{
	// Searches
	let labels, data;



	if(yearToShowSlider.value != yearToShowSlider.min)
	{
		let maxTotalSearches = Array.from( results.get("years").get(yearToShowSlider.value).get("searches").keys() ).length

		if(n > maxTotalSearches)
			n = maxTotalSearches;


		labels = [ ...results.get("years").get(yearToShowSlider.value).get("searches").keys() ].slice(0, n);
		data = [ ...results.get("years").get(yearToShowSlider.value).get("searches").values() ].slice(0, n);
	}
	else
	{
		labels = [ ...results.get("searches").keys() ].slice(0, n);
		data = [ ...results.get("searches").values() ].slice(0, n);
	}

	let suggestMin = (data[0]==1) ? 0 : data[resultsToGraph-1]-1;


	var ctx = document.getElementById('searchesChart').getContext('2d');
	var chart = new Chart(ctx, {
	// The type of chart we want to create
	type: chartType,

	// The data for our dataset
	data:
	{
        	labels: labels,
        	datasets: [{
        		label: 'Top searches',
		        backgroundColor: 'rgb(255, 99, 132)',
		        borderColor: 'rgb(255, 99, 132)',
		        data: data
		        }]
	},

	// Configuration options go here


	options: {
                        responsive: true,
			maintainAspectRatio: false,
			scales: {
                                xAxes: [{
					ticks: {
	                                               suggestedMin: suggestMin,
                                                },
                                        gridLines: {
                                                        color: "white",
                                                },
                                }],
                                yAxes: [{
					ticks: {
                                                       suggestedMin: suggestMin,
                                                },
                                        gridLines: {
                                                        color: "white",
                                                },
                                }]
                        }
		}
	});

	charts.push(chart);

}













var slideIndex = 1;
//showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
	slideIndex += n
	redrawGraphs();
}

// Thumbnail image controls
function currentSlide(n) {
  slideIndex = n;
  redrawGraphs();
}

function showSlides(n) {
  var i;
  var slideContainer = document.getElementById("slideshowGraphs");
  var slides = document.getElementsByClassName("mySlides");


  slideContainer.style.display = 'block';

  var dots = document.getElementsByClassName("dot");

  for(let i=0;i<dots.length;i++)
  {dots[i].style.display = 'inline-block';}


  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";

	switch(slideIndex-1)
	{
		case 0:
			graphYears(results, resultsToGraph);
			break;

		case 1:
			graphArtists(results, resultsToGraph);
			break;

		case 2:
			graphSongs(results, resultsToGraph);
                        break;

                case 3:
                        graphSearches(results, resultsToGraph);
                        break;

		default:
			break;
	}
}

/*
function drawGraphs()
{
	graphYears(results, resultsToGraph);
	graphArtists(results, resultsToGraph);
	graphSongs(results, resultsToGraph);
	graphSearches(results, resultsToGraph);
}
*/

function showInstructions()
{
	let x = document.getElementById("instructions");
	x.style.display = "flex";
}

function showInstructionsPtTwo()
{
	let x = document.getElementById("instructionsPt2");
        x.style.display = "inline-flex";
}



var resultsToShowSlider = document.getElementById("resultsToShowSlider");
var resultsToShowText = document.getElementById("resultsToShowText");
resultsToShowText.innerHTML = " " + resultsToShowSlider.value*10; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
resultsToShowSlider.oninput = function() {
	resultsToShowText.innerHTML = this.value*10;
	resultsToGraph = this.value*10;

	redrawGraphs();
}

// Update the current slider value (each time you drag the slider handle)
yearToShowSlider.oninput = function() {
        yearToShow = this.value;

	if(this.value == yearToShowSlider.min)
		yearToShowText.innerText = 'All';
	else
	        yearToShowText.innerText = this.value;

	redrawGraphs();
}



/*
* chart.js do not support stacked bar charts, which are sorted by value,
* therefore it's needed to perform this functionality with custom plugins
*/
var sortedStackedBarPlugin = {

/*
* Sorts data by value and calculates values for bar stacks
*/
beforeDraw(chart) {

    // create data container in chart instance
    chart.sortedData = {};
    
    // iterate over datasets
    chart.data.datasets.forEach((dataset, datasetIndex) => {
    
        // iterate over dataset records
        dataset.data.forEach((data, index) => {
        
            // create data container for bar stack data
            if(!chart.sortedData[index]) {
                chart.sortedData[index] = {
                    data: []
                };
            }
            
            // save data
            chart.sortedData[index].data[datasetIndex] = {
                datasetIndex: datasetIndex,
                hidden: chart.getDatasetMeta(datasetIndex).hidden ? true : false,
                color: dataset.backgroundColor,
                value: dataset.data[index].y,
                y: chart.getDatasetMeta(datasetIndex).data[index]._model.y,
                base: chart.getDatasetMeta(datasetIndex).data[index]._model.base,
            };
            
        });
    });
    
    var chartTop = chart.scales['y-axis-0'].top;
    var max = chart.scales['y-axis-0'].max;
    var h = chart.scales['y-axis-0'].height / max;
    
    // iterate over datasets
    chart.data.datasets.forEach((dataset, datasetIndex) => {
        
        // iterate over dataset records
        dataset.data.forEach((data, index) => {
        
            // sort data in bar stack by value
            chart.sortedData[index].data = Object.keys(chart.sortedData[index].data)
                .map(k => chart.sortedData[index].data[k])
                .sort((a, b) => a.value - b.value);
                
            // iterate over stack records
            chart.sortedData[index].data.forEach((d, i) => {
            
                // calculate base value
                d.base = chartTop + (max - Object.keys(chart.sortedData[index].data)
                    .map(k => chart.sortedData[index].data[k].value)
                    .reduce((a, b) => a + b, 0)) * h
                    + Object.keys(chart.sortedData[index].data)
                    .map(k => chart.sortedData[index].data[k])
                    .filter(d => d.hidden)
                    .reduce((a, b) => a + b.value, 0) * h;                  
                
                // increase base value with values of previous records
                for (var j = 0; j < i; j++) {
                    d.base += chart.sortedData[index].data[j].hidden 
                        ? 0 
                        : h * chart.sortedData[index].data[j].value;
                }
                
                // set y value
                d.y = d.base + h * d.value;
                
            });
        });
    });
},

/*
* Sets values for base and y
*/
beforeDatasetDraw(chart, args) {
    chart.getDatasetMeta(args.index).data.forEach((data, index) => {
        var el = chart.sortedData[index].data.filter(e => e.datasetIndex === args.index)[0];
        data._model.y = el.y;
        data._model.base = el.base;
    });
   }
   
};










/*
var chart = new Chart(document.getElementById('canvas'), {
                type : 'bar',
                data : {
                    labels : ["2018-07-06", "2018-07-07", "2018-07-08", "2018-07-09", "2018-07-10"],
                    datasets : [
                        {
                            label: "Dataset 1", 
                            backgroundColor: "red", 
                            data: [ {x: "2018-07-06", y: 1}, {x: "2018-07-07", y: 2}, {x: "2018-07-08", y: 3}]
                        }, 
                        {
                            label: "Dataset 2", 
                            backgroundColor: "blue", 
                            data: [ {x: "2018-07-06", y: 3}, {x: "2018-07-07", y: 2}, {x: "2018-07-08", y: 1}]
                        }, 
                        {
                            label: "Dataset 3", 
                            backgroundColor: "green", 
                            data: [ {x: "2018-07-06", y: 2}, {x: "2018-07-07", y: 1}, {x: "2018-07-08", y: 2}]
                        }
                    ],
                    borderWidth : 1
                },
                options : {
                    responsive : true,
                    maintainAspectRatio : false,
                    title : {
                        display : true,
                        text : 'Test'
                    },
                    scales : {
                        xAxes : [ {
                            stacked : true,
                            time : {
                                unit : 'day'
                            }
                        } ],
                        yAxes : [ {
                            stacked : true,
                            ticks : {
                                beginAtZero : true
                            }
                        } ]
                    }
                }
            });
*/
