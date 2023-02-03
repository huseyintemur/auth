//jshint esversion:6
require("dotenv").config(); /* bu kod satırı hep en üstte olmak zorunda */
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
  
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

/* passport-local için bir sabit oluşturmadık, çünkü kodda açıkça kullanılamyacak. Ama
   zaten dependency lerde var olduğu için o yeterli oluyormuş.
*/

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



/*session ile ilgili kodun mongoose baglantısından hemen önce olması önemli. */
/* aşağıdaki kod ile session başlatıyoruz. */
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

/* aşağıda passport u başlatıyoruz. */
app.use(passport.initialize());

/* passport session kullanmaya başlıyoruz. */
app.use(passport.session());

/////////////////////////////////mongoose ///////////////////////////////

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema ({
    email   : String, 
    password : String
});

/*  userSchema yı oluşururken bir javascript nesnesi olarak oluşturmadık yukarda DİKKAT!
    bir mongoose nesnesi olarak oluşturuyoruz. Yani mongoose.Schema olarak oluşturuyoruz.
     Ve aşağıdaki kod ile passportLocalMongoose u 
    plugin olarak ona iliştiriyoruz.
*/
userSchema.plugin(passportLocalMongoose);
  
const User = mongoose.model("User", userSchema);

///////////////////////// mongoose ////////////////////////////////////

/* passport-local i aşağıda kapalı şekilde kullanıyoruz. */
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser()); /* cookie yarattık ve içini bilgilerle doldurduk */
passport.deserializeUser(User.deserializeUser());  /* sonra cookie yi yok ettik. */


app.get("/", function(req,res){

    res.render("home");

});


app.get("/login", function(req,res){

    res.render("login");

});

app.get("/register", function(req,res){

    res.render("register");

});


app.get("/secrets", function(req,res){

    if(req.isAuthenticated()){
        res.render("secrets");
    }else {
        res.redirect("/login");
    }


});


app.get("/logout", function(req,res){

    req.logOut(function(err) {
        if (err) { return next(err); }
        console.log( "logout yaptı.");
        res.redirect('/');
        
    });

});



app.post("/register", function(req,res){

    /* Aşağıda mongo db ile direkt etkileşime geçmeden, loal mongoose yardımıyla ki yukarda ayarladık,
       kullanıcıyı mongodb ye kaydediyoruz. Kayıt işlemi başarılı ise callback fonksiyon çağrılıyor,
       Hatalı ise hatayı log edip kullanıcıyı tekrar register sayfasına yani aynı sayfaya yönlendiriyoruz.
       Başarılı kayıttan sonra kullanıcıyı otantike etmeye çalışıyoruz. Eğer otantikasyon başarılı ise
       içerdeki callback çağrılıyor. O callback in içinde ise nihayet ulaşmaya çalıştığımız sayfa secrets a 
       ulaşıyoruz.
       Not: Bu otantikasyon local dir.
       
    */
  User.register({username: req.body.username}, req.body.password, function(err, user){

     if(err){
        console.log(err);
        res.redirect("/register");
     }else {
        passport.authenticate("local", {
            failureRedirect: "/register",
            failureMessage: true 
         })(req,res, function(){
            console.log(user.username + " kayıt oldu ve giriş yaptı. ");
            res.redirect("/secrets");
       
        });   
     }

  });


});



app.post("/login", function(req,res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }else {
            passport.authenticate("local", {
                failureRedirect: "/login",
                failureMessage: true 
             })(req,res, function(){
                console.log( user.username+ "  login oldu.");
                res.redirect("/secrets");
              
            });
        }
    });


});













app.listen(3000, function() {
    console.log("Server started on port 3000");
});