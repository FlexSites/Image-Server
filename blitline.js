import Promise from 'bluebird';
import request from 'superagent';
import { get } from 'object-path';

let appId = process.env.BLITLINE_APP_ID;

export default class BlitLine {
  constructor() {
    this.jobs = [];
  }

  add(job) {
    this.jobs.push(job);
  }

  send(job) {
    job.application_id = appId;
    this.add(job);
    return this.post();
  }

  post() {
    var body = JSON.stringify({ json: this.jobs });
    this.jobs = [];
    return Promise.fromNode(cb => request
      .post('https://api.blitline.com/job')
      .send(body)
      .set('Content-Length', body.length)
      .set('Content-Type', 'application/json')
      .end((err, res = {}) => {
        // console.log('arguments', arguments);
        // console.log('body', Object.keys(res), 'thing', res.text, 'after.thing', res.body);
        cb(get(res, 'body.results.error', err), get(res, 'body.results'));
      }));
  }
}
