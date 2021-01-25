// Where the results of the analysis are stored
var results;

var resultsToShowSlider = document.getElementById("resultsToShowSlider");
var resultsToShowText = document.getElementById("resultsToShowText");

var resultsToPrint = 50;
var resultsToGraph = resultsToShowSlider.value*10;
var yearToShow = 0;

var chartType = "";
var charts = [];
var chartsDrawn = false;

var resultsToShowSlider = document.getElementById("resultsToShowSlider");
var resultsToShowText = document.getElementById("resultsToShowText");
resultsToShowText.innerHTML = " " + resultsToShowSlider.value*10;


// Set default chart options
Chart.defaults.global.defaultFontColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary');;
Chart.defaults.global.defaultFontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font');
Chart.defaults.global.defaultFontSize = 24;


// Add listener for window resize
window.addEventListener("resize", onPageResize);

// Add listener for file upload
var uploads = document.getElementsByClassName('upload');
for(let i=0;i<uploads.length;i++)
	uploads[i].addEventListener('change', readSingleFile, false);

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

// Upload callback func
function readSingleFile(e)
{
	var file = e.target.files[0];
	if (!file)
		return;

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


	let map = new Map();

	map.set("years", years);
	map.set("yearTotals", yearsSorted);
	map.set("artists", artistsSorted);
	map.set("songs", songsSorted);
	map.set("searches", searchesSorted);

	return map;
}




function graphYears(results, n)
{
	// Years
        var canvas = document.getElementById('yearsChart');
	var ctx = document.getElementById('yearsChart').getContext('2d');
	var dataSets = [];
	var labels = [];

	/*
		Get the top 10 artists in each year along with the sum of all other listens that year and
		then create a stacked bar from this information
		
		Colours are hard. Having distinct colours whilst still being colour-blind friendly is near 
		impossible. So we're just going to generate random colours each time
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
			title: {
					display: true,
					text: "YEARS"
			},
			responsive: true,
			maintainAspectRatio: false,

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


function graphOther(results, n, type)
{
	let labels, data;
	// Artists
	if(yearToShowSlider.value != yearToShowSlider.min)
	{
		labels = [ ...results.get("years").get(yearToShowSlider.value).get(type).keys() ].slice(0, n);
		data = [ ...results.get("years").get(yearToShowSlider.value).get(type).values() ].slice(0, n);
	}
	else
	{
		labels = [ ...results.get(type).keys() ].slice(0, n);
		data = [ ...results.get(type).values() ].slice(0, n);
	}

	let suggestMin = (data[0]==1) ? 0 : data[resultsToGraph-1]-1;
	
        var ctx = document.getElementById(type + 'Chart').getContext('2d');
        var chart = new Chart(ctx, {
        
        type: chartType,


        // The data for our dataset
        data:
        {
                labels: labels,
                datasets: [{
                        label: 'Top ' + type + ' listens',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: data,
                        }]
        },

        // Configuration options go here
        options: {
                        title: {
					display: true,
					text: type.toUpperCase()
				},
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


// Next/previous controls
function plusSlides(n)
{
	slideIndex += n
	redrawGraphs();
}

// Thumbnail image controls
function currentSlide(n)
{
	slideIndex = n;
	redrawGraphs();
}

function showSlides(n) 
{
	var i;
	var slideContainer = document.getElementById("slideshowGraphs");
	var slides = document.getElementsByClassName("mySlides");


	slideContainer.style.display = 'block';

	var dots = document.getElementsByClassName("dot");

	for(let i=0;i<dots.length;i++)
		dots[i].style.display = 'inline-block';


	if (n > slides.length) 
		slideIndex = 1
		
	if (n < 1)
		slideIndex = slides.length
		
	for (i = 0; i < slides.length; i++)
		slides[i].style.display = "none";
  
	for (i = 0; i < dots.length; i++)
		dots[i].className = dots[i].className.replace(" active", "");

	slides[slideIndex-1].style.display = "block";
	dots[slideIndex-1].className += " active";

	switch(slideIndex-1)
	{
		case 0:
			graphYears(results, resultsToGraph);
			break;

		case 1:
			graphOther(results, resultsToGraph, "artists");
			break;

		case 2:
			graphOther(results, resultsToGraph, "songs");
                        break;

                case 3:
                        graphOther(results, resultsToGraph, "searches");
                        break;

		default:
			break;
	}
}


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





// Update the current slider value (each time you drag the slider handle)
resultsToShowSlider.oninput = function() 
{
	resultsToShowText.innerHTML = this.value*10;
	resultsToGraph = this.value*10;

	redrawGraphs();
}

// Update the current slider value (each time you drag the slider handle)
yearToShowSlider.oninput = function() 
{
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
var sortedStackedBarPlugin = 
{

/*
* Sorts data by value and calculates values for bar stacks
*/
	beforeDraw(chart) 
	{

    		// create data container in chart instance
    		chart.sortedData = {};

		// iterate over datasets
		chart.data.datasets.forEach((dataset, datasetIndex) => {

			// iterate over dataset records
			dataset.data.forEach((data, index) => {
        
				// create data container for bar stack data
				if(!chart.sortedData[index]) 
					chart.sortedData[index] = {data: []};
            
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
					for (var j = 0; j < i; j++) 
						d.base += chart.sortedData[index].data[j].hidden ? 0 : h * chart.sortedData[index].data[j].value;
                
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
