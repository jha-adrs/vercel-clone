const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    },
});

const PROJECT_ID = "";

async function init() {
    console.log('init');
    const outDirPath = path.join(__dirname, 'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)
    p.stdout.on('data', function (data) {
        console.log(data?.toString());
    })
    p.stderr.on('error', function (data) {
        console.log(data?.toString());
    })
    p.on('close', async function (code) {
        console.log("Build complete");
        const distFolderPath = path.join(__dirname, 'output/dist');
        const folderContents = fs.readdirSync(distFolderPath, {
            recursive: true
        });

        for (const filePath of folderContents) {
            if (fs.lstatSync(filePath).isDirectory()) continue;
            console.log(`Uploading ${filePath}`)
            const command = new PutObjectCommand({
                Bucket: "",
                Key: `__outputs/${PROJECT_ID}/${filePath}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath) || 'application/octet-stream',
            })
            const response = await s3Client.send(command);
            console.log("Finished uploading",response);
        }
    })
}