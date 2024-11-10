const express = require("express");
const cors = require("cors");
const { track } = require("./models/track.model");
const { user } = require("./models/user.model");
const { like } = require("./models/like.model");
let { Op } = require("@sequelize/core");
const { sequelize } = require("./lib");
const app = express();

app.use(express.json());
app.use(cors());

// Sample data for seeding the 'track' table
let movieData = [
    {
      name: 'Raabta',
      genre: 'Romantic',
      release_year: 2012,
      artist: 'Arijit Singh',
      album: 'Agent Vinod',
      duration: 4,
    },
    {
      name: 'Naina Da Kya Kasoor',
      genre: 'Pop',
      release_year: 2018,
      artist: 'Amit Trivedi',
      album: 'Andhadhun',
      duration: 3,
    },
    {
      name: 'Ghoomar',
      genre: 'Traditional',
      release_year: 2018,
      artist: 'Shreya Ghoshal',
      album: 'Padmaavat',
      duration: 3,
    },
    {
      name: 'Bekhayali',
      genre: 'Rock',
      release_year: 2019,
      artist: 'Sachet Tandon',
      album: 'Kabir Singh',
      duration: 6,
    },
    {
      name: 'Hawa Banke',
      genre: 'Romantic',
      release_year: 2019,
      artist: 'Darshan Raval',
      album: 'Hawa Banke (Single)',
      duration: 3,
    },
    {
      name: 'Ghungroo',
      genre: 'Dance',
      release_year: 2019,
      artist: 'Arijit Singh',
      album: 'War',
      duration: 5,
    },
    {
      name: 'Makhna',
      genre: 'Hip-Hop',
      release_year: 2019,
      artist: 'Tanishk Bagchi',
      album: 'Drive',
      duration: 3,
    },
    {
      name: 'Tera Ban Jaunga',
      genre: 'Romantic',
      release_year: 2019,
      artist: 'Tulsi Kumar',
      album: 'Kabir Singh',
      duration: 3,
    },
    {
      name: 'First Class',
      genre: 'Dance',
      release_year: 2019,
      artist: 'Arijit Singh',
      album: 'Kalank',
      duration: 4,
    },
    {
      name: 'Kalank Title Track',
      genre: 'Romantic',
      release_year: 2019,
      artist: 'Arijit Singh',
      album: 'Kalank',
      duration: 5,
    },
];

// Defining a route to seed the database
app.get("/seed_db", async (req, res) => {
  try {
    // Force sync the database, dropping existing tables if any
    await sequelize.sync({ force: true });
    // Seed the 'track' table with movie data
    await track.bulkCreate(movieData);
    // Seed a test user into the 'user' table
    await user.create({
      username: "testuser",
      email: "testuser@gmail.com",
      password: "testuser"
    });

    return res.status(200).json({ message: "Database seeding successful." });
  } catch (error) {
    return res.status(500).json({ message: "Error seeding the database", error: error.message });
  }
});

// function to like a track
async function likeTrack(data){
    let newLike = await like.create({
     userId: data.userId,
     trackId: data.trackId, 
    });

    return { message: "Track Liked", newLike };
}
    
// Endpoint to like a track
app.get("/users/:id/like", async (req, res) => {
 try{
    let userId = parseInt(req.params.id);
    let trackId = parseInt(req.query.trackId);
    let response = await likeTrack({userId, trackId});
 
    return res.status(200).json(response);
 } catch(error){
   return res.status(500).json({ message: "Error liking the track", error: error.message }); 
 }
});

// function to dislike a track
async function dislikeTrack(data){
  let count = await like.destroy({ where: { 
    userId: data.userId,
    trackId: data.trackId
   }});  
   
   if(count === 0){
    return {};
   }

   return { message: "Track disliked." };
};

// Endpoint to dislike a track
app.get("/users/:id/dislike", async (req, res) => {
  try{
    let userId = parseInt(req.params.id);
    let trackId = req.query.trackId;
    let response = await dislikeTrack({ userId, trackId });
    
    if(!response.message){
        return res.status(404).json({ message: "This track is not in your liked list." });
    }

    return res.status(200).json(response);
  } catch(error){
    return res.status(500).json({ message: "Error disliking the track", error: error.message });
  }
});

// function to get all liked tracks
async function getLikedTracks(userId){
 let trackIds = await like.findAll({
   where: {userId},
   attributes: ["trackId"],
 });

 let trackRecords = [];

 for(let i=0; i<trackIds.length; i++){
    trackRecords.push(trackIds[i].trackId);
 }

 let likedTracks = await track.findAll({
   where: { id: { [Op.in]: trackRecords } }
 });

 return { likedTracks };
}

// Endpoint to get all liked tracks
app.get("/users/:id/liked", async (req, res) => {
 try{
    let userId = parseInt(req.params.id);
    let response = await getLikedTracks(userId);
     
    if(response.likedTracks.length === 0){
        return res.status(404).json({ message: "No liked tracks found." });
    }

    return res.status(200).json(response);
 } catch(error){
    return res.status(500).json({ message: "Error fetching all liked tracks.", error: error.message });
 }
});

// function to get all liked tracks by Artist
async function getLikedTracksByArtist(userId, artist){
  let trackIds = await like.findAll({
   where: { userId },
   attributes: ["trackId"],
  });

  let trackRecords = [];

  for(let i=0; i<trackIds.length; i++){
    trackRecords.push(trackIds[i].trackId);
  }

  let likedTracks = await track.findAll({
    where: { id: { [Op.in]: trackRecords }, artist }
  });
  
  return { likedTracks };
};

// Endpoint to get all liked tracks by Artist
app.get("/users/:id/liked-artist", async (req, res) => {
  try{
    let userId = parseInt(req.params.id);
    let artist = req.query.artist;
    let response = await getLikedTracksByArtist(userId, artist);
     
    if(response.likedTracks.length === 0){
       return res.status(404).json({ message: "No liked tracks found by " + artist }); 
    }

    return res.status(200).json(response);
  } catch(error){
    return res.status(500).json({ message: "Error fetching liked tracks by Artist.", error: error.message });
  }
});

// Starting the server on port 3000
app.listen(3000, () => {
  console.log("Server is running on Port: 3000");
});
