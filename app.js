require("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//módulo lodash: library com ferramentas úteis para manipulação de strings (dentre outras)
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Default content: mantém-se na app para ser mais fácil de editar
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

//Connect to LOCAL MGDB:
mongoose.connect("mongodb://localhost:27017/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//SCHEMA e MODEL
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'error: post title not specified']
  },
  body : {
    type: String,
    required: [true, 'error: post body not specified']
  }
});


const Post = mongoose.model('Post', postSchema);


let weatherData = {
  city: "No city selected",
  temp: "-",
  dscpt: "-",
  icon: "-"
}

app.get("/", (req, res) => {
  Post.find(
    {},//filter: find ALL
    (err, foundPosts) => {
      if (!err) {
          res.render("home", {
            homeDescription: homeStartingContent,
            posts: foundPosts,
            weatherData: weatherData
          });
      }else {
        console.log(err);
      }
  });
});

app.post("/input", (req, res) => {
  //o nome da cidade é dado pelo cliente e este parametro segue na url da API
  //para o servidor externo (OpenWeatherMaps)
  const city = req.body.cityName;
  const apiKey = process.env.API_KEY;
  const units = "metric";
  const url = "https://api.openweathermap.org/data/2.5/weather?q=" + city +
  "&appid=" + apiKey + "&units=" + units;

  //get request feito por este servidor ao OpenWeatherMaps
  https.get(url, (response) => {

    //tratamento da resposta do OpenWeatherMaps
    response.on("data", (data) => {
      //ficheiro JSON recebido é traduzido (parsed) para notação JSON
      const parsedWeatherData = JSON.parse(data);
      //atributos relevantes dos dados recebidos armazenados
      weatherData = {
        city: city,
        temp: parsedWeatherData.main.temp,
        dscpt: parsedWeatherData.weather[0].description,
        icon: parsedWeatherData.weather[0].icon
      }
    });
  });
  res.redirect("back");
});


app.get("/contact", (req, res) => {
  res.render("contact", {
    contactDescription: contactContent,
    weatherData: weatherData
  });
});


app.get("/about", (req, res) => {
  res.render("about", {
    aboutDescription: aboutContent,
    weatherData: weatherData
  });
});


app.get("/compose", (req, res) => {
  res.render("compose", {
    weatherData: weatherData
  });
});


app.get("/posts/:postID", (req, res) => {
  const postID = req.params.postID;

  Post.findOne(
    {_id: postID},//filter
    (err, foundPost) => {
    if (!err) {
      if (foundPost) {
        res.render("post", {
          postTitle: foundPost.title,
          postBody: foundPost.body,
          weatherData: weatherData
        });
      } else {
        console.log("error: post not found!");
      }
    }
  });
});


app.post("/compose", (req, res) => {

  const postTitle = req.body.postTitle;
  const postBody = req.body.postBody;

  const post = new Post ({
    title: postTitle,
    body: postBody
  });

  post.save();
  res.redirect("/");
})


app.listen(3000, () => {
  console.log("Server started on port 3000");
});
