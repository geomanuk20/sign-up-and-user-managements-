const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const session = require('express-session')
const collection = require('./configure')
const { title } = require('process')

const app = express()

app.set('view engine', 'ejs');

// routes prefix
app.use('',require('../routes/routes'))

//convert data into json format
app.use(express.json());

app.use(express.urlencoded({extended : false}))

app.use(
    session({
        secret:'my secret key',
        saveUninitialized: true,
        resave:false,
    })
)
app.use((req,res,next)=>{
    res.locals.message = req.session.message;
    delete req.session.message;
    next()
})

app.use(express.static('public')); // css file access
app.use("/public",express.static('public')); // image file access using code


app.get('/login',(req,res)=>{
    res.render('login');
})
app.get('/signup',(req,res)=>{
    res.render('signup')
})
app.get('/home',(req,res)=>{
    res.render('home')
})
app.get('/admin',(req,res)=>{
    res.render('admin')
})
app.get('/adminhome',(req,res)=>{
    res.render('adminhome',{title: 'adminhome'})
})
// signup

app.post('/signup', async(req,res)=>{
    const data = {
        name:req.body.username,
        password:req.body.password,
        repassword:req.body.repassword
        
    }
    //user allready exist
    if(data.password !== data.repassword){
        res.send('Passwords do not match. Please try again.');
        //res.status(400).json({ error: 'Passwords do not match. Please try again.' });
    }else{
    const existinguser = await collection.findOne({name: data.name})
    if(existinguser){
        res.send('user already exist')
        //res.status(400).json({ error: 'User already exists' });
    }else{
        //hash the password using bcrypt
        const salt = 10;
        const hashpassword = await bcrypt.hash(data.password,salt)

        data.password = hashpassword;

        const userdata = await collection.insertMany(data)
        console.log(userdata)
        res.send('<script>alert("User registered successfully"); window.location="/login";</script>');
        //const successMessage = 'User registered successfully';
        //const successMessage = 'Your success message here';
        //res.render('signup', { successMessage });
    }
 }
})

//login user

app.post('/login', async (req, res) =>{
    try{
        const check = await collection.findOne({name: req.body.username});
        if(!check){
            res.send('user name cannot found')
            return;
        }

        const passwordmatch = await bcrypt.compare(req.body.password, check.password)
        if(passwordmatch){
            res.render('home')
        }else{
            req.send('Wrong password')
        }
    }catch{
        res.send('Wrong details')
    }
})

//admin login

app.post('/admin', (req, res) => {
    const { username, password } = req.body;
  
    // Check for a predefined username and password (replace with a more secure method in production)
    if (username === 'admin@gmail.com' && password === '123456') {
      // Set session to mark the user as authenticated
      req.session.authenticated = true;
      res.redirect('/');
    }else {
      res.send('Incorrect username or password. <a href="/admin">Try again</a>');
    }
  });
// logout
app.post('/logout',(req,res)=>{
    req.session.destroy(err =>{
        if(err){
            console.log(err)
        }else{
            res.redirect('/login')
        }
    })
})
const port = 3011;
app.listen(port,()=>{
    console.log(`successfull ${port}`)
})







       /* $('#log').on('click',function(){
            Swal.fire({
              title: "error",
              text: "user already exists",
              icon: "success"
            });
          })*/