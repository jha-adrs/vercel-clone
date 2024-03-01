//handles all the aws related operations
const {ECSClient, RunTaskCommand} = require('@aws-sdk/client-ecs');
require('dotenv').config();
const ecsClient = new ECSClient({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_ACCESS_SECRET,
    }
});
const config = {
    CLUSTER: "",
    TASK: ""

};
async function runBuildServer(gitURL, slug, projectID){
    //Runs the build server   
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: [],
                securityGroups: [],
                assignPublicIp: "ENABLED"
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: "builder-image",
                    environment: [
                        {
                            name: "PROJECT_ID",
                            value: projectID
                        },
                        {
                            name: "GIT_REPOSITORY__URL",
                            value: gitURL
                        }
                    ]
                }
            ]
        }
    });

    const response = await ecsClient.send(command);
    console.log(`Build server started for ${slug}`);
    return response;
}   

module.exports= {
    runBuildServer
}
