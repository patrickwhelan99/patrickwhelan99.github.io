

function AddNewYear(MapToAlter, Year)
{
    MapToAlter.set(Year, new Map());
    MapToAlter.get(Year).set("artists", new Map());
    MapToAlter.get(Year).set("songs", new Map());
    MapToAlter.get(Year).set("searches", new Map());
    MapToAlter.get(Year).set("months", new Array(12));

    for(let i = 0; i < 12; i++)
    {
        MapToAlter.get(Year).get("months")[i] = 0;
    }

    return MapToAlter;
}

let TimeStamps = new Map();

export function ParseFile(GenericDataSets, TypeOfData)
{
    if(GenericDataSets == null || GenericDataSets.length < 1)
    {
        return;
    }

    var Enumerate, ShouldSkip, GetArtist, GetSong, GetYear, GetMonth, GetDay, GetISO8601Date, GetSearch;

    switch(TypeOfData)
    {
        case "HTML":
            Enumerate = function(DataFile) 
                        {
                            return DataFile.getElementsByClassName("mdl-grid");
                        }
            GetYear =   function (x) 
                        {
                            let dateTime = x.children[1].children[3].nextSibling.textContent;
                            return dateTime.slice(dateTime.indexOf(',') - 4, dateTime.indexOf(','));
                        };
            GetArtist = function (x) 
                        {
                            let str = x.children[1].children[2].innerText;
                            return str.slice(0, str.length - 8);
                        };
            GetSong =   function (x) 
                        {
                            return x.children[1].children[0].innerText;
                        };
            GetMonth =  function (x) 
                        {
                            let dateTime = x.children[1].children[3].nextSibling.textContent;
                            return GetMonthFromString(dateTime.slice(3,6));
                        };
            GetDay =    function (x) 
                        {
                            let dateTime = x.children[1].children[3].nextSibling.textContent;
                            return dateTime.slice(0,2);
                        };

            GetISO8601Date = function(x)
                        {
                            let dateTime = x.children[1].children[3].nextSibling.textContent;
                            return GetYear(x) + "-" + GetMonth(x) + "-" + GetDay(x) + "T" + dateTime.slice(-12, -10) + ":" + dateTime.slice(-9, -7) + ":" + dateTime.slice(-6, -4) + ".000Z"
                        };

            GetSearch = function(){return null;};

            ShouldSkip = function(x)
                        {
                            if(x.firstChild.firstChild.innerText.length != 13 || x.children.length < 2 || x.children[1].children.length < 4)
                            {
                                return true;
                            }
            
                            let dateTime = x.children[1].children[3].nextSibling.textContent;
                            if(dateTime[0] == 'W')
                            {
                                return true;
                            }

                            // Create a common dateTime format, used to check for duplicates between HTML and JSON exports
                            let uniformDateTime = GetISO8601Date(x);
                            if(TimeStamps.has(uniformDateTime))
                            {
                                return true;
                            }
                            else
                            {
                                TimeStamps.set(uniformDateTime, 1);
                            }

                            return false;
                        }
                        
            break;

        case "JSON":
            Enumerate = function(DataFile) 
                        {
                            return DataFile;
                        }
            GetYear =   function (x) 
                        {
                            return x.time.substr(0, 4);
                        };
            GetArtist = function (x) 
                        {
                            if(x['subtitles'] == null)
                            {
                                return null;
                            }

                            return x['subtitles'][0]['name'].split(" - ")[0];
                        };
            GetSong =   function (x) 
                        {
                            return x['title'].split("Watched ")[1];;
                        };
            GetMonth =  function (x) 
                        {
                            return Number(x.time.substr(5, 2)) - 1;
                        };
            GetDay =    function (x) 
                        {
                            return x.time.slice(0,3);
                        };
            GetISO8601Date = function(x)
                        {
                            // HTML data doesn't have MS precision so we remove it from this data
                            return x.time.substr(0, 19) + ".000Z";
                        };
            GetSearch = function (x)
                        {
                            if (x['title'][0] != 'S')
                            {
                                return null;   
                            }

                            return x['title'].split("Searched for ")[1];
                        }

            ShouldSkip = function(x)
                        {
                            if (x.header != 'YouTube Music')
                            {
                                return true;
                            }

                            // Create a common dateTime format, used to check for duplicates between HTML and JSON exports
                            let uniformDateTime = GetISO8601Date(x);
                            if(TimeStamps.has(uniformDateTime))
                            {
                                return true;
                            }
                            else
                            {
                                TimeStamps.set(uniformDateTime, 1);
                            }

                            return false;
                        }
            break;

        default:
            console.error("Inappropriate file type provided for parsing!")
            return;
    }



    // ReturningMap
    let ResultantMap = new Map();
    ResultantMap.set("years", new Map());

	// Totals
	let YearTotals = new Map();
	let Artists = new Map();
	let Songs = new Map();
    let Searches = new Map();
    
    for(let DataFile of GenericDataSets)
    {
        for(let x of Enumerate(DataFile))
        {
            if(ShouldSkip(x))
            {
                continue;
            }

            let year = GetYear(x);

            if(!ResultantMap.get("years").has(year))
            {
                ResultantMap.set("years", AddNewYear(ResultantMap.get("years"), year));
                
                YearTotals.set(year, 0);
            }


            
            let Search = GetSearch(x);

            if(Search != null)
            {
                ResultantMap.get("years").get(year).set("searches", AddOrSet(ResultantMap.get("years").get(year).get("searches"), Search));
                Searches = AddOrSet(Searches, Search);
                continue;
            }

            let month = Search == null ? GetMonth(x) : null;
            let Song = GetSong(x);
            let Artist = GetArtist(x);

            if(month != null)
            {
                ResultantMap.get("years").get(year).get("months")[month]++;
            }
            

            ResultantMap.get("years").get(year).set("songs", AddOrSet(ResultantMap.get("years").get(year).get("songs"), Song));

            if(Artist != null)
            {
                ResultantMap.get("years").get(year).set("artists", AddOrSet(ResultantMap.get("years").get(year).get("artists"), Artist));
                Artists = AddOrSet(Artists, Artist);
            }



            YearTotals.set(year, YearTotals.get(year) + 1);
            Songs = AddOrSet(Songs, Song);
        }
    }
    
    ResultantMap.set("yearTotals", YearTotals);
    ResultantMap.set("artists", Artists);
    ResultantMap.set("songs", Songs);

    if(Searches != null && Searches.size > 0)
    {
        ResultantMap.set("searches", Searches);
    }


    return ResultantMap;
}

