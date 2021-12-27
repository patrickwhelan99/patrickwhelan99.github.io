import * as FileHandling from "./FileHandling.js";
import { ParseFile, UnionOfMaps } from "./Parsers.js";

// Where the results of the analysis are stored
var results;

var resultsToShowSlider = document.getElementById("resultsToShowSlider");
var resultsToShowText = document.getElementById("resultsToShowText");

var resultsToPrint = 50;
var resultsToGraph = resultsToShowSlider.value * 10;
var yearToShow = 0;

var forcedOrientation = false;
const Orientation = { vertical: "x", horizontal: "y" }
var chartOrientation = "";
var charts = [];
var chartsDrawn = false;

var resultsToShowSlider = document.getElementById("resultsToShowSlider");
var resultsToShowText = document.getElementById("resultsToShowText");
resultsToShowText.innerHTML = " " + resultsToShowSlider.value * 10;

// Set default chart options
Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--secondary');
Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--font');

let minFontSize = 12;
let maxFontSize = 24;
Chart.defaults.font.size = 18;

const Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let yearSlider;


// Add listener for window resize
window.addEventListener("resize", OnPageResize);

// Add listener for file upload
var uploads = document.getElementsByClassName("upload");
for (let i = 0; i < uploads.length; i++)
{
	uploads[i].addEventListener('change', FilesUploaded, false)
}


function RedrawGraphs() 
{

	for (var chart of charts) 
	{
		chart.destroy();
	}

	if (chartsDrawn)
	{
		ShowSlides(slideIndex);
	}
	else
	{
		SetupGraphListeners();
		ShowSlides(1);
	}
}

function OnPageResize() 
{
	if (forcedOrientation)
	{
		return;
	}

	let prevChartOrientation = chartOrientation;
	// Should bar charts be stacked
	chartOrientation = (window.innerWidth > window.innerHeight) ? Orientation.vertical : Orientation.horizontal;

	// Only redraw if dimensions change drastically (phone rotated etc) this prevents issues on mobile
	if (prevChartOrientation != chartOrientation && results != null)
	{
		RedrawGraphs();
	}
}

async function FilesUploaded(e)
{
	FileHandling.ProcessFiles(e);
}

export function AfterLastFileReadIn(JSONDataSets, HTMLDataSets) 
{
	if (JSONDataSets.length < 1 && HTMLDataSets.length < 1) 
	{
		HideShownSection("instructions");
		HideShownSection("instructionsPt2");
		ShowHiddenSection("NoData");
		return;
	}

	// Hide instructions and show the slider controls
	HideAll();
	ShowHiddenSection("sliderDiv")



	// Should bar charts be stacked
	chartOrientation = (window.innerWidth > window.innerHeight) ? Orientation.vertical : Orientation.horizontal;

	results = AnalyseData(JSONDataSets, HTMLDataSets);

	let yearSliderText = document.getElementById('yearToShowText');
	yearSlider = document.getElementById('yearToShowSlider');

	const Years = [...results.get("years").keys()].sort((a, b) => a - b);
	yearSlider.min = Years[0] - 1;
	yearSlider.max = Years[Years.length - 1]; // 1st option will be 'All'
	yearSlider.value = yearSlider.min;
	yearSliderText.innerText = 'All';

	var element = document.getElementById('sliderDiv');
	element.scrollIntoView();
	

	ShowTopDiscoveredArtists();

	RedrawGraphs();
	chartsDrawn = true;
}

function ShowTopDiscoveredArtists()
{
	const years = [...results.get("years").keys()].sort((a, b) => b - a);
	const year = years[0];
	document.getElementById("TopNewArtistYear").innerHTML = "Your Top Discoveries of " + year;


	const artist = GetTopArtists(year, 100);
	const artistNames = [...artist.keys()];
	if(years.length > 1)
	{
		for(let i = 1; i < years.length; i++)
		{
			for(let j = 0; j < artistNames.length; j++)
			{
				if(results.get("years").get(years[i]).get("artists").has(artistNames[j]))
				{
					artist.delete(artistNames[j]);
				}
			}
		}
	}

	if(artist.size > 0)
	{
		document.getElementById("TopNewArtistName").innerHTML = [...artist.keys()].slice(0, 10).reduce((x, y) => x + "<br>" + y);
	}
	else
	{
		document.getElementById("TopNewArtistName").innerHTML = "No top artist found :(";
	}

	
}

