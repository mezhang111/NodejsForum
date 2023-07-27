var multer = require("multer");

var crypto = require("crypto");

var path = require("path");

var storage = multer.diskStorage({
    destination: "./uploads/images",
    filename: function(req, file, cb){
        crypto.pseudoRandomBytes(16, function(err, raw){
            cb(null, raw.toString('hex')+Date.now()+path.extname(file.originalname));
        });
    }
});


var uploadImage = multer({storage: storage});

module.exports = {
    uploadImage: uploadImage
}