function GetMonthFromString(String)
{
    switch(String)
    {
        case "Jan":
            return 0;

        case "Feb":
            return 1;

        case "Mar":
            return 2;

        case "Apr":
            return 3;

        case "May":
            return 4;

        case "Jun":
            return 5;

        case "Jul":
            return 6;

        case "Aug":
            return 7;

        case "Sep":
            return 8;

        case "Oct":
            return 9;

        case "Nov":
            return 10;

        case "Dec":
            return 11;

        default:
            return -1;
    }
}

export function UnionOfMaps(MapOne, MapTwo)
{
	const Maps = [MapOne, MapTwo];

	const MapOneYears = [...MapOne.get("years").keys()];
	const MapTwoYears = [...MapTwo.get("years").keys()];

	// Aggregate the two arrays and remove duplicates
	const TotalYears = [...new Set(MapOneYears.concat(MapTwoYears))];

	// Set up the UnionMap that will be returned
	let MapUnion = new Map();
	MapUnion.set("years", new Map());
    MapUnion.set("yearTotals", new Map());
    MapUnion.set("artists", new Map());
    MapUnion.set("songs", new Map());
    MapUnion.set("searches", new Map());

	for(let j = 0; j < TotalYears.length; j++)
	{
		let year = TotalYears[j];

		MapUnion.get("yearTotals").set(year, 0);

		MapUnion.get("years").set(year, new Map());
		MapUnion.get("years").get(year).set("artists", new Map());
		MapUnion.get("years").get(year).set("songs", new Map());
		MapUnion.get("years").get(year).set("searches", new Map());
		MapUnion.get("years").get(year).set("months", new Array(12));

		for(let i = 0; i < 12; i++)
		{
			MapUnion.get("years").get(year).get("months")[i] = 0;
		}
	}


	// Combine both Maps
	for(let i = 0; i < Maps.length; i++)
	{
		for(let j = 0; j < TotalYears.length; j++)
		{
			if(!Maps[i].get("years").has(TotalYears[j]))
			{
				continue;
			}
			
			// Artists
			let ArtistKeys = [...Maps[i].get("years").get(TotalYears[j]).get("artists").keys()];
			let ArtistValues = [...Maps[i].get("years").get(TotalYears[j]).get("artists").values()];
			for(let k = 0; k < ArtistKeys.length; k++)
			{
				MapUnion.get("years").get(TotalYears[j]).set("artists", AddOrSet(MapUnion.get("years").get(TotalYears[j]).get("artists"), ArtistKeys[k], ArtistValues[k]));
                MapUnion.set("artists", AddOrSet(MapUnion.get("artists"), ArtistKeys[k], ArtistValues[k]));
			}

			// Songs
			let SongKeys = [...Maps[i].get("years").get(TotalYears[j]).get("songs").keys()];
			let SongValues = [...Maps[i].get("years").get(TotalYears[j]).get("songs").values()];
			for(let k = 0; k < SongKeys.length; k++)
			{
				MapUnion.get("years").get(TotalYears[j]).set("songs", AddOrSet(MapUnion.get("years").get(TotalYears[j]).get("songs"), SongKeys[k], SongValues[k]));
                MapUnion.set("songs", AddOrSet(MapUnion.get("songs"), SongKeys[k], SongValues[k]));

                MapUnion.set("yearTotals", AddOrSet(MapUnion.get("yearTotals"), TotalYears[j]));
			}

			// Searches
			let SearchKeys = [...Maps[i].get("years").get(TotalYears[j]).get("searches").keys()];
			let SearchValues = [...Maps[i].get("years").get(TotalYears[j]).get("searches").values()];
			for(let k = 0; k < SearchKeys.length; k++)
			{
				MapUnion.get("years").get(TotalYears[j]).set("searches", AddOrSet(MapUnion.get("years").get(TotalYears[j]).get("searches"), SearchKeys[k], SearchValues[k]));
                MapUnion.set("searches", AddOrSet(MapUnion.get("searches"), SearchKeys[k], SearchValues[k]));
			}

			// Months
			for(let k = 0; k < 12; k++)
			{
				MapUnion.get("years").get(TotalYears[j]).get("months")[k] += Maps[i].get("years").get(TotalYears[j]).get("months")[k];
			}
		}
	}

    return MapUnion;
}

function AddOrSet(MapToAlter, Key, Value = 1)
{
	if(MapToAlter.has(Key))
	{
		MapToAlter.set(Key, MapToAlter.get(Key) + Value);
	}
	else
	{
		MapToAlter.set(Key, Value);
	}

	return MapToAlter;
}
