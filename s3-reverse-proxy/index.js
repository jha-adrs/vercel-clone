const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const PORT = 8000;
const BASE_PATH = 'https://vercel-clone-outputs-6783.s3.ap-south-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy();
app.use((req, res) => {
    //Catch all requests and proxy them to S3
    console.log('Proxying request to S3', req.hostname, req.url);
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    const resolvesTo = `${BASE_PATH}/${subdomain}`;
    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });

})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if(url === '/') {
        console.log('Redirecting to index.html',proxyReq.path);
        proxyReq.path += 'index.html';
        console.log('Redirected to index.html',proxyReq.path);
    }
})

app.listen(PORT, () => {
    console.log(`Proxy Server is running on port ${PORT}`);
});