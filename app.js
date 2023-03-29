const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require("https");
const _ = require("lodash");
const mongoose = require("mongoose");

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const newsContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose stuff
main().catch(err => console.log(err));

async function main(){
  const url = 'mongodb://0.0.0.0:27017';
  const dbPath = "/blogDB";
  await mongoose.connect(url + dbPath, {useNewUrlParser: true});

  //create new schema
  const postSchema = {
    title: String, 
    content: String
  };

  //create new model
  const Post = mongoose.model("Post", postSchema);

  //global var
  //let posts = [];
  let titles = [];
  let articleUrls = [];
  let sources = [];
  let publishedAt = [];
  let descriptions = [];
  let urlImages = [];

  //Routes the HTTP GET Requests to root with the specified callback functions.
  app.get("/", function(req, res){
    Post.find().exec()
    .then((posts) => {
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
      });
    })
    .catch((err) => {
      console.log(err);
    })
    
  });

  app.get("/about", function(req, res){
    res.render("about", {aboutContent: aboutContent});
  });

  app.get("/news", function(req, res){
    //console.log(titles);
    res.render("news", {
      newsContent: newsContent,
      titles: titles,
      articleUrls: articleUrls,
      sources: sources,
      publishedAt: publishedAt,
      descriptions: descriptions,
      urlImages: urlImages
    });
  });

  app.post("/news", function(req, res){
    const userAgent = req.get('user-agent');
    const keyw = _.kebabCase(req.body.keywordString);
    var source = _.kebabCase(req.body.sourceString);
    console.log(keyw + "  " + source);
    
    if (source.length != 0)
      source = "&sources=" + source;

    const apikey = "d246cd11046d4e41ac56e8ad615f914c";
    const url = "https://newsapi.org/v2/everything?q=" 
                + keyw + source 
                + "&sortBy=popularity&apiKey=" + apikey;

    console.log(url);

    const options = {headers: {'User-Agent': userAgent}};

    https.get(url, options, function(response) {
      console.log(response.statusCode);
      let data = '';
      //titles = [];

      response.on("data", function(chunk) {
        data += chunk;
      });

      response.on("end", function(){
        const newsData = JSON.parse(data);
        //console.log(newsData);
        //newsData.articles.length / 5
        for (let i = 0; i < 15; i++){
          // if (newsData.articles[i] != null){
            titles[i] = newsData.articles[i].title;
            articleUrls[i] = newsData.articles[i].url;
            sources[i] = newsData.articles[i].source.name;
            publishedAt[i] = newsData.articles[i].publishedAt;
            descriptions[i] = newsData.articles[i].description;
            urlImages[i] = newsData.articles[i].urlToImage;
          //}
        }
      });
    }).on("error", function(error){
      console.error(error);
    });

    res.redirect("news");
  });

  app.get("/compose", function(req, res){
    res.render("compose");
  });

  app.post("/compose", function(req, res){
    const post = new Post ({
      title: req.body.postTitle,
      content:req.body.postBody
    });

    //posts.push(post);
    post.save()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
  });

  app.get("/posts/:postId", function(req, res){

    const reqPostId = req.params.postId;

    Post.findOne({_id: reqPostId})
    .then((post) => {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    });
  });

  app.post("/delete", function(req, res) {
    const deletePostId = req.body.postId;
    console.log(deletePostId);

    Post.findByIdAndDelete(deletePostId)
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });

  });

  app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
}