function TruncateText(text, count)
{
	if(text == null)
	{
		return "";
	}

    return text.slice(0, count) + (text.length > count ? "..." : "");
}

function AnalyseData(JSONDataSets, HTMLDataSets)
{
	let AggregatedJSONData = ParseFile(JSONDataSets, "JSON");
	let AggregatedHTMLData = ParseFile(HTMLDataSets, "HTML");
	let AllData = null;

	if(AggregatedHTMLData != null && AggregatedJSONData != null)
	{
		AllData = UnionOfMaps(AggregatedJSONData, AggregatedHTMLData);
	}
	else
	{
		AllData = AggregatedJSONData ?? AggregatedHTMLData;
	}

	const yearsSorted = AllData.get("yearTotals");
	const artistsSorted = new Map([...AllData.get("artists").entries()].sort((a, b) => b[1] - a[1]));
	const songsSorted = new Map([...AllData.get("songs").entries()].sort((a, b) => b[1] - a[1]));

	let searchesSorted = null;

	if(AllData.has("searches") && AllData.get("searches").size > 0)
	{
		searchesSorted = new Map([...AllData.get("searches").entries()].sort((a, b) => b[1] - a[1]));
	}

	let map = new Map();

	map.set("years", AllData.get("years"));
	map.set("yearTotals", yearsSorted);
	map.set("artists", artistsSorted);
	map.set("songs", songsSorted);

	if(searchesSorted != null)
	{
		map.set("searches", searchesSorted);
	}

	return map;
}



function GetTopArtists(YearKey, NumberOfArtists)
{
	return new Map([...results	.get("years")
								.get(YearKey)
								.get("artists")
								.entries()]
								.sort((a, b) => b[1] - a[1]).slice(0, NumberOfArtists));
}

function RandomColour()
{
	return 'rgb(' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ', ' + Math.round(Math.random() * 255) + ')';
}


