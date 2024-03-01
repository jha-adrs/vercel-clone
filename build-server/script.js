const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { Redis } = require('ioredis')
const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_SECRET,
    },
});


const PROJECT_ID = process.env.PROJECT_ID;
const publisher = new Redis(process.env.REDIS_URL);
function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(log));
}
async function init() {

    console.log('init');
    console.log('Building project', process.env.PROJECT_ID, process.env.AWS_S3_BUCKET);
    publishLog({ type: 'info', message: 'Building project' });
    const outDirPath = path.join(__dirname, 'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)
    p.stdout.on('data', function (data) {
        console.log(data?.toString());
        publishLog({ type: 'info', message: data?.toString() });
    })
    p.stderr.on('error', function (data) {
        console.log(data?.toString());
        publishLog({ type: 'error', message: data?.toString() });
    })
    p.on('close', async function (code) {
        console.log("Build complete");
        publishLog({ type: 'info', message: 'Build complete' });
        const distFolderPath = path.join(__dirname, 'output/dist');
        const folderContents = fs.readdirSync(distFolderPath, {
            recursive: true
        });
        publishLog({ type: 'info', message: `Uploading to server` });
        for (const file of folderContents) {
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue;
            console.log(`Uploading ${filePath}`)
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath) || 'application/octet-stream',
            })
            const response = await s3Client.send(command);
            console.log("Finished uploading",response);
            
        }
        console.log("Finished uploading");
        publishLog({ type: 'info', message: `Finished uploading` });
         // Close the publisher and exit
            publisher.quit();
            process.exit(0);
            
    })
}
init()