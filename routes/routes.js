const express = require('express')
const session = require('express-session');
const User = require('../src/configure');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { next } = require('cli');
const { title } = require('process');
const { type } = require('os');
const fs = require('fs')

const  router = express();
const bodyParser = require('body-parser');


// Parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

// Parse application/json
router.use(bodyParser.json());
//router session
router.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads') // Specify the directory where uploaded files should be stored
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()) // Define how uploaded files should be named
    }
  });
  
  var upload = multer({ storage: storage }).single('fileFieldName'); // Specify the field name used for file uploads
  

// insert an user into database route
router.post('/add', upload, async (req, res) => {
    try {
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const user = new User({
            name: req.body.name,
            password: hashedPassword, // Assign the hashed password to the user object
        });

        await user.save(); // Save the user with the hashed password to the database

        // Set session message for success
        req.session.message = {
            type: 'success',
            message: 'User added successfully',
        };
        res.redirect('/');
    } catch (err) {
        // Set session message for error
        req.session.message = {
            type: 'danger',
            message: err.message,
        };
        res.redirect('/');
    }
});


// get all users route
router.get('/add',(req,res)=>{
    res.render('add_user',{title:'add users'})
})
router.get('/', async (req, res) => {
    try {
        const users = await User.find(); // Assuming User is your Mongoose model
        res.render('adminhome', { user: users ,title:'admin' }); // Pass 'users' or any other relevant data
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

// edit an user routes
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (user == null) {
                res.redirect('/');
            } else {
                res.render('edit_user', {
                    title: "edit user",
                    user: user,
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect('/');
        });
});
// update user routes
router.post('/update/:id', upload, async (req, res) => {
    try {
        let id = req.params.id;

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedpassword = await bcrypt.hash(req.body.password, saltRounds);

        const updateData = {
            name: req.body.name,
            password: hashedpassword,
        };

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
            return res.json({ message: 'User not found', type: 'danger' });
        }

        req.session.message = {
            type: 'success',
            message: 'User updated',
        };
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', type: 'danger' });
    }
});
// user delete
router.get('/delete/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Find the user by ID and delete
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found', type: 'danger' });
        }

        req.session.message = {
            type: 'success',
            message: 'User deleted',
        };
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', type: 'danger' });
    }
});



module.exports = router;