function GraphYears(results, resultsToGraph)
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

	let topArtistsN = resultsToGraph;

	let YearsArray = [];

	if(yearSlider.value == yearSlider.min)
	{
		YearsArray = [...results.get("years").keys()].sort((a, b) => a - b);
	}
	else
	{
		YearsArray = [yearSlider.value];
	}

	
	
	// Get the top N artists for each year
	let TopArtistsEachYear = new Map();
	for(let Year of YearsArray)
	{
		TopArtistsEachYear.set(Year, GetTopArtists(Year, topArtistsN));
	}

	// For each year, sum the listens for the top N artists
	let SumTopArtistsTotalListens = new Map();
	for (let Year of YearsArray)
	{
		let ArtistlistensThatYear = [...TopArtistsEachYear.get(Year).values()]
		
		if(ArtistlistensThatYear.length > 0)
		{
			SumTopArtistsTotalListens.set(Year, ArtistlistensThatYear.reduce((x,y) => x + y));
		}
		else
		{
			SumTopArtistsTotalListens.set(Year, 0);
		}
	}

	// Sum all the listens for each year that weren't from the top N artists
	let SumOtherArtistsTotalListens = new Map();
	for (let Year of YearsArray)
	{
		let ArtistsListenedToThatYear = [...results.get("years").get(Year).get("artists").values()];

		if(ArtistsListenedToThatYear.length > 0)
		{
			let TotalListensThatYear = ArtistsListenedToThatYear.reduce((x,y) => x + y)
			let OtherArtistListens = TotalListensThatYear - SumTopArtistsTotalListens.get(Year);
			SumOtherArtistsTotalListens.set(Year, OtherArtistListens);
		}
		else
		{
			SumOtherArtistsTotalListens.set(Year, 0);
		}
	}

	let AllTheTopArtists = [];
	
	for(let Year of YearsArray.reverse())
	{
		AllTheTopArtists.push([...TopArtistsEachYear.get(Year).keys()]);
	}

	AllTheTopArtists = AllTheTopArtists.flat(1);

	AllTheTopArtists = [...new Set(AllTheTopArtists)];

	for(let ArtistKey of AllTheTopArtists.flat(1))
	{
		let ArtistData = [];

		// Add the data to the graph!
		for(let Year of YearsArray)
		{
			if(TopArtistsEachYear.get(Year).has(ArtistKey))
			{
				ArtistData.push(TopArtistsEachYear.get(Year).get(ArtistKey));
			}
			else
			{
				ArtistData.push(Number.NaN);
			}
		}

		dataSets.push({label: ArtistKey, data: ArtistData, backgroundColor: RandomColour()});
	}

	var chart = new Chart(ctx, 
	{
		type: "bar",

		data:
		{
			labels: YearsArray,
			datasets: dataSets
		},

		options: 
		{
			indexAxis: chartOrientation,
			
			title: 
			{
				display: true,
				text: "YEARS"
			},
			responsive: true,
			maintainAspectRatio: false,

			scales: 
			{
				x:
				{
					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
					ticks:
					{
						callback: function (value, index, values) {return TruncateText(this.getLabelForValue(value), 20);}
					}
				},
				y:
				{
					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
				}
			},

			skipNull: true,
		}
	});

	charts.push(chart);
}

// Used for artists, songs, searches etc
function DrawBarGraph(results, n, type)
{
	if(!results.has(type) || results.get(type).length < 1)
	{
		let NoDataSection = document.getElementById("NoDataForType");
		document.getElementById("NoDataForTypeTitle").innerHTML = "No " + type + " data found!";
		slides[slideIndex].getElementsByTagName('canvas')[0].style.display = "none";
		slides[slideIndex].appendChild(NoDataSection);
		ShowHiddenSection("NoDataForType");
		return;
	}

	let labels, data;
	// Artists
	if (yearToShowSlider.value != yearToShowSlider.min)
	{
		labels = [...results.get("years").get(yearToShowSlider.value).get(type).keys()].slice(0, n);
		data = [...results.get("years").get(yearToShowSlider.value).get(type).values()].slice(0, n);
	}
	else
	{
		labels = [...results.get(type).keys()].slice(0, n);
		data = [...results.get(type).values()].slice(0, n);
	}

	//labels.forEach((value, index, array) => array[index] = TruncateText(value, 10));

	let suggestMin = (data[0] == 1) ? 0 : data[resultsToGraph - 1] - 1;
	let randColour = RandomColour();

	var ctx = document.getElementById(type + 'Chart').getContext('2d');
	var chart = new Chart(ctx, {

		type: 'bar',

		

		// The data for our dataset
		data:
		{
			labels: labels,
			datasets: [{
				label: type != "yearTotals" ? 'Top ' + type + ' listens' : "Listens per year",
				backgroundColor: type != "yearTotals" ? 'rgb(255, 99, 132)' : randColour,
				borderColor: type != "yearTotals" ? 'rgb(255, 99, 132)' : randColour,
				data: data,
			}]
		},

		// Configuration options go here
		options: 
		{
			indexAxis: chartOrientation,
			title: 
			{
				display: true,
				text: type.toUpperCase()
			},
			responsive: true,
			maintainAspectRatio: false,
			scales: 
			{
				x:
				{
					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
					ticks:
					{
						callback: function (value, index, values) {return TruncateText(this.getLabelForValue(value), 20);}
					}
				},
				y:
				{
					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
				}
			}
		}
	});


	charts.push(chart);

}

