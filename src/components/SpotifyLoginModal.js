import React, { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from "axios";
import { useLocation, useNavigate } from "wouter";
import Home from "../Home";

const spotifyApi = new SpotifyWebApi();

const SpotifyLoginModal = () => {
  const [user, setUser] = useState(null);
  const[loading,setLoading]=useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false);



  // Load access token and refresh token from localStorage
  const accessToken = localStorage.getItem("spotifyAccessToken");
  const refreshToken = localStorage.getItem("spotifyRefreshToken");

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
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

  
  async function getRecentlyPlayedSongs(numSongsToFetch, numSongsToInclude) {
    spotifyApi.setAccessToken(accessToken);
  
    const recentlyPlayedSongs = [];
    const addedSongs = new Set(); // To keep track of added songs
  
    while (recentlyPlayedSongs.length < numSongsToFetch) {
      // Step 1: Get the user's recently played tracks
      const recentlyPlayedResponse = await spotifyApi.getMyRecentlyPlayedTracks({
        limit: Math.min(numSongsToFetch - recentlyPlayedSongs.length, 50), // Limit the number of tracks to retrieve
      });
      const playlistsResponse = await spotifyApi.getUserPlaylists();
      const recentlyPlayedTracks = recentlyPlayedResponse.items;
      const playlists = playlistsResponse.items;
      const playlistInfoArray = [];
  for (const playlist of playlists) {
    const { id, name } = playlist;
    playlistInfoArray.push({ id, name });
  }
  console.log(playlistInfoArray)
  localStorage.setItem("playlistInfo", JSON.stringify(playlistInfoArray));
  
      for (const item of recentlyPlayedTracks) {
        const track = item.track;
        const songName = track.name;
        const artists = track.artists.map((artist) => artist.name).join(", ");
  
        // Assuming you have a function to get lyrics for a song
        const lyrics = await getLyrics(songName, artists);
  
        // Check if the song has already been added and has lyrics
        const songKey = songName + artists;
        if (lyrics && !addedSongs.has(songKey)) {
          recentlyPlayedSongs.push({
            name: songName,
            artists: artists,
            lyrics: lyrics,
          });
          addedSongs.add(songKey); // Add the song to the set to mark it as added
        }
  
        // Check if we have reached the desired number of songs to include
        if (recentlyPlayedSongs.length >= numSongsToInclude) {
          return recentlyPlayedSongs.slice(0, numSongsToInclude); // Return the desired number of songs
        }
      }
    }
  
    return recentlyPlayedSongs; // Return all collected songs if numSongsToFetch is reached
  }
  


  const checkUserLoggedIn = async () => {
    try {
  
      
      if (accessToken) {
        // Set the access token for API requests
        spotifyApi.setAccessToken(accessToken);
        const response = await spotifyApi.getMe();
       console.log(response)
        // Use the access token to get user data
        localStorage.setItem("User", JSON.stringify(response));
       
        setUser(response);

  

    // Step 2: Generate random lyrics and artist data
   

    
      } else {
        const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
  
    if(code){
      const { access_token, refresh_token } = await requestTokens();
      localStorage.setItem("spotifyAccessToken", access_token);
      localStorage.setItem("spotifyRefreshToken", refresh_token);
      
    }
    
        console.log(code)
        // User is not logged in, handle accordingly
        setIsDialogOpen(true);
      }
    } catch (error) {
     
      if (error.status === 401 && refreshToken) {
        
        // Handle token expiration by refreshing the access token
        try {
          const response = await refreshAccessToken(refreshToken);
          spotifyApi.setAccessToken(response.access_token);
          localStorage.setItem("spotifyAccessToken", response.access_token);
          localStorage.setItem("spotifyRefreshToken", refreshToken);
          const userResponse = await spotifyApi.getMe();
          setUser(userResponse);
        } catch (refreshError) {
          // Handle token refresh failure, e.g., by prompting the user to log in again.
          setIsDialogOpen(true);
        }
      } else {
        // Handle other errors as needed.
        setIsDialogOpen(true);
      }
    }
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

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
  const requestTokens = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const clientId = "74a1f6c1bc054487a111c1773cebd2e7"; // Replace with your Spotify client ID
    const clientSecret = "01695a240399436e9f2f9f71f5db22fb"; // Replace with your Spotify client secret
    const redirectUri = "http://localhost:3000/"; // Replace with your Spotify redirect URI
    const tokenUrl = "https://accounts.spotify.com/api/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
    });
 console.log(response)
    if (!response.ok) {
      throw new Error("Failed to obtain access and refresh tokens");
    }

    return response.json();
  };
  const [location, navigate] = useLocation();

  const handleLogin = async () => {
    const redirectUri = "http://localhost:3000/"; // Replace with your Spotify redirect URI
    const scopes = ["user-read-recently-played", "user-library-read", "user-read-private", "user-read-email"];
    const loginUrl = `https://accounts.spotify.com/authorize?client_id=74a1f6c1bc054487a111c1773cebd2e7&redirect_uri=${redirectUri}&scope=${scopes.join(
      "%20"
    )}&response_type=code`;
  


    window.location.href = loginUrl;
  };
  const handleFetchRandomSongs = async () => {
    setLoading(true)
    let randomSongsData = [];
    const numRecentlyPlayedSongs = 10;

    // Loop until randomSongsData has a length greater than 0
    while (randomSongsData.length != 10) {
      console.log("trying")
      try {
        randomSongsData = await getRecentlyPlayedSongs(25,10)

        if (randomSongsData.length > 0) {
       
      
         
          localStorage.setItem("songs", JSON.stringify(randomSongsData));

        
          navigate("/Home");
        } else {
          // If randomSongsData is empty, retry the fetch
          console.log("Retrying fetch...");
        }
      } catch (error) {
        console.error("Error fetching random songs:", error);
      }
    }
  };

  return (
    <div>
      {!user && (
        <Dialog
          open={isDialogOpen}
          
          aria-labelledby="spotify-login-title"
          aria-describedby="spotify-login-description"
        >
          <DialogTitle id="spotify-login-title">Login to Spotify</DialogTitle>
          <DialogContent>
            <DialogContentText id="spotify-login-description">
              Click the button below to log in with your Spotify account and grant access to your top songs and library.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLogin} color="primary">
              Log in with Spotify
            </Button>
          </DialogActions>
        </Dialog>
      )}

         {user && (
          <div className="landingPage">
        {loading?<img src="https://s11.gifyu.com/images/S4CQB.gif" className="loading" alt=""></img>:<div className="startBtn" onClick={handleFetchRandomSongs}>START</div>}</div>
      )}
    </div>
  );
};

export default SpotifyLoginModal;
