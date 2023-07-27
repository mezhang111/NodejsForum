const { BlobServiceClient } = require("@azure/storage-blob");
const config = require("../params/params").BLOB;
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();

const connStr = config.CONNECTIONSTRING;
const containerName = config.CONTAINERNAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Create a container
async function createNewContainer(){
    const createContainerResponse = await containerClient.createIfNotExists();
    console.log(`Create container ${containerName} successfully`, createContainerResponse.requestId);
}

async function uploadBlob(blobName, content){
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.upload(content, content.length);
    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);
}

async function downloadBlob(blobName){
    const blobClient = containerClient.getBlobClient(blobName);

    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = (
        await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
    );
    //console.log("Downloaded blob content:", downloaded);
    return downloaded;
}

// [Node.js only] A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

module.exports={
    blobServiceClient: blobServiceClient,
    containerClient: containerClient,
    uploadBlob: uploadBlob,
    downloadBlob: downloadBlob,
}