// Used for monthly listening graph
function DrawLineGraph(results, type)
{
	let labels, dataSets = [];

	labels = Months;

	let YearsArray = [];

	if(yearSlider.value == yearSlider.min)
	{
		YearsArray = [...results.get("years").keys()].sort((a, b) => a - b);
	}
	else
	{
		YearsArray = [yearSlider.value];
	}


	for(let Year of YearsArray)
	{
		let colour = RandomColour();
		dataSets.push
		(
			{
				label: Year,
				backgroundColor: colour,
				borderColor: colour,
				data: results.get("years").get(Year).get("months"),
			}
		);
	}

	var ctx = document.getElementById(type + 'Chart').getContext('2d');
	var chart = new Chart(ctx, {

		type: "line",


		data:
		{
			labels: labels,
			datasets: dataSets
		
		},

		// Configuration options go here
		options: {
			title: {
				display: true,
				text: type.toUpperCase()
			},
			responsive: true,
			maintainAspectRatio: false,
			scales: 
			{
				x:
				{
					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
					ticks:
					{
						callback: function (value, index, values) {return TruncateText(this.getLabelForValue(value), 20);}
					}
				},
				y:
				{
					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
				}
			},
		}
	});

	charts.push(chart);

}

function DrawRadarGraph(results, type)
{
	let labels, dataSets = [];

	

	let YearsArray = [...results.get("years").keys()].sort((a, b) => a - b);

	labels = YearsArray;

	let data = [];

	for(let Year of YearsArray)
	{
		data.push(results.get("yearTotals").get(Year));
	}

	let colour = RandomColour();
	dataSets.push
	(
		{
			label: "Listens per year",
			backgroundColor: colour,
			borderColor: colour,
			data: data,
		}
	);

	var ctx = document.getElementById(type + 'Chart').getContext('2d');
	var chart = new Chart(ctx, {

		type: "radar",


		data:
		{
			labels: labels,
			datasets: dataSets
		
		},

		// Configuration options go here
		options: 
		{
			title: 
			{
				display: true,
				text: type.toUpperCase()
			},
			responsive: true,
			maintainAspectRatio: false,
			scales: 
			{
				r: 
				{
					angleLines: 
					{
						display: false
					},
					suggestedMin: 50,
					suggestedMax: 100,

					grid:
					{
						color: getComputedStyle(document.documentElement).getPropertyValue('--secondary')
					},
				}
			},
		}
	});

	charts.push(chart);
}




var slideIndex = 0;

function SetupGraphListeners()
{
	var graphOrientationButtons = document.getElementsByClassName("GraphOrientationButton");
	for (let i = 0; i < graphOrientationButtons.length; i++)
	{
		graphOrientationButtons[i].addEventListener('click', () => { SetGraphOrientation(i) })
	}

	var changeSlideButtons = document.getElementsByClassName("ChangeSlideButton");
	for (let i = 0; i < changeSlideButtons.length; i++)
	{
		if (i < 1)
		{
			changeSlideButtons[i].addEventListener('click', () => { PlusSlides(-1) });
		}
		else
		{
			changeSlideButtons[i].addEventListener('click', () => { PlusSlides(1) });
		}
	}


	var slideIndicatorsBottom = document.getElementsByClassName("dot");
	for (let i = 0; i < slideIndicatorsBottom.length; i++)
	{
		slideIndicatorsBottom[i].addEventListener('click', () => { CurrentSlide(i) });
	}
}




// Next/previous controls
function PlusSlides(n) 
{
	slideIndex += n
	RedrawGraphs();
}

// Thumbnail image controls
function CurrentSlide(n) 
{
	slideIndex = n;
	RedrawGraphs();
}


var slides = null;

