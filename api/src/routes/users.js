const router = require('express').Router();

/*Models*/
const User = require('../models/User.model');
const UserSession = require('../models/UserSession.model');

const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

//Display user's informations ONLY
router.route('/').get(auth,(req,res)=> {
    const userId = req.cookies['userId'] || req.query.userId;

    User.findById(userId)
        .then(user => {
            res.json(user)
        })
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/signup').post((req, res) => {

    const user = new User({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        university: req.body.university,
        password: req.body.password
    });

    user.password = user.generateHash(req.body.password);

    user.save().then(
        () => {
            res.status(201).json({
                message: 'User added successfully!'
            });
        }
    ).catch(
        (error) => {
            res.status(500).json({
                error: error
            });
        }
    );
});

router.route('/login').post((req, res) => {

    User.findOne({ email: req.body.email }).then(
        (user) => {
            if (!user) {
                return res.json({
                    msg: 'User not found.', success:false
                });
            }

            if(user.validPassword(req.body.password))
            {
                const token = jwt.sign(
                    { userId: user._id },
                    'RANDOM_TOKEN_SECRET',
                    { expiresIn: '24h' });

                UserSession.replaceOne({userId: user._id},{userId: user._id, token: token},{ upsert: true })
                    .then((session) => {
                        //console.log("replaceOne worked " + session);
                        res.status(200).json({
                            userId: user._id,
                            token: token,
                            expiresIn: 1,
                            success:true
                        });
                    })
                    .catch((err) => {
                        res.status(401).json('Error replaceOne: ' + err);
                    });

            }
            else
            {
                return res.status(200).json({
                    msg: 'Incorrect password.',
                    success:false
                });
            }
        }
    ).catch(
        (error) => {
            res.status(500).json({
                error: error
            });
        }
    );
});

router.route('/logout').get(auth,(req, res) => {

    const userId = req.cookies['userId'] || req.query.userId;
    res.clearCookie("token");
    res.clearCookie("userId");
    UserSession.findOneAndDelete({userId:userId})
        .then(() => {
            res.status(200).json("Done!");
        })
        .catch((err) => {
            res.status(400).json('Error: ' + err);
        })

});

/*This endpoint allow the frontend to check if the user is login*/
router.route('/auth').get(auth,(req, res) => {
    res.status(200).json(true);
});

router.route('/test').get((req, res) => {
    res.status(200).json(req.query);
});


/*
router.route('/:id').get((req,res)=> {
   User.findById(req.params.id)
       .then(user => res.json(user))
       .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req,res)=> {
    User.findByIdAndDelete(req.params.id)
        .then(() => res.json('Deleted!'))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req,res)=>{
    User.findById(req.params.id)
        .then(user => {
            user.username = req.body.username;
            user.password = req.body.password;

            user.save()
                .then(() => res.json('Saved!'))
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));
});*/


module.exports = router;
