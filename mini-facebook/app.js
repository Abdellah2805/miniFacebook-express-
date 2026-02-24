require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());
const PORT = 3000;
const mongoURI = process.env.MONGO_URI;
const User = require('./models/User.js');
const Post = require('./models/Post.js');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth.js');
const Comment = require('./models/Comment.js');
const cors = require('cors');
app.use(cors());



app.get('/', (req, res) =>  {
    res.send('Bienvenue sur mini facebook');
});
app.listen(PORT, () => {
    console.log('le serveur est lancé sur : localhost:3000');
});


app.post('/register',async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({
            username: username,
            password: password
        });

        await newUser.save();
        res.status(201).json({message: "Utilisateur crée avec succès"});

    } catch (error){
        res.status(400).json({ message: "Erreur lors de l'inscription", error: error.message});
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userFound = await User.findOne({username: username});
        
        if (!userFound) {
            return res.status(404).json({ message: "Utilisateur non trouvé"});

        }

        if (userFound.password !== password) {
            return res.status(401).json({ message: "Mot de passe incorrect" });

        }

        const token = jwt.sign(
                { userId: userFound._id},
                process.env.JWT_SECRET,
                { expiresIn: '24h'}
            );

        res.status(200).json({
            message: "Connexion réussie",
            token: token,
            user: userFound._id
            
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message});
    }
});

app.post('/posts', auth,  async (req, res) => {
    try {
        const { content, author } = req.body;
        const newPost = new Post({
            content: content,
            author: req.auth.userId
        });

        await newPost.save();
        res.status(201).json({ message: "Post publié avec succès", post: newPost });
    } catch (error) {
        res.status(400).json({message: "Erreur lors de la publication"});
    }
 });


app.post('/posts/:id/comments', auth, async (req, res) => {
    try {
        const newComment = new Comment({
            content: req.body.content, 
            author: req.auth.userId,   
            post: req.params.id        
        });

        await newComment.save();
        res.status(201).json({ message: "Commentaire ajouté !", comment: newComment });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Erreur lors de l'ajout du commentaire" });
    }
});


app.get('/all-comments', async (req, res) => {
    try {
        const globalComments = await Comment.find()
            .populate('author', 'username')
            .populate('post', 'content') 
            .sort({ createdAt: -1 });
        res.status(200).json(globalComments);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du flux" });
    }
});


app.get('/posts', async (req, res) => {
    try {
        const allPosts = await Post.find().sort({ createdAt: -1});
        res.status(200).json(allPosts);

    } catch (error) {
        res.status(500).json({message: "Erruer de la récupération des posts"});
    }
});

app.put('/posts/:id',auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({message : "Post non trouvé "});
        }

        if (post.author.toString() !== req.auth.userId) {
            return res.status(403).json({ message: "Action interdite : ce n'est pas votre post !"});

        }

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { content: content},
            { new: true }
        );

        res.status(200).json({
            massage:"Post modifié avec succès !",
            post: updatedPost
        });
    

    } catch (error){
        res.status(500).json({message: "Erreur lors de la modification"});
    }
});

app.delete('/posts/:id',auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post non trouvé" });
        }

        if (post.author.toString() !== req.auth.userId) {
            return res.status(403).json({ message: "Requete non autorisée ! vous ne pouvez pas supprimer le poste d un autre auteur"});

        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post supprimé avec succès"});

    } catch (error) {
        res.status(500).json({message : "Erreur lors de la supression", error: error.message });
    }
});


app.delete('/comments/:id', auth, async (req, res) => {
    try{
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({message: "Commentaire non trouvé !"});
        }

        if (comment.author.toString() !== req.auth.userId) {
            return res.status(403).json({ message: "Action interdite : ce n'est pas votre commentaire"});
        }

        
        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Commentaire supprimé avec succès"});  

    } catch(error) {
        res.status(500).json({ message: "Erreur lors de la suppression du commentaire" });
    
    }

    
});












mongoose.connect(mongoURI)
    .then(() => console.log("Connecté au Cloud MongoDB Atlas"))
    .catch((err) => console.error("Erreur de connexion Atlas:", err));

    