function ShowSlides(CurrentSlideIndex) 
{
	var i;
	var slideContainer = document.getElementById("slideshowGraphs");
	slides = slides ?? document.getElementsByClassName("mySlides");

	Chart.defaults.font.size = Math.max((1 - (resultsToGraph / 100)) * maxFontSize, minFontSize);

	slideContainer.style.display = 'block';

	var dots = document.getElementsByClassName("dot");

	for (let i = 0; i < dots.length; i++)
		dots[i].style.display = 'inline-block';


	if (CurrentSlideIndex > slides.length - 1)
		slideIndex = 0

	if (CurrentSlideIndex < 0)
		slideIndex = slides.length - 1

	for (i = 0; i < slides.length; i++)
		slides[i].style.display = "none";

	for (i = 0; i < dots.length; i++)
		dots[i].className = dots[i].className.replace(" active", "");

	slides[slideIndex].style.display = "block";
	dots[slideIndex].className += " active";

	switch (slideIndex) 
	{
		case 0:
			GraphYears(results, resultsToGraph);
			break;

		case 1:
			if([...results.get("yearTotals").keys()].length > 2)
			{
				DrawRadarGraph(results, "yearTotals");
			}
			else
			{
				DrawBarGraph(results, resultsToGraph, "yearTotals");
			}
			
			break;

		case 2:
			DrawLineGraph(results, "months");
			break;

		case 3:
			DrawBarGraph(results, resultsToGraph, "artists");
			break;

		case 4:
			DrawBarGraph(results, resultsToGraph, "songs");
			break;

		case 5:
			DrawBarGraph(results, resultsToGraph, "searches");
			break;

		case 6:
			ShowTopDiscoveredArtists();
			break;

		default:
			break;
	}
}

document.getElementById("ShowExample").addEventListener('click', ShowExample);

function ShowExample()
{
	AfterLastFileReadIn([GenerateRandomJSONDataSet()], null);
}

let RandomArtists = ["Viola Beach","Chet Faker","For Those I Love","Lloyd Cole","Thelma Plum","The Arcs","Sebii","Flora Cash","Remo Drive","Zuzu","The Mountain Goats","HAIM","Robotaki","Robinson","Great Lake Swimmers","M83","St. Lucia","Catherine Feeny","Beck","Inhaler","Arlie","Primal Scream","Angus & Julia Stone","Japanese Breakfast","Radiohead","SWMRS","Talking Heads","Mattiel","The Naked and Famous","The Verve","Tayo Sound","Kristin Hersh","Dexters","Car Seat Headrest","Kanye West","Bon Iver","Charli XCX","A Beacon School","Made Violent","Muse","Her's","Young The Giant","Daniel ","CRUISR","The Animals","salvia palth","Unknown Mortal Orchestra","Asaf Avidan","Arlo Parks"];
let RandomSongs = ["Half Light I","Brooklyn Bridge To Chorus","What Katie Did","The Great Escape","Relax","Nothing Gets Me High","Drugs","anemone","Masterpiece","Half Light II (No Celebration)","Drunk","Ways to Phrase a Rejection","Glad He's Gone","Maps","Red","we fell in love in october","No Hope","Little Uneasy","Ferris Wheel","title track","Dry The Rain (Remaster)","Heart of Mine","Mr 10pm Bedtime (GIRLI vs The Tuts)","Born To Die","Royals","Disparate Youth","Come A Little Closer","Heroin","Build God, Then We'll Talk","Night Time","Every Other Freckle","Worth It","Carry Me","F.U.U.","Fineshrine","Temper Temper","Coming Up Short","Luv, Hold Me Down","I Bet You Look Good On The Dancefloor","I Would Do Anything for You","Drop the Guillotine","Where Is My Mind?","No Cars Go","Team","Lying Is the Most Fun a Girl Can Have Without Taking Her Clothes Off","A Certain Romance","Cold Hard Bitch","Quarry Hymns","To Build A Home","Under Your Thumb"];

function GenerateRandomJSONDataSet()
{
	let DataSet = [];
	DataSet = GenerateRandomWatchData(DataSet);
	DataSet = GenerateRandomSearchData(DataSet);

	return DataSet;
}

