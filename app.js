import express from 'express';
import { S3 } from 'aws-sdk';
import Promise from 'bluebird';
import BlitLine from './blitline';
import { variation } from './utils';
import config from 'config';
import httpProxy from 'http-proxy';
import debug from 'debug';
import path from 'path';
import request from 'superagent';
import { get } from 'object-path';
import url from 'url';

let app = express();
let log = debug('fleximage');

let { s3: { bucket }, region } = config.get('aws');
console.log('bucket', bucket, region);
let s3 = new S3({
  apiVersion: '2006-03-01',
  params: {
    Bucket: bucket,
    Region: region,
  },
});
let queue = new BlitLine();

const PORT = config.get('port');
const S3_URL = `http://${bucket}.s3-website-${region}.amazonaws.com`

let getObject = Promise.promisify(s3.getObject, s3);
let proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  target: S3_URL,
});

function exists(Key) {
  return Promise.fromNode(cb => s3.headObject({ Key }, (err, data) => cb(null, !err && data)));
}

app.get('/*', (req, res, next) => {
  exists(`public${req.url}`)
    .then(data => {
      if (!data) {
        return sendJob(req.url)
          .then(src => {
            console.log('sending request', src);
            req.url = src;
          });
      }
      req.url = `public${req.url}`;
      return data;
    })
    .then(data => sendObj(req, res, data))
    .catch(ex => {
      console.error(ex.message, ex.stack);
    })
})

function sendObj(req, res, data) {
  console.log('sending objects!!!!', req.url);
  if (data) res.set('ETag', data.ETag);
  res.set('Cache-Control', 'public, max-age=31556926');
  proxy.web(req, res, {});
  proxy.on('error', ex => {
    throw new Error(ex);
  });
}

function poll(jobID) {
  return Promise.fromNode(cb =>
    request
      .get(`http://cache.blitline.com/listen/${jobID}`)
      .end(cb)
  );
}

function sendJob(dest) {
  let ext = path.extname(dest);
  let resolution = path.basename(dest, ext);
  let src = variation('original', dest);
  console.log('dest', resolution, src, dest);
  if (src === dest) return Promise.resolve(dest);
  return queue.send({
    src: `${S3_URL}${src}`,
    functions: [
      {
        name: 'imagga_smart_crop',
        params: {
          resolution,
          no_scaling: 0,
        },
        save: {
          quality: 80,
          image_identifier: resolution,
          s3_destination: {
            bucket,
            key: `public${dest}`,
          },
        },
      },
    ],
  })
  .then(data => poll(get(data, '0.job_id')))
  .return(`public${dest}`)
}



app.listen(PORT, () => {
  console.log('stuff');
  log('Image server is up on port %n', PORT);
});

// 8495 4446 7019 7875

// 8556523446
