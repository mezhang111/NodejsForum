var express = require("express");

var ensureAuthenticated = require("../../auth/auth").ensureAuthenticated;

var fs = require('fs');

var Post = require("../../models/post");

var router = express.Router();

var upload = require("../../storage/image").uploadImage;
const blobDict = require("../../blob/blob");
const blobServiceClient = blobDict.blobServiceClient;
const containerClient = blobDict.containerClient;
const downloadBlob = blobDict.downloadBlob;

router.use(ensureAuthenticated);

router.get("/", async function(req, res){
    try{
        var posts = await Post.find({userID:req.user._id});
        for(const p of posts){
            if(p.image != null){
                if(!fs.existsSync(p.image)){
                    const downloaded = await downloadBlob(getFilename(p.image));
                    fs.writeFileSync(p.image, downloaded);
                }
            }
        }
        res.render("post/posts", {posts:posts});
    }catch(err){
        console.log(err);
        res.status(500).send(err);
    }
    /*
    Post.find({userID:req.user._id}).exec(async function(err, posts){
        if(err){console.log(err);}
        posts.forEach(async (p, i) => {
            
        });
        res.render("post/posts", {posts:posts});
    });
    */
 });


 router.get("/add", function(req, res){
    res.render("post/addpost");
 });

 router.post("/add", upload.single('image'), async function(req, res){
    try{
        var newPost = new Post({
            title:req.body.title,
            content:req.body.content,
            userID:req.user._id,
        });
        if(req.file != undefined){
            newPost.image = req.file.path;
            const blockBlobClient = containerClient.getBlockBlobClient(getFilename(req.file.path));
            const response = await blockBlobClient.uploadFile(req.file.path);
            console.log(response);
        }
        savePost(newPost, res,() => {res.redirect("/posts/"+newPost._id);});
    }catch(err){
        deleteLocalFile(req.file.path);
        console.log(err);
        res.status(500).send(err);
    }
 });

 //: means a route parameter
 //localhost:3000/posts/12345 -> fetch the post with id 12345
 router.get("/:postId", function(req, res){
    Post.findById(req.params.postId).exec(function(err, post){
        res.render("post/detailpost", {post: post});
    });
 });

 router.get("/edit/:postId", function(req, res){
    Post.findById(req.params.postId).exec(function(err, post){
        res.render("post/editpost", {post: post});
    });
 });

 router.post("/update", upload.single('image'), async function(req, res){
    const post = await Post.findById(req.body.postid);
    post.title = req.body.title;
    post.content = req.body.content;

    if(req.file != undefined){
        if(post.image != null){
            deleteLocalFile(post.image);
            containerClient.deleteBlob(getFilename(post.image));
        }
        const blockBlobClient = containerClient.getBlockBlobClient(getFilename(req.file.path));
        const response = await blockBlobClient.uploadFile(req.file.path);
        console.log(response);
        post.image = req.file.path;
    }
    savePost(post, res, () => {res.redirect("/posts/"+req.body.postid);});
 });

 router.get("/delete/:postId", async function(req, res){
    try{
        let deletedPost = await Post.findByIdAndRemove(req.params.postId);
        //console.log(deletedPost);
        if(deletedPost.image != null){
            deleteLocalFile(deletedPost.image);
            containerClient.deleteBlob(getFilename(deletedPost.image));
        }
        res.redirect("/posts");
    }catch(err){
        console.log("error happend");
        res.status(500).send(err);
    }
    
 });

 router.post("/deleteImage", async function(req, res){
    try{
        let post = await Post.findById(req.body.postid);
        if(post.image != null){
            deleteLocalFile(post.image);
            containerClient.deleteBlob(getFilename(post.image));
            post.image=null;
        }
        savePost(post, res, () => {res.redirect("/posts");});
    }catch(err){
        console.log("error happend");
        res.status(500).send(err);
    }
 });

async function savePost(post, res, cb){
    //post.save(callback error handling function) unrecommended but work: we can save the new record ton the database
    try{
        let savePost = await post.save(); //asynchronous save, introduce quasi parallelism, more performant
        cb();
    } catch(err){
        console.log("error happend");
        res.status(500).send(err);
    }
}

function deleteLocalFile(path){
    console.log(path);
    let deleted = fs.unlink(path, function(err){
        console.log(err);
    });
}

function getFilename(path){
    const charArry = path.split("/");
    const filename = charArry[charArry.length-1];
    return filename;
}
module.exports = router;