function GenerateRandomWatchData(DataSet)
{
	let DiscoveredArtists = [];
	for(let i = 0; i < 10; i++)
	{
		DiscoveredArtists.push(GetRandomFromArray(RandomArtists));
	}

	DiscoveredArtists = new Set(DiscoveredArtists);

	for (let i = 0; i < 5000; i++)
	{
		let Artist = GetRandomFromArray(RandomArtists);

		DataSet.push(
			{
				header: "YouTube Music",
				title: "Watched " + GetRandomFromArray(RandomSongs),
				titleUrl: "https://www.youtube.com/watch?v0000000",
				subtitles: [
					{
						name: Artist + " - Topic",
						url: "https://www.youtube.com/channel/0000000"
					}
				],

				time: DiscoveredArtists.has(Artist) ? GetRandomISO8601String(0, 2022) : GetRandomISO8601String(),
				products: ["YouTube"],
				activityControls: ["YouTube watch history"]
			}
		);
	}

	return DataSet;
}

function GenerateRandomSearchData(DataSet)
{
	for (let i = 0; i < 500; i++)
	{
		DataSet.push
		(
			{
				header: "YouTube Music",
				title: "Searched for " + GetRandomFromArray(RandomArtists) + " - " + GetRandomFromArray(RandomSongs),
				titleUrl: "https://www.youtube.com/results?search_query\u003d0000000",
				time: GetRandomISO8601String(),
				products: ["YouTube"],
				activityControls: ["YouTube search history"]
			}
		
		);
	}

	return DataSet;
}

function GetRandomFromArray(Array)
{
	return Array[Math.floor(Math.random()*Array.length)];
}

function AddLeadingZero(Num)
{
	let Str = Num.toString();
	return Str.length < 2 ? "0" + Str : Str;
}

function GetRandomISO8601String(RangeOfYears = 5, Offset = 2018)
{
	let year = Math.floor(Math.random() * RangeOfYears + Offset);
	let month = Math.floor(Math.random() * 13);
	let day = Math.floor(Math.random() * 32 + 1);
	let hour = Math.floor(Math.random() * 25);
	let minute = Math.floor(Math.random() * 61);
	let second = Math.floor(Math.random() * 61);

	month = AddLeadingZero(month);
	day = AddLeadingZero(day);
	hour = AddLeadingZero(hour);
	minute = AddLeadingZero(minute);
	second = AddLeadingZero(second);


	return year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second + ".000Z";
}



document.getElementById("ShowInstructions").addEventListener('click', () => { ShowHiddenSection("instructions"); });
document.getElementById("ShowInstructions2").addEventListener('click', () => { ShowHiddenSection("instructionsPt2"); });

function ShowHiddenSection(SectionID) 
{
	let x = document.getElementById(SectionID);
	x.style.display = "flex";
}

function HideShownSection(SectionID) 
{
	let x = document.getElementById(SectionID);
	x.style.display = "none";
}

function HideAll()
{
	HideShownSection("instructions");
	HideShownSection("instructionsPt2");
	HideShownSection("NoData");
}


// Update the current slider value (each time you drag the slider handle)
resultsToShowSlider.oninput = function () 
{
	resultsToShowText.innerHTML = this.value * 10;
	resultsToGraph = this.value * 10;

	RedrawGraphs();
}

// Update the current slider value (each time you drag the slider handle)
yearToShowSlider.oninput = function () 
{
	yearToShow = this.value;

	if (this.value == yearToShowSlider.min)
		yearToShowText.innerText = 'All';
	else
		yearToShowText.innerText = this.value;

	RedrawGraphs();
}



function SetGraphOrientation(i)
{
	switch (i)
	{
		case 1:
			chartOrientation = Orientation.vertical;
			break;

		case 2:
			chartOrientation = Orientation.horizontal;
			break;

		default:
			break;
	}

	forcedOrientation = (i != 0);

	RedrawGraphs();
}