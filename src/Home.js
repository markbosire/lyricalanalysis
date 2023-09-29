import { useEffect, useState, useRef } from "react";
import { Select, MenuItem, FormControl,InputLabel } from '@mui/material';
import axios from "axios";



import SpotifyWebApi from "spotify-web-api-js";
import Sentiment from 'sentiment';


import "./app.css";
import { navigate } from "wouter/use-location";






export default function Home() {
  const spotifyApi = new SpotifyWebApi();
  const[loading,setLoading]=useState(true)
  const accessToken = localStorage.getItem("spotifyAccessToken");
  const refreshToken = localStorage.getItem("spotifyRefreshToken");
  const [selectedItem, setSelectedItem] = useState({id:1,name:"Select playlist"});
  const handleSelectChange = async (event) => {
    setLoading(true)
    
    let value= event.target.value;
    console.log(value.id)
    setSelectedItem(value)
   
  };
  const renderEmotionScale = (result) => {
    if (result) {
        if (result > 0) {
            return <div>😊 Positive</div>;
        } else if (result < 0) {
            return <div>😞 Negative</div>;
        } else {
            return <div>😐 Neutral</div>;
        }
    }
    return null;
};
function playlistImg(list){
  console.log(list)
  let url="https://cdn.dribbble.com/users/1752437/screenshots/14183305/ep_4x.png"
  if(list.length>0){
    const images=list.images
    console.log(images)
  if(images.length>0){
    
   url = images[0].url
  }else{
    url="https://cdn.dribbble.com/users/1752437/screenshots/14183305/ep_4x.png"
  }
  }
  
}
 
  const[songs,setSongs]=useState(JSON.parse(localStorage.getItem("songs")));
  const[playlistInfo,setPlaylistInfo]=useState(JSON.parse(localStorage.getItem("playlistInfo")));
  const [playlist, setPlaylist] = useState([]);
  
  const[analysis,setAnalysis]=useState(null)
  const[negativeLength,setNegativelength]=useState([])
  const[positiveLength,setPositivelength]=useState([])
  const[negativeLengthPL,setNegativelengthPL]=useState([])
  const[positiveLengthPL,setPositivelengthPL]=useState([])
  const[analysisresult,setAnalysisResult]=useState(0)
  const[analysisresultPL,setAnalysisResultPL]=useState(0)
  const sentiment = new Sentiment();
  console.log(playlistInfo)
  function getRandomSongs(data, numberOfSongs) {
    // Shuffle the data array randomly
    const shuffledData = [...data].sort(() => Math.random() - 0.5);
  
    // Take the first `numberOfSongs` items from the shuffled array
    const selectedSongs = shuffledData.slice(0, numberOfSongs);
  
    // Create an object with an array of song names and artist names
    const result = {
      songs: selectedSongs.map((song) => ({
        name: song.track.name,
        artists: song.track.artists.map((artist) => artist.name).join(', '),
      })),
    };
  
    return result;
  }
  async function getLyrics(songName, artist) {
    try {
      // Replace 'YOUR_MUSIXMATCH_API_KEY' with your Musixmatch API key
      const apiKey = "418389875d3bafbe34f510b649ca9091";
      
      // Make a request to Musixmatch API to get lyrics
      const response = await axios.get(
        `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?format=jsonp&callback=callback&q_track=${encodeURIComponent(
          songName
        )}&q_artist=${encodeURIComponent(artist)}&apikey=${apiKey}`
      );
      const dataString = response.data;
      const jsonData = JSON.parse(dataString.match(/callback\((.*)\)/)[1]); // Extract the JSON object within 'callback(...)'
     
        const lyrics = jsonData.message.body.lyrics.lyrics_body;
        const randomStringPattern = "(1409623804491)";


       
   
      
       
      
      // Split lyrics into lines
      const lines = lyrics.split(/\n/g);
      
      const filteredLines = lines.filter(
        (line) => line.trim() !== "..." && !line.includes("This Lyrics is NOT for Commercial use")
      );
       const filteredLines2 = filteredLines.filter(
        (line) => line.replace(randomStringPattern, '')
      );
  
      if (filteredLines2.length === 0) {
        console.error("No usable lyrics found.");
        return null;
      }
   
      return filteredLines2;
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      return null;
    }
  }
  useEffect(()=>{
    const getPlaylistData = async () => {
      spotifyApi.setAccessToken(accessToken);
    
      try {
        
        const response = await spotifyApi.getPlaylist(selectedItem.id);
        setPlaylist(response);
        const playlistSongs= response.tracks.items;
        const number = playlistSongs.length>20?20:playlistSongs.length
        const selectedSongsObject = getRandomSongs(playlistSongs, number).songs;
        const songsWithLyrics=[]
        for (const item of selectedSongsObject) {
         
          const songName = item.name;
          const artists = item.artists;
    
          // Assuming you have a function to get lyrics for a song
          const lyrics = await getLyrics(songName, artists);
    
          // Check if the song has already been added and has lyrics
          
          if (lyrics) {
            songsWithLyrics.push({
              name: songName,
              artists: artists,
              lyrics: lyrics,
            });
            
          }
    
          // Check if we have reached the desired number of songs to include
          
        }
        const result=SentimentDataPL(songsWithLyrics)
 
  if(result){
    sentimentScorePL(result)
  }
        setLoading(false)
      } catch (error) {
        
        if (error.status === 401 && refreshToken) {
          
          // Handle token expiration by refreshing the access token
          try {
            const response = await refreshAccessToken(refreshToken);
            spotifyApi.setAccessToken(response.access_token);
            localStorage.setItem("spotifyAccessToken", response.access_token);
            localStorage.setItem("spotifyRefreshToken", refreshToken);
           
          } catch (refreshError) {
            // Handle token refresh failure, e.g., by prompting the user to log in again.
            navigate("/")
          }
        }
      }

    };

    if(selectedItem){
      
      getPlaylistData()
    }

  },[selectedItem])
  
useEffect(()=>{
const result=SentimentData(songs)
 
  if(result){
    sentimentScore(result)
  }
 
 
  
},[])

function SentimentData(songsData) {
  const analysisResults = [];
  let lyricsText = ""
  let resultData=[]
   for (let i = 0; i < songsData.length; i++) {
     const song = songsData[i];
      lyricsText = lyricsText + song.lyrics.join(' ');
      console.log(lyricsText) 
     const result = sentiment.analyze(lyricsText) 
  
 
  
   const resultneg = result.negative
   const resultpos = result.positive
   setNegativelength(resultneg.length)
   setPositivelength(resultpos.length)
   console.log(result)
 
  
 
 resultData=result
   }
  return resultData;
}
function SentimentDataPL(songsData) {
  const analysisResults = [];
  let lyricsText = ""
  let resultData=[]
   for (let i = 0; i < songsData.length; i++) {
     const song = songsData[i];
      lyricsText = lyricsText + song.lyrics.join(' ');
      console.log(lyricsText) 
     const result = sentiment.analyze(lyricsText) 
  
 
  
   const resultneg = result.negative
   const resultpos = result.positive
   setNegativelengthPL(resultneg.length)
   setPositivelengthPL(resultpos.length)
   console.log(result)
 
  
 
 resultData=result
   }
  return resultData;
}

function sentimentScore(result){

    const score = result.score;
    const calculationArray = result.calculation
   
    const calcLength = calculationArray.length
    const math = score/calcLength
  setAnalysisResult(math)
  console.log(math)
    
  return math
}
function sentimentScorePL(result){

  const score = result.score;
  const calculationArray = result.calculation
 
  const calcLength = calculationArray.length
  const math = score/calcLength
setAnalysisResultPL(math)
console.log(math)
  
return math
}
const refreshAccessToken = async (refreshToken) => {
  const clientId = "74a1f6c1bc054487a111c1773cebd2e7"; // Replace with your Spotify client ID
  const clientSecret = "01695a240399436e9f2f9f71f5db22fb"; // Replace with your Spotify client secret
  const refreshUrl = "https://accounts.spotify.com/api/token";

  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  return response.json();
};


console.log(songs)
   const user = JSON.parse(localStorage.getItem("User"));
   const imageArray=user.images
   let imageUrl;
   function images(){
    if(imageArray.length>0){
      imageUrl= imageArray[1].url
    }else{
      let url ="https://ionicframework.com/docs/img/demos/avatar.svg"
    imageUrl=url
    }
   }
   images();
   console.log(imageUrl)
  

useEffect(()=>{

},[])
 


  return (
    <div className="App ">
      
      <header>
     
        <img src={imageUrl} className="avatar"></img>
        <h3>Hi {user.display_name}</h3>
         {analysisresult!=null?<p>Your 10 recent songs scored a {(analysisresult<0?analysisresult*-1:analysisresult).toFixed(2)}/5 {analysisresult<0?"in the negativity scale":"in the positivity scale"}</p>:<p>loading</p>}
     
      </header>
      <div >{
      
      <div>
      <h2 className="green">Your recent songs</h2>
      {analysisresult!=null?renderEmotionScale(analysisresult):<p>loading</p>}
      {negativeLength>0?<p><strong className="green">{negativeLength}</strong> negative words found </p>:<p>loading</p>}
      {positiveLength>0?<p><strong className="green">{positiveLength}</strong> positive words found </p>:<p>loading</p>}
    </div>}
      </div>
      <div className="playlistContainer">
      <FormControl className="form" variant="outlined" fullWidth>
      <InputLabel id="select-label">Select Playlist</InputLabel>
        <Select
          labelId="select-label"
          id="select"
          value={selectedItem}
          onChange={handleSelectChange}
          label="Select Playlist"
        >
          {playlistInfo.length>0?playlistInfo.map((item) => (
            <MenuItem key={item.id} value={item}>
              {item.name}
            </MenuItem>
          )):<MenuItem key="s" value="select">
          Select Playlist
        </MenuItem>}
        </Select>
      </FormControl>
      {loading ?
        <div></div>:<div>
      <p><strong className="green">Playlist Name:</strong> {playlist.name}</p><br></br>
      <img className="proImg" src={playlist.images.length>0?playlist.images[0].url:"https://cdn.dribbble.com/users/1752437/screenshots/14183305/ep_4x.png"} alt={playlist.name} />
    </div>}
    {!loading?<div className="centering"><p>{renderEmotionScale(analysisresultPL)}</p>
      <p>This playlist is a {(analysisresultPL<0?analysisresultPL*-1:analysisresultPL).toFixed(2)}/5 {analysisresultPL<0?" in the negativity scale":" in the positivity scale"}</p>
    
     <p><strong className="green">{negativeLengthPL}</strong> negative words found </p>
         <p><strong className="green">{positiveLengthPL}</strong> positive words found </p></div>
  
    :<div className="centering"><img src="https://s6.gifyu.com/images/S4JZ9.gif" className="loading" alt=""></img></div>}
      </div>
    
    </div>
  );
}
