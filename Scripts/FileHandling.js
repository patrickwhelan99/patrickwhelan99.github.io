import {unzip} from 'https://unpkg.com/unzipit@0.1.9/dist/unzipit.module.js';
import * as Graph from "./Graph.js";

export var JSONDataSets = new Array(0);
export var HTMLDataSets = new Array(0);

export async function ProcessFiles(e)
{
    var promises = [];

    try
    {
        for(let i = 0; i < e.target.files.length; i++)
        {
            var file = e.target.files[i];
            if(file.name.endsWith(".zip"))
            {
                promises.push(ReadZippedFile(file));
            }
            else if(file.name.endsWith(".json"))
            {
                promises.push(ReadNonZippedFile(file));
            }
            else if(file.name.endsWith(".html"))
            {
                promises.push(ReadHTML(file));
            }
        }  
    }
    catch(err)
    {
        console.log(err);
    }

    Promise.allSettled(promises).finally(() => {Graph.AfterLastFileReadIn(JSONDataSets, HTMLDataSets)});
}

async function ReadZippedFile(file, i) 
{
    var promises = [];

    try
    {
        const {entries} = await unzip(file);
        Object.entries(entries).forEach(
        ([name, entry]) => 
        {
            if (name.endsWith('.json')) 
            {
                promises.push(AddJSONToList(entry));
            }
            else if (name.endsWith('.html'))
            {
                promises.push(ReadZippedHTMLEntry(entry));
            }
        });

        await Promise.allSettled(promises);
        return Promise.resolve(JSONDataSets);
    }
    catch(e){console.log(e);}
}

function ReadNonZippedFile(file)
{
    return new Promise((resolve, reject) => 
    {
        var fr = new FileReader();  
        fr.onload = () => 
        {
            JSONDataSets.push(JSON.parse(fr.result));
            resolve(fr.result);
        };

        fr.onerror = reject;
        fr.readAsText(file);
    });
}

async function AddJSONToList(Entry)
{
    var data = await Entry.json();
    JSONDataSets.push(data);

    return;
}

async function ReadZippedHTMLEntry(Entry)
{
    const text  = await Entry.text();

    var el = document.createElement( 'html' );
    el.innerHTML = text;

    HTMLDataSets.push(el);    
}

function ReadHTML(File)
{
    return new Promise((resolve, reject) => 
    {
        var fr = new FileReader();  
        fr.onload = () => 
        {
            var el = document.createElement( 'html' );
            el.innerHTML = fr.result;

            HTMLDataSets.push(el);

            resolve(el);
        };
        fr.readAsText(File);    
    });

    
}
