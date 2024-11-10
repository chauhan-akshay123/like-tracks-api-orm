let { DataTypes, sequelize } = require("../lib/");

let track = sequelize.define("track", {
 name: DataTypes.STRING,
 genre: DataTypes.TEXT,
 release_year: DataTypes.INTEGER,
 artist: DataTypes.TEXT,
 album: DataTypes.TEXT,
 duration: DataTypes.INTEGER
});

module.exports = {
    track,
};