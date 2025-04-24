import React, { useEffect, useState, useRef } from 'react';
import Typed from 'typed.js';
import img from '../Assets/gallery.jpg';


const App = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [information, setInformation] = useState('');
  const [voices, setVoices] = useState([]);
  const typedRef = useRef(null);
  const typedInstanceRef = useRef(null);
  const recognitionRef = useRef(null);

  const openaiApiKey = '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'; // Replace with your OpenAI key

  // Load voices

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) setVoices(allVoices);
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }, []);

  // Auto greeting after voices loaded
  useEffect(() => {
    if (voices.length > 0) {
      const greeting = getGreeting();
      speakText(greeting);
      setInformation(greeting);
    }
  }, [voices]);

  // Typed animation
  useEffect(() => {
    if (typedRef.current && !transcript) {
      typedInstanceRef.current = new Typed(typedRef.current, {
        strings: ['How can I help you today?'],
        typeSpeed: 50,
        backSpeed: 25,
        loop: true,
        showCursor: true,
      });
    }

    return () => {
      if (typedInstanceRef.current) {
        typedInstanceRef.current.destroy();
      }
    };
  }, [transcript]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript.toLowerCase();
      setTranscript(spokenText);
      handleVoiceCommand(spokenText);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
    setIsListening(true);
  };

  // ✅ Improved speakText with voice fix
  const speakText = (text) => {
    const speak = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) {
        setTimeout(() => speakText(text), 300);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = allVoices.find((v) => v.lang === 'en-US') || allVoices[0];
      utterance.voice = selectedVoice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Sir';
    if (hour < 18) return 'Good afternoon, Sir';
    return 'Good evening, Sir';
  };
  const askGPT = async (prompt) => {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const reply = data.choices[0]?.message?.content?.trim();
      if (reply) {
        speakText(reply);
        setInformation(reply);
      } else {
        speakText("I couldn't generate a response.");
      }
    } catch (error) {
      console.error("GPT Error:", error);
      speakText("Something went wrong while contacting AI.");
    }
  };

  // 🍳 Recipe Suggestion
  const suggestRecipe = async (ingredients) => {
    const prompt = `Suggest a simple recipe using these ingredients: ${ingredients}`;
    await askGPT(prompt);
  };

  // 🎵 Mood-Based Song Suggestion
  const suggestSongByMood = async (mood) => {
    const prompt = `Suggest a popular English song that fits the ${mood} mood. Just give the name and artist.`;
    await askGPT(prompt);
  };

  const getCurrentLocation = () => {
    // Check if the browser supports Geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  
          // Now, use the coordinates to reverse geocode (get the address)
          reverseGeocode(latitude, longitude); // Call your reverse geocoding function
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location. Please allow location access.");
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      alert("Geolocation is not supported by your browser.");
    }
  };
  
  

  const getCoordinatesofcity = async (city) => {
    const apiKey = '2db885aabcbb42a58b1da8ffd070e44c'; // Your OpenCage API Key
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        return { latitude: lat, longitude: lng };
      }
      return null;
    } catch (err) {
      console.error('Error getting coordinates:', err);
      return null;
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    const apiKey = '2db885aabcbb42a58b1da8ffd070e44c'; // Your OpenCage API Key
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      return 'Unable to find address for this location';
    } catch (err) {
      console.error('Error with OpenCage API:', err);
      return 'Error fetching address';
    }
  };

  const getCoordinates = async (city) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0];
        return { latitude, longitude };
      }
      return null;
    } catch (err) {
      console.error('Error getting coordinates:', err);
      return null;
    }
  };

  const getWeather = async (latitude, longitude) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.current) {
        const { temperature_2m, wind_speed_10m } = data.current;
        return {
          temperature: temperature_2m,
          windSpeed: wind_speed_10m,
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching weather:', err);
      return null;
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWeatherByCurrentLocation = () => {
    if (!navigator.geolocation) {
      speakText('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const weather = await getWeather(latitude, longitude);
        if (weather) {
          const msg = `At your current location, it's ${weather.temperature}°C with wind speed of ${weather.windSpeed} km/h.`;
          speakText(msg);
          setInformation(msg);
        } else {
          speakText('Sorry, I could not fetch the weather data.');
        }
      },
      () => {
        speakText('Unable to access your location.');
      }
    );
  };

  const fetchPersonData = async (person) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(person)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.title && data.extract) {
        return {
          name: data.title,
          extract: data.extract.split('.')[0],
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  };
  const getLatestNews = async () => {
    const apiKey = 'c67c63ec449a39ecab96f620fb361535';
    const url = `https://gnews.io/api/v4/top-headlines?lang=en&max=5&token=${apiKey}`;
  
    try {
      const res = await fetch(url);
      const data = await res.json();
  
      if (data.articles && data.articles.length > 0) {
        const headlines = data.articles.map((a, i) => `${i + 1}. ${a.title}`);
        const newsText = `Here are the top headlines: ${headlines.join(' ')}`;
        speakText(newsText);
        setInformation(newsText);
      } else {
        speakText('Sorry, I could not find any news at the moment.');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      speakText('There was a problem fetching the news.');
    }
  };
  

  const performGoogleSearch = (query) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
  };

  const handleVoiceCommand = async (command) => {
    if (command.includes('weather in')) {
      const cityMatch = command.match(/weather in (.+)/);
      const city = cityMatch ? cityMatch[1].trim() : null;

      if (!city) return speakText('Please specify a city.');
      const coords = await getCoordinates(city);
      if (!coords) return speakText(`Couldn't find the location for ${city}`);

      const weather = await getWeather(coords.latitude, coords.longitude);
      if (!weather) return speakText(`Couldn't get weather for ${city}`);

      const msg = `The current temperature in ${city} is ${weather.temperature}°C with wind speed of ${weather.windSpeed} km/h.`;
      speakText(msg);
      setInformation(msg);
      return;
    }
    if (command.includes('play') && command.includes('on spotify')) {
      const songMatch = command.match(/play (.+) on spotify/);
      if (songMatch && songMatch[1]) {
        const query = songMatch[1].trim();
        const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
        speakText(`Opening Spotify for ${query}`);
        window.open(spotifyUrl, '_blank');
        setInformation(`Searching Spotify for: ${query}`);
        return;
      }
    }
    if (command.startsWith("ask ai") || command.startsWith("chat with ai")) {
      const question = command.replace("ask ai", "").replace("chat with ai", "").trim();
      if (question.length > 0) {
        await askGPT(question);
      } else {
        speakText("Please say what you want to ask.");
      }
      return;
    }

    // 🍳 Recipe Suggestion
    if (command.includes("recipe with")) {
      const ingredients = command.split("recipe with")[1].trim();
      await suggestRecipe(ingredients);
      return;
    }

    // 🎵 Suggest Song by Mood
    if (command.includes("song for") || command.includes("suggest a song")) {
      const mood = command.split("for")[1]?.trim() || command.split("suggest a song")[1]?.trim();
      await suggestSongByMood(mood);
      return;
    }

    if (command.includes('workout playlist')) {
      const url = 'https://open.spotify.com/playlist/YOUR_PLAYLIST_ID';
      speakText("Opening your workout playlist on Spotify.");
      window.open(url, '_blank');
      setInformation("Opened workout playlist.");
      return;
    }


    if (command.includes('current weather')) {
      getWeatherByCurrentLocation();
      return;
    }

    if (command.startsWith('open ')) {
      const site = command.split('open ')[1].trim().replace(/\s+/g, '');
      const sitesMap = {
        youtube: 'https://www.youtube.com',
        facebook: 'https://www.facebook.com',
        google: 'https://www.google.com',
        twitter: 'https://www.twitter.com',
        instagram: 'https://www.instagram.com',
        reddit: 'https://www.reddit.com',
        github: 'https://www.github.com',
        stackoverflow: 'https://stackoverflow.com',
        linkedin: 'https://www.linkedin.com',
        amazon: 'https://www.amazon.com',
      };

      if (sitesMap[site]) {
        speakText(`Opening ${site}`);
        window.open(sitesMap[site], '_blank');
        setInformation(`Opened ${site}`);
      } else {
        speakText(`I don't know how to open ${site}`);
        setInformation(`Could not find the website for ${site}`);
      }
      return;
    }

    if (command.startsWith('play ') && command.includes('on spotify')) {
      const songMatch = command.match(/play (.+) on spotify/);
      if (songMatch && songMatch[1]) {
        const songName = songMatch[1].trim();
        const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(songName)}`;
        speakText(`Playing ${songName} on Spotify`);
        window.open(spotifyUrl, '_blank');
        setInformation(`Opening Spotify for: ${songName}`);
        return;
      }
    }
    if (command.includes('current location') || command.includes('where am i')) {
      getCurrentLocation();
      speakText(res);
      setInformation(res);
      return;
    }

    if (command.includes('what is your name')) {
      const res = "Hello Sir, I'm JARVIS, your voice assistant.";
      speakText(res);
      setInformation(res);
      return;
    }

    if (command.includes('hello jarvis')) {
      const res = 'Hello Sir, how can I help you today?';
      speakText(res);
      setInformation(res);
      return;
    }
    if (command.includes('who created you')) {
      const res = 'I am Made by Sohom Nandi';
      speakText(res);
      setInformation(res);
      return;
    }

    if (command.includes('what is your age')) {
      const res = "I'm just a few days old, still learning!";
      speakText(res);
      setInformation(res);
      return;
    }
    if (command.includes('read the news') || command.includes('latest news') || command.includes('what\'s happening')) {
      await getLatestNews();
      return;
    }

    if (command.includes('what is the time')) {
      const res = `The current time is ${getCurrentTime()}`;
      speakText(res);
      setInformation(res);
      return;
    }

    const famousPeople = [
      'Cristiano Ronaldo', 'LeBron James', 'Neymar Jr', 'Kylian Mbappé',
      'Luis Suarez', 'Robert Lewandowski', 'Mohamed Salah', 'Virgil van Dijk',
      'Angel Di Maria', 'bill gates', 'mark zuckerberg', 'elon musk',
      'steve jobs', 'warren buffet', 'barack obama', 'jeff bezos','shahrukh khan',
      'Lionel Messi', 'sundar pichai', 'mukesh ambani', 'virat kohli',
      'sachin tendulkar', 'brian lara',
    ];

    const person = famousPeople.find((p) => command.includes(p.toLowerCase()));
    if (person) {
      const data = await fetchPersonData(person);
      if (data) {
        const info = `${data.name}, ${data.extract}`;
        speakText(info);
        setInformation(info);
        performGoogleSearch(command);
      } else {
        speakText("I couldn't find detailed info.");
        performGoogleSearch(command);
      }
    } else {
      speakText(`Here's what I found for ${command}`);
      performGoogleSearch(command);
    }
  };

  return (
    <div className="voice-assistant">
      <img src={img} alt="AI" className="ai-image" />
      <h2>J.A.R.V.I.S</h2>

      <button className="btn" onClick={startListening} disabled={isListening}>
        <i className="fas fa-microphone"></i>
        {isListening ? 'Listening...' : 'Start Listening'}
      </button>

      <button className="btn" onClick={() => speakText('This is a test voice message.')}>
        Test Voice
      </button>

      <p className="transcript">
        {transcript ? transcript : <span ref={typedRef}></span>}
      </p>

      <p className="information">{information}</p>
    </div>
  );
};

export default App;
